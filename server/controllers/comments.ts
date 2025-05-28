import { Request, Response } from 'express';
import { getCollection } from '../config/db';
import { ObjectId } from 'mongodb';

// Add comment to a video
export const addComment = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { videoId } = req.params;
    const { content } = req.body;

    if (!ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    // Basic validation
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const videosCollection = await getCollection('videos');

    // Check if video exists
    const video = await videosCollection.findOne({ _id: new ObjectId(videoId) });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const commentsCollection = await getCollection('comments');

    // Create comment
    const newComment = {
      content: content.trim(),
      userId: req.userId,
      videoId,
      likes: 0,
      dislikes: 0,
      createdAt: new Date()
    };

    const result = await commentsCollection.insertOne(newComment);

    // Get user info for response
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        ...newComment,
        _id: result.insertedId.toString(),
        user: user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl
        } : null
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get comments for a video
export const getVideoComments = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const collection = await getCollection('comments');

    const comments = await collection.find({ videoId }).sort({ createdAt: -1 }).toArray();

    // Ensure we always return an array
    res.status(200).json({ comments: comments || [] });
  } catch (error) {
    console.error('Error getting video comments:', error);
    res.status(500).json({ message: 'Internal server error', comments: [] });
  }
};

// Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const commentsCollection = await getCollection('comments');

    // Check if comment exists and belongs to user
    const comment = await commentsCollection.findOne({ _id: new ObjectId(id) });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if comment belongs to user or video belongs to user
    if (comment.userId !== req.userId) {
      // If comment doesn't belong to user, check if the video belongs to user
      const videosCollection = await getCollection('videos');
      const video = await videosCollection.findOne({ _id: new ObjectId(comment.videoId) });

      if (!video || video.userId !== req.userId) {
        return res.status(403).json({ message: 'You do not have permission to delete this comment' });
      }
    }

    // Delete comment
    await commentsCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Like a comment
export const likeComment = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const commentsCollection = await getCollection('comments');
    const commentLikesCollection = await getCollection('comment_likes');

    // Check if comment exists
    const comment = await commentsCollection.findOne({ _id: new ObjectId(id) });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if already liked
    const existingLike = await commentLikesCollection.findOne({
      userId: req.userId,
      commentId: id
    });

    if (existingLike) {
      // Remove like
      await commentLikesCollection.deleteOne({
        userId: req.userId,
        commentId: id
      });

      // Decrement like count
      await commentsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { likes: -1 } }
      );

      return res.status(200).json({
        message: 'Comment unliked successfully',
        likes: comment.likes - 1
      });
    }

    // Add like
    await commentLikesCollection.insertOne({
      userId: req.userId,
      commentId: id,
      createdAt: new Date()
    });

    // Increment like count
    await commentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { likes: 1 } }
    );

    res.status(200).json({
      message: 'Comment liked successfully',
      likes: comment.likes + 1
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reply to a comment
export const replyToComment = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    // Basic validation
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const commentsCollection = await getCollection('comments');

    // Check if parent comment exists
    const parentComment = await commentsCollection.findOne({ _id: new ObjectId(id) });

    if (!parentComment) {
      return res.status(404).json({ message: 'Parent comment not found' });
    }

    // Create reply
    const newReply = {
      content: content.trim(),
      userId: req.userId,
      videoId: parentComment.videoId,
      parentCommentId: id,
      likes: 0,
      dislikes: 0,
      createdAt: new Date()
    };

    const result = await commentsCollection.insertOne(newReply);

    // Get user info for response
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) });

    res.status(201).json({
      message: 'Reply added successfully',
      reply: {
        ...newReply,
        _id: result.insertedId.toString(),
        user: user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl
        } : null
      }
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Dislike a comment
export const dislikeComment = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const commentsCollection = await getCollection('comments');
    const commentDislikesCollection = await getCollection('comment_dislikes');

    // Check if comment exists
    const comment = await commentsCollection.findOne({ _id: new ObjectId(id) });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if already disliked
    const existingDislike = await commentDislikesCollection.findOne({
      userId: req.userId,
      commentId: id
    });

    if (existingDislike) {
      // Remove dislike
      await commentDislikesCollection.deleteOne({
        userId: req.userId,
        commentId: id
      });

      // Decrement dislike count
      await commentsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { dislikes: -1 } }
      );

      return res.status(200).json({
        message: 'Comment undisliked successfully',
        dislikes: (comment.dislikes || 0) - 1
      });
    }

    // Add dislike
    await commentDislikesCollection.insertOne({
      userId: req.userId,
      commentId: id,
      createdAt: new Date()
    });

    // Increment dislike count
    await commentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { dislikes: 1 } }
    );

    res.status(200).json({
      message: 'Comment disliked successfully',
      dislikes: (comment.dislikes || 0) + 1
    });
  } catch (error) {
    console.error('Error disliking comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    // Validate videoId
    if (!videoId) {
      return res.status(400).json({ 
        comments: [],
        message: 'Video ID is required' 
      });
    }

    const commentsCollection = await getCollection('comments');
    const usersCollection = await getCollection('users');

    // Get all comments for this video (including replies)
    const allComments = await commentsCollection
      .find({ videoId })
      .sort({ createdAt: -1 })
      .toArray();

    // Separate main comments and replies
    const mainComments = allComments.filter(comment => !comment.parentCommentId);
    const replies = allComments.filter(comment => comment.parentCommentId);

    // Populate user data and organize replies under their parent comments
    const populatedComments = await Promise.all(
      mainComments.map(async (comment) => {
        try {
          const user = await usersCollection.findOne({ _id: new ObjectId(comment.userId) });
          
          // Find replies for this comment - sort by creation date
          const commentReplies = await Promise.all(
            replies
              .filter(reply => reply.parentCommentId === comment._id.toString())
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map(async (reply) => {
                const replyUser = await usersCollection.findOne({ _id: new ObjectId(reply.userId) });
                return {
                  ...reply,
                  _id: reply._id.toString(),
                  likes: reply.likes || 0,
                  dislikes: reply.dislikes || 0,
                  user: replyUser ? {
                    _id: replyUser._id,
                    username: replyUser.username || 'Unknown User',
                    avatarUrl: replyUser.avatarUrl || null
                  } : {
                    _id: null,
                    username: 'Unknown User',
                    avatarUrl: null
                  }
                };
              })
          );

          return {
            ...comment,
            _id: comment._id.toString(),
            likes: comment.likes || 0,
            dislikes: comment.dislikes || 0,
            replies: commentReplies,
            user: user ? {
              _id: user._id,
              username: user.username || 'Unknown User',
              avatarUrl: user.avatarUrl || null
            } : {
              _id: null,
              username: 'Unknown User',
              avatarUrl: null
            }
          };
        } catch (err) {
          console.error('Error populating user data for comment:', err);
          return {
            ...comment,
            _id: comment._id.toString(),
            likes: comment.likes || 0,
            dislikes: comment.dislikes || 0,
            replies: [],
            user: {
              _id: null,
              username: 'Unknown User',
              avatarUrl: null
            }
          };
        }
      })
    );

    // Always return comments array, even if empty
    res.status(200).json({ 
      comments: populatedComments || [],
      total: populatedComments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      comments: [],
      message: 'Internal server error' 
    });
  }
};