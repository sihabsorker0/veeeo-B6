import { 
  User, InsertUser, Video, InsertVideo, Comment, InsertComment,
  WatchHistory, InsertWatchHistory, WatchLater, InsertWatchLater,
  VideoLike, InsertVideoLike, Subscription, InsertSubscription,
  MongoUser, MongoVideo, MongoComment, MongoAd, MongoWithdrawRequest,
  InsertAd, InsertWithdrawRequest
} from "@shared/schema";
import { connectToDatabase, getCollection } from "./config/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: string): Promise<MongoUser | null>;
  getUserByUsername(username: string): Promise<MongoUser | null>;
  createUser(user: InsertUser): Promise<MongoUser>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<MongoUser | null>;
  
  // Video operations
  getAllVideos(options?: { limit?: number, skip?: number, category?: string, search?: string }): Promise<{ videos: MongoVideo[], total: number }>;
  getVideoById(id: string): Promise<MongoVideo | null>;
  createVideo(video: InsertVideo): Promise<MongoVideo>;
  updateVideo(id: string, videoData: Partial<InsertVideo>): Promise<MongoVideo | null>;
  deleteVideo(id: string): Promise<boolean>;
  incrementVideoViews(id: string): Promise<boolean>;
  
  // Comment operations
  getVideoComments(videoId: string): Promise<MongoComment[]>;
  createComment(comment: InsertComment): Promise<MongoComment>;
  deleteComment(id: string): Promise<boolean>;
  
  // Watch history operations
  addToWatchHistory(userId: string, videoId: string): Promise<boolean>;
  getWatchHistory(userId: string): Promise<{ videoId: string, watchedAt: Date }[]>;
  clearWatchHistory(userId: string): Promise<boolean>;
  
  // Watch later operations
  addToWatchLater(userId: string, videoId: string): Promise<boolean>;
  removeFromWatchLater(userId: string, videoId: string): Promise<boolean>;
  getWatchLater(userId: string): Promise<{ videoId: string, addedAt: Date }[]>;
  
  // Like operations
  likeVideo(userId: string, videoId: string, isLike: boolean): Promise<boolean>;
  removeLike(userId: string, videoId: string): Promise<boolean>;
  getLikedVideos(userId: string): Promise<{ videoId: string, createdAt: Date }[]>;
  
  // Subscription operations
  subscribe(subscriberId: string, channelId: string): Promise<boolean>;
  unsubscribe(subscriberId: string, channelId: string): Promise<boolean>;
  getSubscriptions(userId: string): Promise<{ channelId: string }[]>;
  
  // Admin operations
  getAdminStats(): Promise<{
    totalUsers: number;
    totalVideos: number;
    totalComments: number;
    totalViews: number;
    totalLikes: number;
    recentUsers: MongoUser[];
    recentVideos: MongoVideo[];
  }>;
  
  // Admin User Management
  getAllUsers(): Promise<MongoUser[]>;
  banUser(id: string, isBanned: boolean, banReason?: string): Promise<MongoUser | null>;
  
  // Admin Video Management 
  getAllVideosForAdmin(): Promise<MongoVideo[]>;
  
  // Ad operations
  getAllAds(): Promise<MongoAd[]>;
  getAdById(id: string): Promise<MongoAd | null>;
  createAd(ad: InsertAd): Promise<MongoAd>;
  updateAd(id: string, adData: Partial<InsertAd>): Promise<MongoAd | null>;
  deleteAd(id: string): Promise<boolean>;
  toggleAdStatus(id: string, isActive: boolean): Promise<boolean>;
  
  // Withdrawal operations
  getAllWithdrawRequests(status?: string): Promise<MongoWithdrawRequest[]>;
  getWithdrawRequestById(id: string): Promise<MongoWithdrawRequest | null>;
  createWithdrawRequest(request: InsertWithdrawRequest): Promise<MongoWithdrawRequest>;
  updateWithdrawRequest(id: string, data: Partial<{ status: string; adminNotes: string; processedAt: Date }>): Promise<MongoWithdrawRequest | null>;
  getWithdrawStats(): Promise<{
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalCompleted: number;
    totalAmount: number;
    pendingAmount: number;
  }>;
}

export class MongoDBStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<MongoUser | null> {
    if (!ObjectId.isValid(id)) return null;
    
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    return user as MongoUser | null;
  }
  
  async getUserByUsername(username: string): Promise<MongoUser | null> {
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ username });
    return user as MongoUser | null;
  }
  
  async createUser(user: InsertUser): Promise<MongoUser> {
    const usersCollection = await getCollection('users');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const newUser = {
      username: user.username,
      email: user.email || '',
      password: hashedPassword,
      avatarUrl: user.avatarUrl || '',
      subscribers: 0,
      createdAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    return {
      ...newUser,
      _id: result.insertedId.toString()
    } as MongoUser;
  }
  
  async updateUser(id: string, userData: Partial<InsertUser>): Promise<MongoUser | null> {
    if (!ObjectId.isValid(id)) return null;
    
    const usersCollection = await getCollection('users');
    
    const updateData: { [key: string]: any } = { ...userData };
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return result as MongoUser | null;
  }
  
  // Video operations
  async getAllVideos(options: { limit?: number, skip?: number, category?: string, search?: string } = {}): Promise<{ videos: MongoVideo[], total: number }> {
    const { limit = 20, skip = 0, category, search } = options;
    
    const videosCollection = await getCollection('videos');
    
    // Build query
    const query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await videosCollection.countDocuments(query);
    
    const videos = await videosCollection.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return { 
      videos: videos as MongoVideo[], 
      total 
    };
  }
  
  async getVideoById(id: string): Promise<MongoVideo | null> {
    if (!ObjectId.isValid(id)) return null;
    
    const videosCollection = await getCollection('videos');
    const video = await videosCollection.findOne({ _id: new ObjectId(id) });
    
    return video as MongoVideo | null;
  }
  
  async createVideo(video: InsertVideo): Promise<MongoVideo> {
    const videosCollection = await getCollection('videos');
    
    const newVideo = {
      ...video,
      views: 0,
      likes: 0,
      dislikes: 0,
      createdAt: new Date()
    };
    
    const result = await videosCollection.insertOne(newVideo);
    
    return {
      ...newVideo,
      _id: result.insertedId.toString()
    } as MongoVideo;
  }
  
  async updateVideo(id: string, videoData: Partial<InsertVideo>): Promise<MongoVideo | null> {
    if (!ObjectId.isValid(id)) return null;
    
    const videosCollection = await getCollection('videos');
    
    const result = await videosCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: videoData },
      { returnDocument: 'after' }
    );
    
    return result as MongoVideo | null;
  }
  
  async deleteVideo(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    
    const videosCollection = await getCollection('videos');
    
    const result = await videosCollection.deleteOne({ _id: new ObjectId(id) });
    
    return result.deletedCount > 0;
  }
  
  async incrementVideoViews(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    
    const videosCollection = await getCollection('videos');
    
    const result = await videosCollection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } }
    );
    
    return result.modifiedCount > 0;
  }
  
  // Comment operations
  async getVideoComments(videoId: string): Promise<MongoComment[]> {
    if (!ObjectId.isValid(videoId)) return [];
    
    const commentsCollection = await getCollection('comments');
    
    const comments = await commentsCollection.find({ videoId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return comments as MongoComment[];
  }
  
  async createComment(comment: InsertComment): Promise<MongoComment> {
    const commentsCollection = await getCollection('comments');
    
    const newComment = {
      ...comment,
      likes: 0,
      createdAt: new Date()
    };
    
    const result = await commentsCollection.insertOne(newComment);
    
    return {
      ...newComment,
      _id: result.insertedId.toString()
    } as MongoComment;
  }
  
  async deleteComment(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    
    const commentsCollection = await getCollection('comments');
    
    const result = await commentsCollection.deleteOne({ _id: new ObjectId(id) });
    
    return result.deletedCount > 0;
  }
  
  // Watch history operations
  async addToWatchHistory(userId: string, videoId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(videoId)) return false;
    
    const historyCollection = await getCollection('watch_history');
    
    const result = await historyCollection.updateOne(
      { userId, videoId },
      { 
        $set: { userId, videoId },
        $currentDate: { watchedAt: true }
      },
      { upsert: true }
    );
    
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }
  
  async getWatchHistory(userId: string): Promise<{ videoId: string, watchedAt: Date }[]> {
    if (!ObjectId.isValid(userId)) return [];
    
    const historyCollection = await getCollection('watch_history');
    
    const history = await historyCollection.find({ userId })
      .sort({ watchedAt: -1 })
      .toArray();
    
    return history.map(item => ({
      videoId: item.videoId,
      watchedAt: item.watchedAt
    }));
  }
  
  async clearWatchHistory(userId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    
    const historyCollection = await getCollection('watch_history');
    
    const result = await historyCollection.deleteMany({ userId });
    
    return result.deletedCount > 0;
  }
  
  // Watch later operations
  async addToWatchLater(userId: string, videoId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(videoId)) return false;
    
    const watchLaterCollection = await getCollection('watch_later');
    
    const exists = await watchLaterCollection.findOne({ userId, videoId });
    
    if (exists) return false;
    
    const result = await watchLaterCollection.insertOne({
      userId,
      videoId,
      addedAt: new Date()
    });
    
    return result.insertedId !== null;
  }
  
  async removeFromWatchLater(userId: string, videoId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(videoId)) return false;
    
    const watchLaterCollection = await getCollection('watch_later');
    
    const result = await watchLaterCollection.deleteOne({ userId, videoId });
    
    return result.deletedCount > 0;
  }
  
  async getWatchLater(userId: string): Promise<{ videoId: string, addedAt: Date }[]> {
    if (!ObjectId.isValid(userId)) return [];
    
    const watchLaterCollection = await getCollection('watch_later');
    
    const watchLater = await watchLaterCollection.find({ userId })
      .sort({ addedAt: -1 })
      .toArray();
    
    return watchLater.map(item => ({
      videoId: item.videoId,
      addedAt: item.addedAt
    }));
  }
  
  // Like operations
  async likeVideo(userId: string, videoId: string, isLike: boolean): Promise<boolean> {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(videoId)) return false;
    
    const likesCollection = await getCollection('video_likes');
    const videosCollection = await getCollection('videos');
    
    // Check if like exists
    const existingLike = await likesCollection.findOne({ userId, videoId });
    
    if (existingLike) {
      // If like status is the same, do nothing
      if (existingLike.isLike === isLike) return true;
      
      // Update like status
      await likesCollection.updateOne(
        { userId, videoId },
        { $set: { isLike } }
      );
      
      // Update video like counts
      if (isLike) {
        await videosCollection.updateOne(
          { _id: new ObjectId(videoId) },
          { $inc: { likes: 1, dislikes: -1 } }
        );
      } else {
        await videosCollection.updateOne(
          { _id: new ObjectId(videoId) },
          { $inc: { likes: -1, dislikes: 1 } }
        );
      }
    } else {
      // Create new like
      await likesCollection.insertOne({
        userId,
        videoId,
        isLike,
        createdAt: new Date()
      });
      
      // Update video like counts
      if (isLike) {
        await videosCollection.updateOne(
          { _id: new ObjectId(videoId) },
          { $inc: { likes: 1 } }
        );
      } else {
        await videosCollection.updateOne(
          { _id: new ObjectId(videoId) },
          { $inc: { dislikes: 1 } }
        );
      }
    }
    
    return true;
  }
  
  async removeLike(userId: string, videoId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(videoId)) return false;
    
    const likesCollection = await getCollection('video_likes');
    const videosCollection = await getCollection('videos');
    
    // Get existing like
    const existingLike = await likesCollection.findOne({ userId, videoId });
    
    if (!existingLike) return false;
    
    // Remove like
    const result = await likesCollection.deleteOne({ userId, videoId });
    
    // Update video like counts
    if (existingLike.isLike) {
      await videosCollection.updateOne(
        { _id: new ObjectId(videoId) },
        { $inc: { likes: -1 } }
      );
    } else {
      await videosCollection.updateOne(
        { _id: new ObjectId(videoId) },
        { $inc: { dislikes: -1 } }
      );
    }
    
    return result.deletedCount > 0;
  }
  
  async getLikedVideos(userId: string): Promise<{ videoId: string, createdAt: Date }[]> {
    if (!ObjectId.isValid(userId)) return [];
    
    const likesCollection = await getCollection('video_likes');
    
    const likes = await likesCollection.find({ userId, isLike: true })
      .sort({ createdAt: -1 })
      .toArray();
    
    return likes.map(like => ({
      videoId: like.videoId,
      createdAt: like.createdAt
    }));
  }
  
  // Subscription operations
  async subscribe(subscriberId: string, channelId: string): Promise<boolean> {
    if (!ObjectId.isValid(subscriberId) || !ObjectId.isValid(channelId)) return false;
    if (subscriberId === channelId) return false;
    
    const subscriptionsCollection = await getCollection('subscriptions');
    const usersCollection = await getCollection('users');
    
    // Check if already subscribed
    const existing = await subscriptionsCollection.findOne({
      subscriberId,
      channelId
    });
    
    if (existing) return false;
    
    // Create subscription
    const result = await subscriptionsCollection.insertOne({
      subscriberId,
      channelId,
      subscribedAt: new Date()
    });
    
    // Increment subscriber count
    await usersCollection.updateOne(
      { _id: new ObjectId(channelId) },
      { $inc: { subscribers: 1 } }
    );
    
    return result.insertedId !== null;
  }
  
  async unsubscribe(subscriberId: string, channelId: string): Promise<boolean> {
    if (!ObjectId.isValid(subscriberId) || !ObjectId.isValid(channelId)) return false;
    
    const subscriptionsCollection = await getCollection('subscriptions');
    const usersCollection = await getCollection('users');
    
    // Check if subscription exists
    const existing = await subscriptionsCollection.findOne({
      subscriberId,
      channelId
    });
    
    if (!existing) return false;
    
    // Remove subscription
    const result = await subscriptionsCollection.deleteOne({
      subscriberId,
      channelId
    });
    
    // Decrement subscriber count
    await usersCollection.updateOne(
      { _id: new ObjectId(channelId) },
      { $inc: { subscribers: -1 } }
    );
    
    return result.deletedCount > 0;
  }
  
  async getSubscriptions(userId: string): Promise<{ channelId: string }[]> {
    if (!ObjectId.isValid(userId)) return [];
    
    const subscriptionsCollection = await getCollection('subscriptions');
    
    const subscriptions = await subscriptionsCollection.find({ subscriberId: userId })
      .toArray();
    
    return subscriptions.map(sub => ({
      channelId: sub.channelId
    }));
  }

  // Admin operations
  async getAllUsers(): Promise<MongoUser[]> {
    const usersCollection = await getCollection('users');
    const users = await usersCollection.find().toArray();
    
    return users.map(user => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      password: user.password,
      avatarUrl: user.avatarUrl,
      subscribers: user.subscribers || 0,
      isBanned: user.isBanned || false,
      banReason: user.banReason || "",
      createdAt: user.createdAt
    }));
  }
  
  async banUser(id: string, isBanned: boolean, banReason?: string): Promise<MongoUser | null> {
    if (!ObjectId.isValid(id)) return null;
    
    const usersCollection = await getCollection('users');
    
    const updateData: any = { isBanned };
    if (banReason) {
      updateData.banReason = banReason;
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) return null;
    
    return {
      _id: result._id.toString(),
      username: result.username,
      email: result.email,
      password: result.password,
      avatarUrl: result.avatarUrl,
      subscribers: result.subscribers || 0,
      isBanned: result.isBanned || false,
      banReason: result.banReason || "",
      createdAt: result.createdAt
    };
  }
  
  async getAllVideosForAdmin(): Promise<MongoVideo[]> {
    const videosCollection = await getCollection('videos');
    const videos = await videosCollection.find().toArray();
    
    return videos.map(video => ({
      _id: video._id.toString(),
      title: video.title,
      description: video.description,
      userId: video.userId,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      views: video.views || 0,
      likes: video.likes || 0,
      dislikes: video.dislikes || 0,
      duration: video.duration,
      category: video.category,
      tags: video.tags || [],
      createdAt: video.createdAt
    }));
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalVideos: number;
    totalComments: number;
    totalViews: number;
    totalLikes: number;
    recentUsers: MongoUser[];
    recentVideos: MongoVideo[];
  }> {
    const usersCollection = await getCollection('users');
    const videosCollection = await getCollection('videos');
    const commentsCollection = await getCollection('comments');
    
    const [
      totalUsers,
      totalVideos,
      totalComments,
      totalViewsResult,
      totalLikesResult,
      recentUsersData,
      recentVideosData
    ] = await Promise.all([
      usersCollection.countDocuments(),
      videosCollection.countDocuments(),
      commentsCollection.countDocuments(),
      videosCollection.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]).toArray(),
      videosCollection.aggregate([{ $group: { _id: null, total: { $sum: "$likes" } } }]).toArray(),
      usersCollection.find().sort({ createdAt: -1 }).limit(5).toArray(),
      videosCollection.find().sort({ createdAt: -1 }).limit(5).toArray()
    ]);

    return {
      totalUsers,
      totalVideos,
      totalComments,
      totalViews: totalViewsResult[0]?.total || 0,
      totalLikes: totalLikesResult[0]?.total || 0,
      recentUsers: recentUsersData.map(user => ({
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        password: user.password,
        avatarUrl: user.avatarUrl,
        subscribers: user.subscribers || 0,
        createdAt: user.createdAt
      })),
      recentVideos: recentVideosData.map(video => ({
        _id: video._id.toString(),
        title: video.title,
        description: video.description,
        userId: video.userId.toString(),
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        views: video.views || 0,
        likes: video.likes || 0,
        dislikes: video.dislikes || 0,
        duration: video.duration,
        category: video.category,
        tags: video.tags,
        createdAt: video.createdAt
      }))
    };
  }

  // Ad operations
  async getAllAds(): Promise<MongoAd[]> {
    const adsCollection = await getCollection('ads');
    const ads = await adsCollection.find().sort({ createdAt: -1 }).toArray();
    
    return ads.map(ad => ({
      _id: ad._id.toString(),
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl,
      adType: ad.adType,
      isActive: ad.isActive,
      startDate: ad.startDate,
      endDate: ad.endDate,
      budget: ad.budget,
      spent: ad.spent || 0,
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      ctr: ad.ctr || 0,
      createdAt: ad.createdAt,
      // Include campaign metric fields
      cpm: ad.cpm,
      revenuePerView: ad.revenuePerView,
      targetImpressions: ad.targetImpressions,
      remainingImpressions: ad.remainingImpressions,
      companyPercentage: ad.companyPercentage
    }));
  }

  async getAdById(id: string): Promise<MongoAd | null> {
    if (!ObjectId.isValid(id)) return null;
    
    const adsCollection = await getCollection('ads');
    const ad = await adsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!ad) return null;
    
    return {
      _id: ad._id.toString(),
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl,
      adType: ad.adType,
      isActive: ad.isActive,
      startDate: ad.startDate,
      endDate: ad.endDate,
      budget: ad.budget,
      spent: ad.spent || 0,
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      ctr: ad.ctr || 0,
      createdAt: ad.createdAt,
      // Include campaign metric fields
      cpm: ad.cpm,
      revenuePerView: ad.revenuePerView,
      targetImpressions: ad.targetImpressions,
      remainingImpressions: ad.remainingImpressions,
      companyPercentage: ad.companyPercentage
    };
  }

  async createAd(ad: InsertAd): Promise<MongoAd> {
    const adsCollection = await getCollection('ads');
    
    const newAd = {
      ...ad,
      isActive: true,
      spent: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      createdAt: new Date()
    };
    
    const result = await adsCollection.insertOne(newAd);
    
    return {
      _id: result.insertedId.toString(),
      ...newAd
    };
  }

  async updateAd(id: string, adData: Partial<MongoAd>): Promise<MongoAd | null> {
    if (!ObjectId.isValid(id)) return null;
    
    const adsCollection = await getCollection('ads');
    
    const result = await adsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: adData },
      { returnDocument: 'after' }
    );
    
    if (!result.value) return null;
    
    const ad = result.value;
    return {
      _id: ad._id.toString(),
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl,
      adType: ad.adType,
      isActive: ad.isActive,
      startDate: ad.startDate,
      endDate: ad.endDate,
      budget: ad.budget,
      spent: ad.spent || 0,
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      ctr: ad.ctr || 0,
      createdAt: ad.createdAt,
      cpm: ad.cpm || 0,
      revenuePerView: ad.revenuePerView || 0,
      targetImpressions: ad.targetImpressions || 0,
      remainingImpressions: ad.remainingImpressions || 0,
      companyPercentage: ad.companyPercentage || 30
    };
  }

  async deleteAd(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    
    const adsCollection = await getCollection('ads');
    const result = await adsCollection.deleteOne({ _id: new ObjectId(id) });
    
    return result.deletedCount > 0;
  }

  async toggleAdStatus(id: string, isActive: boolean): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    
    const adsCollection = await getCollection('ads');
    const result = await adsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive } }
    );
    
    return result.modifiedCount > 0;
  }

  // Withdrawal operations
  async getAllWithdrawRequests(status?: string): Promise<MongoWithdrawRequest[]> {
    const withdrawsCollection = await getCollection('withdraw_requests');
    const usersCollection = await getCollection('users');
    
    const filter = status && status !== 'all' ? { status } : {};
    const withdraws = await withdrawsCollection.find(filter).sort({ requestedAt: -1 }).toArray();
    
    const withdrawsWithUserInfo = await Promise.all(
      withdraws.map(async (withdraw) => {
        const user = await usersCollection.findOne({ _id: new ObjectId(withdraw.userId) });
        
        // Get account details from withdrawal request first, then fallback to user's payment methods
        let accountDetails = {};
        
        if (withdraw.accountDetails) {
          if (typeof withdraw.accountDetails === 'string') {
            try {
              accountDetails = JSON.parse(withdraw.accountDetails);
            } catch (e) {
              accountDetails = {};
            }
          } else {
            accountDetails = withdraw.accountDetails;
          }
        }
        
        // If no account details in withdrawal request, get from user's payment methods
        if (Object.keys(accountDetails).length === 0 && user?.paymentMethods) {
          const userPaymentMethods = user.paymentMethods;
          
          switch (withdraw.method) {
            case 'paypal':
              if (userPaymentMethods.paypal && userPaymentMethods.paypal.email) {
                accountDetails = {
                  paypalEmail: userPaymentMethods.paypal.email
                };
              }
              break;
            case 'bank':
              if (userPaymentMethods.bank && userPaymentMethods.bank.accountNumber) {
                accountDetails = {
                  bankName: userPaymentMethods.bank.bankName || 'Not provided',
                  bankAccount: userPaymentMethods.bank.accountNumber,
                  routingNumber: userPaymentMethods.bank.routingNumber || 'Not provided'
                };
              }
              break;
            case 'crypto':
              if (userPaymentMethods.crypto && userPaymentMethods.crypto.address) {
                accountDetails = {
                  cryptoType: userPaymentMethods.crypto.type || 'Bitcoin',
                  cryptoAddress: userPaymentMethods.crypto.address
                };
              }
              break;
          }
        }
        
        return {
          _id: withdraw._id.toString(),
          userId: withdraw.userId.toString(),
          username: user?.username || 'Unknown',
          email: user?.email || 'Unknown',
          amount: withdraw.amount,
          method: withdraw.method,
          accountDetails: accountDetails,
          status: withdraw.status,
          requestedAt: withdraw.requestedAt,
          processedAt: withdraw.processedAt,
          adminNotes: withdraw.adminNotes,
          userBalance: user?.balance || 0
        };
      })
    );
    
    return withdrawsWithUserInfo;
  }

  async getWithdrawRequestById(id: string): Promise<MongoWithdrawRequest | null> {
    if (!ObjectId.isValid(id)) return null;
    
    const withdrawsCollection = await getCollection('withdraw_requests');
    const usersCollection = await getCollection('users');
    
    const withdraw = await withdrawsCollection.findOne({ _id: new ObjectId(id) });
    if (!withdraw) return null;
    
    const user = await usersCollection.findOne({ _id: new ObjectId(withdraw.userId) });
    
    return {
      _id: withdraw._id.toString(),
      userId: withdraw.userId.toString(),
      username: user?.username || 'Unknown',
      email: user?.email || 'Unknown',
      amount: withdraw.amount,
      method: withdraw.method,
      accountDetails: withdraw.accountDetails,
      status: withdraw.status,
      requestedAt: withdraw.requestedAt,
      processedAt: withdraw.processedAt,
      adminNotes: withdraw.adminNotes,
      userBalance: 0 // TODO: Implement user balance calculation
    };
  }

  async createWithdrawRequest(request: InsertWithdrawRequest): Promise<MongoWithdrawRequest> {
    const withdrawsCollection = await getCollection('withdraw_requests');
    const usersCollection = await getCollection('users');
    
    const newRequest = {
      ...request,
      status: 'pending',
      requestedAt: new Date()
    };
    
    const result = await withdrawsCollection.insertOne(newRequest);
    const user = await usersCollection.findOne({ _id: new ObjectId(request.userId) });
    
    return {
      _id: result.insertedId.toString(),
      userId: request.userId.toString(),
      username: user?.username || 'Unknown',
      email: user?.email || 'Unknown',
      amount: request.amount,
      method: request.method,
      accountDetails: request.accountDetails,
      status: 'pending',
      requestedAt: newRequest.requestedAt,
      userBalance: 0
    };
  }

  async updateWithdrawRequest(id: string, data: Partial<{ status: string; adminNotes: string; processedAt: Date }>): Promise<MongoWithdrawRequest | null> {
    if (!ObjectId.isValid(id)) return null;
    
    const withdrawsCollection = await getCollection('withdraw_requests');
    const usersCollection = await getCollection('users');
    
    const updateData = {
      ...data,
      processedAt: new Date()
    };
    
    const result = await withdrawsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result.value) return null;
    
    const withdraw = result.value;
    const user = await usersCollection.findOne({ _id: new ObjectId(withdraw.userId) });
    
    return {
      _id: withdraw._id.toString(),
      userId: withdraw.userId.toString(),
      username: user?.username || 'Unknown',
      email: user?.email || 'Unknown',
      amount: withdraw.amount,
      method: withdraw.method,
      accountDetails: withdraw.accountDetails,
      status: withdraw.status,
      requestedAt: withdraw.requestedAt,
      processedAt: withdraw.processedAt,
      adminNotes: withdraw.adminNotes,
      userBalance: 0
    };
  }

  async getWithdrawStats(): Promise<{
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalCompleted: number;
    totalAmount: number;
    pendingAmount: number;
  }> {
    const withdrawsCollection = await getCollection('withdraw_requests');
    
    const [
      totalPending,
      totalApproved,
      totalRejected,
      totalCompleted,
      totalAmountResult,
      pendingAmountResult
    ] = await Promise.all([
      withdrawsCollection.countDocuments({ status: 'pending' }),
      withdrawsCollection.countDocuments({ status: 'approved' }),
      withdrawsCollection.countDocuments({ status: 'rejected' }),
      withdrawsCollection.countDocuments({ status: 'completed' }),
      withdrawsCollection.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
      withdrawsCollection.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]).toArray()
    ]);
    
    return {
      totalPending,
      totalApproved,
      totalRejected,
      totalCompleted,
      totalAmount: totalAmountResult[0]?.total || 0,
      pendingAmount: pendingAmountResult[0]?.total || 0
    };
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, MongoUser>;
  private videos: Map<string, MongoVideo>;
  private comments: Map<string, MongoComment>;
  private watchHistory: Map<string, { userId: string, videoId: string, watchedAt: Date }[]>;
  private watchLater: Map<string, { userId: string, videoId: string, addedAt: Date }[]>;
  private videoLikes: Map<string, { userId: string, videoId: string, isLike: boolean, createdAt: Date }[]>;
  private subscriptions: Map<string, { subscriberId: string, channelId: string, subscribedAt: Date }[]>;
  
  private currentUserId: number;
  private currentVideoId: number;
  private currentCommentId: number;
  
  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.comments = new Map();
    this.watchHistory = new Map();
    this.watchLater = new Map();
    this.videoLikes = new Map();
    this.subscriptions = new Map();
    
    this.currentUserId = 1;
    this.currentVideoId = 1;
    this.currentCommentId = 1;
  }
  
  // User operations
  async getUser(id: string): Promise<MongoUser | null> {
    return this.users.get(id) || null;
  }
  
  async getUserByUsername(username: string): Promise<MongoUser | null> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }
  
  async createUser(user: InsertUser): Promise<MongoUser> {
    const id = this.currentUserId++;
    const stringId = id.toString();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const newUser: MongoUser = {
      _id: stringId,
      username: user.username,
      email: user.email || '',
      password: hashedPassword,
      avatarUrl: user.avatarUrl || '',
      subscribers: 0,
      createdAt: new Date()
    };
    
    this.users.set(stringId, newUser);
    
    return newUser;
  }
  
  async updateUser(id: string, userData: Partial<InsertUser>): Promise<MongoUser | null> {
    const user = this.users.get(id);
    
    if (!user) return null;
    
    const updatedUser = { ...user };
    
    if (userData.username) updatedUser.username = userData.username;
    if (userData.email) updatedUser.email = userData.email;
    if (userData.avatarUrl) updatedUser.avatarUrl = userData.avatarUrl;
    if (userData.password) {
      updatedUser.password = await bcrypt.hash(userData.password, 10);
    }
    
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }
  
  // Video operations
  async getAllVideos(options: { limit?: number, skip?: number, category?: string, search?: string } = {}): Promise<{ videos: MongoVideo[], total: number }> {
    const { limit = 20, skip = 0, category, search } = options;
    
    let filteredVideos = Array.from(this.videos.values());
    
    // Apply category filter
    if (category && category !== 'all') {
      filteredVideos = filteredVideos.filter(video => video.category === category);
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredVideos = filteredVideos.filter(video => 
        video.title.toLowerCase().includes(searchLower) ||
        (video.description && video.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by creation date (newest first)
    filteredVideos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const total = filteredVideos.length;
    
    // Apply pagination
    filteredVideos = filteredVideos.slice(skip, skip + limit);
    
    return { videos: filteredVideos, total };
  }
  
  async getVideoById(id: string): Promise<MongoVideo | null> {
    return this.videos.get(id) || null;
  }
  
  async createVideo(video: InsertVideo): Promise<MongoVideo> {
    const id = this.currentVideoId++;
    const stringId = id.toString();
    
    const newVideo: MongoVideo = {
      _id: stringId,
      ...video,
      views: 0,
      likes: 0,
      dislikes: 0,
      createdAt: new Date()
    };
    
    this.videos.set(stringId, newVideo);
    
    return newVideo;
  }
  
  async updateVideo(id: string, videoData: Partial<InsertVideo>): Promise<MongoVideo | null> {
    const video = this.videos.get(id);
    
    if (!video) return null;
    
    const updatedVideo = { ...video };
    
    if (videoData.title) updatedVideo.title = videoData.title;
    if (videoData.description !== undefined) updatedVideo.description = videoData.description;
    if (videoData.thumbnailUrl) updatedVideo.thumbnailUrl = videoData.thumbnailUrl;
    if (videoData.category) updatedVideo.category = videoData.category;
    if (videoData.tags) updatedVideo.tags = videoData.tags;
    
    this.videos.set(id, updatedVideo);
    
    return updatedVideo;
  }
  
  async deleteVideo(id: string): Promise<boolean> {
    return this.videos.delete(id);
  }
  
  async incrementVideoViews(id: string): Promise<boolean> {
    const video = this.videos.get(id);
    
    if (!video) return false;
    
    video.views += 1;
    this.videos.set(id, video);
    
    return true;
  }
  
  // Comment operations
  async getVideoComments(videoId: string): Promise<MongoComment[]> {
    const allComments = Array.from(this.comments.values());
    
    const videoComments = allComments.filter(comment => comment.videoId === videoId);
    
    // Sort by creation date (newest first)
    videoComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return videoComments;
  }
  
  async createComment(comment: InsertComment): Promise<MongoComment> {
    const id = this.currentCommentId++;
    const stringId = id.toString();
    
    const newComment: MongoComment = {
      _id: stringId,
      ...comment,
      likes: 0,
      createdAt: new Date()
    };
    
    this.comments.set(stringId, newComment);
    
    return newComment;
  }
  
  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Watch history operations
  async addToWatchHistory(userId: string, videoId: string): Promise<boolean> {
    let userHistory = this.watchHistory.get(userId) || [];
    
    // Remove existing entry if any
    userHistory = userHistory.filter(entry => entry.videoId !== videoId);
    
    // Add new entry
    userHistory.push({
      userId,
      videoId,
      watchedAt: new Date()
    });
    
    this.watchHistory.set(userId, userHistory);
    
    return true;
  }
  
  async getWatchHistory(userId: string): Promise<{ videoId: string, watchedAt: Date }[]> {
    const userHistory = this.watchHistory.get(userId) || [];
    
    // Sort by watched date (newest first)
    userHistory.sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime());
    
    return userHistory.map(entry => ({
      videoId: entry.videoId,
      watchedAt: entry.watchedAt
    }));
  }
  
  async clearWatchHistory(userId: string): Promise<boolean> {
    this.watchHistory.set(userId, []);
    return true;
  }
  
  // Watch later operations
  async addToWatchLater(userId: string, videoId: string): Promise<boolean> {
    let userWatchLater = this.watchLater.get(userId) || [];
    
    // Check if already in watch later
    if (userWatchLater.some(entry => entry.videoId === videoId)) {
      return false;
    }
    
    // Add new entry
    userWatchLater.push({
      userId,
      videoId,
      addedAt: new Date()
    });
    
    this.watchLater.set(userId, userWatchLater);
    
    return true;
  }
  
  async removeFromWatchLater(userId: string, videoId: string): Promise<boolean> {
    let userWatchLater = this.watchLater.get(userId) || [];
    
    // Check if in watch later
    if (!userWatchLater.some(entry => entry.videoId === videoId)) {
      return false;
    }
    
    // Remove entry
    userWatchLater = userWatchLater.filter(entry => entry.videoId !== videoId);
    
    this.watchLater.set(userId, userWatchLater);
    
    return true;
  }
  
  async getWatchLater(userId: string): Promise<{ videoId: string, addedAt: Date }[]> {
    const userWatchLater = this.watchLater.get(userId) || [];
    
    // Sort by added date (newest first)
    userWatchLater.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
    
    return userWatchLater.map(entry => ({
      videoId: entry.videoId,
      addedAt: entry.addedAt
    }));
  }
  
  // Like operations
  async likeVideo(userId: string, videoId: string, isLike: boolean): Promise<boolean> {
    let userLikes = this.videoLikes.get(userId) || [];
    
    const existingLikeIndex = userLikes.findIndex(entry => entry.videoId === videoId);
    const video = this.videos.get(videoId);
    
    if (!video) return false;
    
    if (existingLikeIndex !== -1) {
      const existingLike = userLikes[existingLikeIndex];
      
      // If like status is the same, do nothing
      if (existingLike.isLike === isLike) return true;
      
      // Update like status
      userLikes[existingLikeIndex] = {
        ...existingLike,
        isLike
      };
      
      // Update video like counts
      if (isLike) {
        video.likes += 1;
        video.dislikes -= 1;
      } else {
        video.likes -= 1;
        video.dislikes += 1;
      }
    } else {
      // Add new like
      userLikes.push({
        userId,
        videoId,
        isLike,
        createdAt: new Date()
      });
      
      // Update video like counts
      if (isLike) {
        video.likes += 1;
      } else {
        video.dislikes += 1;
      }
    }
    
    this.videoLikes.set(userId, userLikes);
    this.videos.set(videoId, video);
    
    return true;
  }
  
  async removeLike(userId: string, videoId: string): Promise<boolean> {
    let userLikes = this.videoLikes.get(userId) || [];
    
    const existingLikeIndex = userLikes.findIndex(entry => entry.videoId === videoId);
    
    if (existingLikeIndex === -1) return false;
    
    const existingLike = userLikes[existingLikeIndex];
    const video = this.videos.get(videoId);
    
    if (!video) return false;
    
    // Remove like
    userLikes.splice(existingLikeIndex, 1);
    
    // Update video like counts
    if (existingLike.isLike) {
      video.likes -= 1;
    } else {
      video.dislikes -= 1;
    }
    
    this.videoLikes.set(userId, userLikes);
    this.videos.set(videoId, video);
    
    return true;
  }
  
  async getLikedVideos(userId: string): Promise<{ videoId: string, createdAt: Date }[]> {
    const userLikes = this.videoLikes.get(userId) || [];
    
    // Get only likes (not dislikes)
    const likes = userLikes.filter(entry => entry.isLike);
    
    // Sort by creation date (newest first)
    likes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return likes.map(like => ({
      videoId: like.videoId,
      createdAt: like.createdAt
    }));
  }
  
  // Subscription operations
  async subscribe(subscriberId: string, channelId: string): Promise<boolean> {
    if (subscriberId === channelId) return false;
    
    let userSubscriptions = this.subscriptions.get(subscriberId) || [];
    
    // Check if already subscribed
    if (userSubscriptions.some(sub => sub.channelId === channelId)) {
      return false;
    }
    
    // Add subscription
    userSubscriptions.push({
      subscriberId,
      channelId,
      subscribedAt: new Date()
    });
    
    this.subscriptions.set(subscriberId, userSubscriptions);
    
    // Increment subscriber count
    const channel = this.users.get(channelId);
    
    if (channel) {
      channel.subscribers += 1;
      this.users.set(channelId, channel);
    }
    
    return true;
  }
  
  async unsubscribe(subscriberId: string, channelId: string): Promise<boolean> {
    let userSubscriptions = this.subscriptions.get(subscriberId) || [];
    
    // Check if subscribed
    if (!userSubscriptions.some(sub => sub.channelId === channelId)) {
      return false;
    }
    
    // Remove subscription
    userSubscriptions = userSubscriptions.filter(sub => sub.channelId !== channelId);
    
    this.subscriptions.set(subscriberId, userSubscriptions);
    
    // Decrement subscriber count
    const channel = this.users.get(channelId);
    
    if (channel) {
      channel.subscribers -= 1;
      this.users.set(channelId, channel);
    }
    
    return true;
  }
  
  async getSubscriptions(userId: string): Promise<{ channelId: string }[]> {
    const userSubscriptions = this.subscriptions.get(userId) || [];
    
    return userSubscriptions.map(sub => ({
      channelId: sub.channelId
    }));
  }
}

// Use MongoDB storage in production
export const storage = new MongoDBStorage();
