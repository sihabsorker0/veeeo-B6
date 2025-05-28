import { Request, Response } from 'express';
import { getCollection } from '../config/db';
import { ObjectId } from 'mongodb';

// Get video analytics for creator
export const getCreatorVideoAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const videosCollection = await getCollection('videos');
    const adsCollection = await getCollection('ads');
    const commentsCollection = await getCollection('comments');
    const videoViewsCollection = await getCollection('video_views');
    
    // Get all videos for the creator
    const videos = await videosCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
    
    // Get all active ads
    const activeAds = await adsCollection.find({ isActive: true }).toArray();
    
    // Process video analytics
    const videoAnalytics = [];
    
    for (const video of videos) {
      // Get comment count for this video
      const commentCount = await commentsCollection.countDocuments({ 
        videoId: video._id.toString() 
      });
      
      // Get actual ad views for this video and calculate real revenue
      let totalRevenue = 0;
      let availableRevenue = 0;
      
      // Check video_views collection for ad impressions for this specific video
      const videoViews = await videoViewsCollection.find({ 
        videoId: video._id.toString() 
      }).toArray();
      
      console.log(`Checking revenue for video ${video._id.toString()}: found ${videoViews.length} view records`);
      
      // Calculate revenue based on actual ad impressions
      for (const view of videoViews) {
        if (view.adImpressions && view.adImpressions.length > 0) {
          console.log(`Found ${view.adImpressions.length} ad impressions for this view`);
          for (const adImpression of view.adImpressions) {
            // Find the corresponding ad from all ads (not just active ones)
            const adsCollection = await getCollection('ads');
            const ad = await adsCollection.findOne({ _id: new ObjectId(adImpression.adId) });
            if (ad && ad.revenuePerView) {
              // Always show total revenue for video analytics display
              totalRevenue += ad.revenuePerView;
              console.log(`Added total revenue: ${ad.revenuePerView} from ad ${ad.title}`);
              
              // Track available revenue separately for transfer purposes
              if (!adImpression.transferred) {
                availableRevenue += ad.revenuePerView;
                console.log(`Available for transfer: ${ad.revenuePerView} from ad ${ad.title}`);
              } else {
                console.log(`Already transferred: ${ad.revenuePerView} from ad ${adImpression.adId}`);
              }
            } else {
              console.log(`Ad not found or no revenue per view for ad ID: ${adImpression.adId}`);
            }
          }
        }
      }
      
      console.log(`Total revenue for video ${video.title}: ${totalRevenue}`)
      
      // Calculate engagement rate
      const engagementRate = video.views > 0 
        ? ((video.likes || 0) / video.views * 100).toFixed(1) 
        : "0.0";
      
      videoAnalytics.push({
        _id: video._id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        views: video.views || 0,
        likes: video.likes || 0,
        dislikes: video.dislikes || 0,
        comments: commentCount,
        createdAt: video.createdAt,
        estimatedRevenue: parseFloat(totalRevenue.toFixed(2)),
        availableRevenue: parseFloat(availableRevenue.toFixed(2)),
        engagement: engagementRate
      });
    }
    
    // Calculate summary statistics
    const totalViews = videoAnalytics.reduce((sum, video) => sum + video.views, 0);
    const totalLikes = videoAnalytics.reduce((sum, video) => sum + video.likes, 0);
    const totalComments = videoAnalytics.reduce((sum, video) => sum + video.comments, 0);
    const totalRevenue = videoAnalytics.reduce((sum, video) => sum + video.estimatedRevenue, 0);
    const totalAvailableRevenue = videoAnalytics.reduce((sum, video) => sum + video.availableRevenue, 0);
    
    // Get most viewed video
    const mostViewedVideo = [...videoAnalytics].sort((a, b) => b.views - a.views)[0] || null;
    
    // Get top performing video (by engagement)
    const topPerformingVideo = [...videoAnalytics].sort((a, b) => 
      parseFloat(b.engagement) - parseFloat(a.engagement)
    )[0] || null;
    
    res.status(200).json({
      videos: videoAnalytics,
      summary: {
        totalVideos: videoAnalytics.length,
        totalViews,
        totalLikes,
        totalComments,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalAvailableRevenue: parseFloat(totalAvailableRevenue.toFixed(2)),
        averageViewsPerVideo: videoAnalytics.length > 0 
          ? Math.round(totalViews / videoAnalytics.length) 
          : 0,
        mostViewedVideo,
        topPerformingVideo
      }
    });
  } catch (error) {
    console.error('Error getting creator video analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};