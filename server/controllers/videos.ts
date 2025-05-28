import { Request, Response } from 'express';
import { getCollection } from '../config/db';
import { deleteFile } from '../middleware/upload';
import { MongoVideo, insertVideoSchema } from '@shared/schema';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import path from 'path';
import fs from 'fs';
import ffprobe from 'node-ffprobe';

// Get video duration using node-ffprobe
const getVideoDuration = async (videoPath: string): Promise<string> => {
  try {
    console.log(`Getting duration for video: ${videoPath}`);
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file does not exist: ${videoPath}`);
    }

    // Use node-ffprobe to get video metadata
    const probeData = await ffprobe(videoPath);
    console.log(`Video metadata retrieved successfully`);
    
    // Get duration from format or video stream
    let durationSeconds = 0;
    
    if (probeData.format && probeData.format.duration) {
      durationSeconds = parseFloat(probeData.format.duration);
      console.log(`Duration from format: ${durationSeconds} seconds`);
    } else if (probeData.streams && probeData.streams.length > 0) {
      // Try to get duration from video stream
      const videoStream = probeData.streams.find(stream => stream.codec_type === 'video');
      if (videoStream && videoStream.duration) {
        durationSeconds = parseFloat(videoStream.duration);
        console.log(`Duration from video stream: ${durationSeconds} seconds`);
      }
    }
    
    if (durationSeconds <= 0) {
      throw new Error(`Invalid duration: ${durationSeconds}`);
    }

    // Format duration to MM:SS or HH:MM:SS
    const totalSeconds = Math.floor(durationSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formattedDuration;
    if (hours > 0) {
      formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    console.log(`Video duration: ${formattedDuration} (${durationSeconds} seconds)`);
    return formattedDuration;

  } catch (error) {
    console.error('Error getting video duration:', error);
    
    // Try to get file stats as final fallback
    try {
      const stats = fs.statSync(videoPath);
      console.log(`File size: ${stats.size} bytes`);
      
      // Estimate duration based on file size (very rough estimate)
      // Assuming average bitrate of 1Mbps
      const estimatedDurationSeconds = Math.max(60, Math.floor(stats.size / (1024 * 1024 / 8)));
      const hours = Math.floor(estimatedDurationSeconds / 3600);
      const minutes = Math.floor((estimatedDurationSeconds % 3600) / 60);
      const seconds = estimatedDurationSeconds % 60;
      
      let estimatedDuration;
      if (hours > 0) {
        estimatedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        estimatedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      console.log(`Using estimated duration: ${estimatedDuration}`);
      return estimatedDuration;
    } catch (statsError) {
      console.error('Failed to get file stats:', statsError);
    }
    
    // Final fallback
    console.warn('Using default duration of 1:00');
    return '1:00';
  }
};

// Generate thumbnail from video
const generateThumbnail = async (videoPath: string): Promise<string> => {
  try {
    const thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');
    const thumbnailPath = path.join(thumbnailDir, `${path.parse(videoPath).name}.jpg`);

    // Ensure thumbnail directory exists
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    // Generate thumbnail at 2 seconds to avoid black frames
    await execAsync(
      `ffmpeg -i "${videoPath}" -ss 00:00:02 -vframes 1 -vf "scale=320:240" "${thumbnailPath}"`
    );

    console.log(`Thumbnail generated: ${thumbnailPath}`);
    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
};

// Upload a new video
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const videoFile = req.file;
    const { title, description, category, tags } = req.body;

    if (!title) {
      // Delete the uploaded file
      deleteFile(videoFile.path);
      return res.status(400).json({ message: 'Title is required' });
    }

    // Get video duration
    console.log(`Processing video: ${videoFile.path}`);
    const duration = await getVideoDuration(videoFile.path);
    console.log(`Video duration determined: ${duration}`);

    // Generate thumbnail if not provided
    let thumbnailUrl = '';
    if (!req.body.thumbnailUrl) {
      try {
        const thumbnailPath = await generateThumbnail(videoFile.path);
        thumbnailUrl = `/uploads/thumbnails/${path.basename(thumbnailPath)}`;
      } catch (error) {
        console.error('Thumbnail generation error:', error);
      }
    } else {
      thumbnailUrl = req.body.thumbnailUrl;
    }

    // Process tags
    const processedTags = tags ? 
      (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : 
      [];

    // Create video document
    const newVideo: Omit<MongoVideo, '_id'> = {
      title,
      description: description || '',
      userId: req.userId,
      videoUrl: `/uploads/videos/${videoFile.filename}`,
      thumbnailUrl,
      views: 0,
      likes: 0,
      dislikes: 0,
      duration,
      category: category || '',
      tags: processedTags,
      createdAt: new Date()
    };

    console.log(`Saving video with duration: ${duration}`);
    
    const videosCollection = await getCollection('videos');
    const result = await videosCollection.insertOne(newVideo);

    console.log(`Video saved successfully with ID: ${result.insertedId}, duration: ${duration}`);

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        ...newVideo,
        _id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error uploading video:', error);

    // Delete the uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }

    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: fromZodError(error).message 
      });
    }

    res.status(500).json({ message: 'Internal server error during video upload' });
  }
};

// Get all videos
export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '12', category, search } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 12;
    const skip = (pageNum - 1) * limitNum;

    const videosCollection = await getCollection('videos');
    const usersCollection = await getCollection('users');

    // Build query
    const query: any = {
      $or: [
        { isDeleted: { $exists: false } },
        { isDeleted: false }
      ]
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      // Helper function to calculate Levenshtein distance
      const levenshteinDistance = (str1: string, str2: string): number => {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        
        for (let i = 0; i <= str1.length; i += 1) {
          matrix[0][i] = i;
        }
        
        for (let j = 0; j <= str2.length; j += 1) {
          matrix[j][0] = j;
        }
        
        for (let j = 1; j <= str2.length; j += 1) {
          for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1, // deletion
              matrix[j - 1][i] + 1, // insertion
              matrix[j - 1][i - 1] + indicator, // substitution
            );
          }
        }
        
        return matrix[str2.length][str1.length];
      };

      // Helper function to check if two strings are similar
      const isSimilar = (str1: string, str2: string, threshold: number = 0.7): boolean => {
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0) return true;
        
        const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
        const similarity = (maxLength - distance) / maxLength;
        return similarity >= threshold;
      };

      // Helper function to check fuzzy match
      const fuzzyMatch = (text: string, searchTerm: string): boolean => {
        if (!text) return false;
        
        const textLower = text.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        // Exact substring match (highest priority)
        if (textLower.includes(searchLower)) return true;
        
        // Word-level fuzzy matching
        const textWords = textLower.split(/\s+/);
        const searchWords = searchLower.split(/\s+/);
        
        for (const searchWord of searchWords) {
          let foundMatch = false;
          for (const textWord of textWords) {
            // Check if words are similar (allowing for typos)
            if (isSimilar(textWord, searchWord, 0.7) || 
                textWord.includes(searchWord) || 
                searchWord.includes(textWord)) {
              foundMatch = true;
              break;
            }
          }
          if (!foundMatch) return false;
        }
        
        return true;
      };

      // Get all videos first, then apply fuzzy filtering
      const allVideos = await videosCollection.find({
        $or: [
          { isDeleted: { $exists: false } },
          { isDeleted: false }
        ]
      }).toArray();

      // Apply fuzzy search filtering
      const fuzzyFilteredVideos = allVideos.filter(video => {
        return fuzzyMatch(video.title, search as string) || 
               fuzzyMatch(video.description, search as string);
      });

      // Get the IDs of fuzzy matched videos
      const fuzzyMatchedIds = fuzzyFilteredVideos.map(video => video._id);

      // Update query to include both exact matches and fuzzy matches
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { _id: { $in: fuzzyMatchedIds } }
          ]
        }
      ];
    }

    // Get videos
    let videos = await videosCollection.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // If we have a search term, sort results by relevance (exact matches first)
    if (search) {
      const searchLower = (search as string).toLowerCase();
      videos.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        
        // Exact title matches first
        const aExactMatch = aTitle.includes(searchLower);
        const bExactMatch = bTitle.includes(searchLower);
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Then by creation date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    // Get total count
    const total = await videosCollection.countDocuments(query);

    // Get user info for each video
    const videoResults = await Promise.all(videos.map(async (video) => {
      const user = await usersCollection.findOne({ _id: new ObjectId(video.userId) });

      return {
        ...video,
        user: user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl
        } : null
      };
    }));

    res.status(200).json({
      videos: videoResults,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting videos:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get video by ID
export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { increment_view } = req.query;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const videosCollection = await getCollection('videos');
    const usersCollection = await getCollection('users');

    // Get video
    const video = await videosCollection.findOne({ _id: new ObjectId(id) });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if video is deleted
    if (video.isDeleted) {
      // Only allow owner to see deleted videos
      if (video.userId !== req.userId) {
        return res.status(404).json({ message: 'Video not found' });
      }
    }

    // Only increment view count if the increment_view query parameter is true
    if (increment_view === 'true') {
      console.log(`Incrementing view count for video ${id}`);
      await videosCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { views: 1 } }
      );
    }

    // Get user info
    const user = await usersCollection.findOne({ _id: new ObjectId(video.userId) });

    // Add to watch history if authenticated
    if (req.userId) {
      const historyCollection = await getCollection('watch_history');

      await historyCollection.updateOne(
        { userId: req.userId, videoId: id },
        { 
          $set: { 
            userId: req.userId, 
            videoId: id 
          }, 
          $currentDate: { watchedAt: true } 
        },
        { upsert: true }
      );
    }

    // Get like status if authenticated
    let likeStatus = null;
    if (req.userId) {
      const likesCollection = await getCollection('video_likes');
      const likeDoc = await likesCollection.findOne({
        userId: req.userId,
        videoId: id
      });

      if (likeDoc) {
        likeStatus = likeDoc.isLike ? 'like' : 'dislike';
      }
    }

    // Check subscription status if authenticated
    let isSubscribed = false;
    if (req.userId && user) {
      const subscriptionsCollection = await getCollection('subscriptions');
      const subscription = await subscriptionsCollection.findOne({
        subscriberId: req.userId,
        channelId: user._id.toString()
      });

      isSubscribed = Boolean(subscription);
    }

    res.status(200).json({
      video: {
        ...video,
        views: video.views + 1, // Include the increment we just did
        user: user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          subscribers: user.subscribers
        } : null,
        likeStatus,
        isSubscribed
      }
    });
  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update video
export const updateVideo = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const videosCollection = await getCollection('videos');

    // Check if video exists and belongs to user
    const video = await videosCollection.findOne({ _id: new ObjectId(id) });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.userId !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to update this video' });
    }

    const updateData: { [key: string]: any } = {};

    // Handle form data (multipart/form-data)
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category) updateData.category = req.body.category;
    
    // Handle tags
    if (req.body.tags) {
      try {
        const tags = typeof req.body.tags === 'string' ? 
          JSON.parse(req.body.tags) : req.body.tags;
        updateData.tags = Array.isArray(tags) ? tags : [];
      } catch (e) {
        updateData.tags = typeof req.body.tags === 'string' ? 
          req.body.tags.split(',').map(tag => tag.trim()) : 
          [];
      }
    }

    // Handle thumbnail upload
    if (req.file) {
      // Delete old thumbnail if it exists
      if (video.thumbnailUrl) {
        const oldThumbnailPath = path.join(process.cwd(), video.thumbnailUrl.replace(/^\//, ''));
        deleteFile(oldThumbnailPath);
      }
      
      updateData.thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Update video
    const result = await videosCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Get updated video
    const updatedVideo = await videosCollection.findOne({ _id: new ObjectId(id) });

    res.status(200).json({
      message: 'Video updated successfully',
      video: updatedVideo
    });
  } catch (error) {
    console.error('Error updating video:', error);

    // Delete uploaded file if there was an error
    if (req.file) {
      deleteFile(req.file.path);
    }

    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: fromZodError(error).message 
      });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete video (soft delete)
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const videosCollection = await getCollection('videos');

    // Check if video exists and belongs to user
    const video = await videosCollection.findOne({ _id: new ObjectId(id) });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.userId !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this video' });
    }

    // Soft delete - mark as deleted with 15 days restoration period
    const deletedAt = new Date();
    const canRestoreUntil = new Date(deletedAt.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 days

    await videosCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isDeleted: true,
          deletedAt: deletedAt,
          canRestoreUntil: canRestoreUntil
        }
      }
    );

    res.status(200).json({ 
      message: 'Video moved to trash successfully',
      canRestoreUntil: canRestoreUntil
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Like or dislike a video
export const likeVideo = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const { action } = req.body; // 'like', 'dislike', or 'none'

    if (!['like', 'dislike', 'none'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const videosCollection = await getCollection('videos');
    const likesCollection = await getCollection('video_likes');

    // Check if video exists
    const video = await videosCollection.findOne({ _id: new ObjectId(id) });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if user already liked/disliked
    const existingLike = await likesCollection.findOne({
      userId: req.userId,
      videoId: id
    });

    let likeDelta = 0;
    let dislikeDelta = 0;

    // Handle existing like/dislike
    if (existingLike) {
      if (action === 'none') {
        // Remove like/dislike
        await likesCollection.deleteOne({
          userId: req.userId,
          videoId: id
        });

        if (existingLike.isLike) {
          likeDelta = -1;
        } else {
          dislikeDelta = -1;
        }
      } else if ((action === 'like' && !existingLike.isLike) || 
                (action === 'dislike' && existingLike.isLike)) {
        // Change from like to dislike or vice versa
        await likesCollection.updateOne(
          { userId: req.userId, videoId: id },
          { $set: { isLike: action === 'like' } }
        );

        if (action === 'like') {
          likeDelta = 1;
          dislikeDelta = -1;
        } else {
          likeDelta = -1;
          dislikeDelta = 1;
        }
      }
      // If action matches current state, do nothing
    } else if (action !== 'none') {
      // Create new like/dislike
      await likesCollection.insertOne({
        userId: req.userId,
        videoId: id,
        isLike: action === 'like',
        createdAt: new Date()
      });

      if (action === 'like') {
        likeDelta = 1;
      } else {
        dislikeDelta = 1;
      }
    }

    // Update video like/dislike counts
    if (likeDelta !== 0 || dislikeDelta !== 0) {
      await videosCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $inc: { 
            likes: likeDelta,
            dislikes: dislikeDelta
          } 
        }
      );
    }

    res.status(200).json({
      message: `Video ${action === 'none' ? 'rating removed' : action === 'like' ? 'liked' : 'disliked'} successfully`,
      likes: video.likes + likeDelta,
      dislikes: video.dislikes + dislikeDelta
    });
  } catch (error) {
    console.error('Error rating video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add video to watch later
export const addToWatchLater = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const videosCollection = await getCollection('videos');
    const watchLaterCollection = await getCollection('watch_later');

    // Check if video exists
    const video = await videosCollection.findOne({ _id: new ObjectId(id) });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if already in watch later
    const existing = await watchLaterCollection.findOne({
      userId: req.userId,
      videoId: id
    });

    if (existing) {
      return res.status(400).json({ message: 'Video already in watch later' });
    }

    // Add to watch later
    await watchLaterCollection.insertOne({
      userId: req.userId,
      videoId: id,
      addedAt: new Date()
    });

    res.status(200).json({ message: 'Added to watch later successfully' });
  } catch (error) {
    console.error('Error adding to watch later:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove from watch later
export const removeFromWatchLater = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const watchLaterCollection = await getCollection('watch_later');

    // Remove from watch later
    const result = await watchLaterCollection.deleteOne({
      userId: req.userId,
      videoId: id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Video not found in watch later' });
    }

    res.status(200).json({ message: 'Removed from watch later successfully' });
  } catch (error) {
    console.error('Error removing from watch later:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get watch later videos
export const getWatchLaterVideos = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const watchLaterCollection = await getCollection('watch_later');
    const videosCollection = await getCollection('videos');
    const usersCollection = await getCollection('users');

    // Get all watch later entries
    const watchLater = await watchLaterCollection.find({
      userId: req.userId
    }).toArray();

    if (watchLater.length === 0) {
      return res.status(200).json({ videos: [] });
    }

    // Get video IDs
    const videoIds = watchLater.map(item => new ObjectId(item.videoId));

    // Get videos
    const videos = await videosCollection.find({
      _id: { $in: videoIds }
    }).toArray();

    // Get user info for each video
    const videoResults = await Promise.all(videos.map(async (video) => {
      const user = await usersCollection.findOne({ _id: new ObjectId(video.userId) });
      const watchLaterEntry = watchLater.find(item => item.videoId === video._id.toString());

      return {
        ...video,
        addedAt: watchLaterEntry ? watchLaterEntry.addedAt : null,
        user: user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl
        } : null
      };
    }));

    // Sort by added date (newest first)
    videoResults.sort((a, b) => {
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });

    res.status(200).json({ videos: videoResults });
  } catch (error) {
    console.error('Error getting watch later videos:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get watch history
export const getWatchHistory = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const historyCollection = await getCollection('watch_history');
    const videosCollection = await getCollection('videos');
    const usersCollection = await getCollection('users');

    // Get watch history entries
    const history = await historyCollection.find({
      userId: req.userId
    }).sort({ watchedAt: -1 }).toArray();

    if (history.length === 0) {
      return res.status(200).json({ videos: [] });
    }

    // Get video IDs
    const videoIds = history.map(item => new ObjectId(item.videoId));

    // Get videos
    const videos = await videosCollection.find({
      _id: { $in: videoIds }
    }).toArray();

    // Get user info for each video
    const videoResults = await Promise.all(videos.map(async (video) => {
      const user = await usersCollection.findOne({ _id: new ObjectId(video.userId) });
      const historyEntry = history.find(item => item.videoId === video._id.toString());

      return {
        ...video,
        watchedAt: historyEntry ? historyEntry.watchedAt : null,
        user: user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl
        } : null
      };
    }));

    // Sort by watched date (newest first)
    videoResults.sort((a, b) => {
      return new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime();
    });

    res.status(200).json({ videos: videoResults });
  } catch (error) {
    console.error('Error getting watch history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Clear watch history
export const clearWatchHistory = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const historyCollection = await getCollection('watch_history');

    await historyCollection.deleteMany({
      userId: req.userId
    });

    res.status(200).json({ message: 'Watch history cleared successfully' });
  } catch (error) {
    console.error('Error clearing watch history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get liked videos
export const getLikedVideos = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const likesCollection = await getCollection('video_likes');
    const videosCollection = await getCollection('videos');
    const usersCollection = await getCollection('users');

    // Get all liked videos (not disliked)
    const likes = await likesCollection.find({
      userId: req.userId,
      isLike: true
    }).toArray();

    if (likes.length === 0) {
      return res.status(200).json({ videos: [] });
    }

    // Get video IDs
    const videoIds = likes.map(like => new ObjectId(like.videoId));

    // Get videos
    const videos = await videosCollection.find({
      _id: { $in: videoIds }
    }).toArray();

    // Get user info for each video
    const videoResults = await Promise.all(videos.map(async (video) => {
      const user = await usersCollection.findOne({ _id: new ObjectId(video.userId) });
      const likeEntry = likes.find(like => like.videoId === video._id.toString());

      return {
        ...video,
        likedAt: likeEntry ? likeEntry.createdAt : null,
        user: user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl
        } : null
      };
    }));

    // Sort by liked date (newest first)
    videoResults.sort((a, b) => {
      return new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime();
    });

    res.status(200).json({ videos: videoResults });
  } catch (error) {
    console.error('Error getting liked videos:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Restore deleted video
export const restoreVideo = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const videosCollection = await getCollection('videos');

    // Check if video exists and belongs to user
    const video = await videosCollection.findOne({ _id: new ObjectId(id) });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.userId !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to restore this video' });
    }

    if (!video.isDeleted) {
      return res.status(400).json({ message: 'Video is not deleted' });
    }

    // Check if restoration period has expired
    if (video.canRestoreUntil && new Date() > video.canRestoreUntil) {
      return res.status(400).json({ message: 'Restoration period has expired' });
    }

    // Restore video
    await videosCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $unset: { 
          isDeleted: "",
          deletedAt: "",
          canRestoreUntil: ""
        }
      }
    );

    res.status(200).json({ message: 'Video restored successfully' });
  } catch (error) {
    console.error('Error restoring video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get deleted videos for user
export const getDeletedVideos = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const videosCollection = await getCollection('videos');
    const usersCollection = await getCollection('users');

    // Get deleted videos for this user
    const deletedVideos = await videosCollection.find({
      userId: req.userId,
      isDeleted: true
    }).sort({ deletedAt: -1 }).toArray();

    // Get user info for each video
    const videoResults = await Promise.all(deletedVideos.map(async (video) => {
      const user = await usersCollection.findOne({ _id: new ObjectId(video.userId) });

      return {
        ...video,
        user: user ? {
          _id: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl
        } : null
      };
    }));

    res.status(200).json({ videos: videoResults });
  } catch (error) {
    console.error('Error getting deleted videos:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Permanently delete video
export const permanentlyDeleteVideo = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const videosCollection = await getCollection('videos');

    // Check if video exists and belongs to user
    const video = await videosCollection.findOne({ _id: new ObjectId(id) });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (video.userId !== req.userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this video' });
    }

    if (!video.isDeleted) {
      return res.status(400).json({ message: 'Video must be deleted first' });
    }

    // Delete video file
    if (video.videoUrl) {
      const videoPath = path.join(process.cwd(), video.videoUrl.replace(/^\//, ''));
      deleteFile(videoPath);
    }

    // Delete thumbnail file
    if (video.thumbnailUrl) {
      const thumbnailPath = path.join(process.cwd(), video.thumbnailUrl.replace(/^\//, ''));
      deleteFile(thumbnailPath);
    }

    // Delete video document
    await videosCollection.deleteOne({ _id: new ObjectId(id) });

    // Delete associated comments
    const commentsCollection = await getCollection('comments');
    await commentsCollection.deleteMany({ videoId: id });

    // Delete associated likes
    const likesCollection = await getCollection('video_likes');
    await likesCollection.deleteMany({ videoId: id });

    // Delete from watch history
    const historyCollection = await getCollection('watch_history');
    await historyCollection.deleteMany({ videoId: id });

    // Delete from watch later
    const watchLaterCollection = await getCollection('watch_later');
    await watchLaterCollection.deleteMany({ videoId: id });

    res.status(200).json({ message: 'Video permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};