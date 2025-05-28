import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import path from "path";
import crypto from "crypto";
import { getCollection } from "./config/db";
import { MongoAd } from "../shared/schema";
import { ObjectId } from "mongodb";
import { uploadVideo, uploadThumbnail, uploadAvatar, uploadAdContent } from "./middleware/upload";
import { isAuthenticated, optionalAuth } from "./middleware/auth";

// Controllers
import * as usersController from "./controllers/users";
import * as videosController from "./controllers/videos";
import * as commentsController from "./controllers/comments";
import * as analyticsController from "./controllers/analytics";

// For development without MongoDB
import MemoryStore from "memorystore";
const MemoryStoreFactory = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  const videoDir = path.join(uploadDir, 'videos');
  const thumbnailDir = path.join(uploadDir, 'thumbnails');

  app.use('/uploads', express.static(uploadDir));

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      },
      store: new MemoryStoreFactory({
        checkPeriod: 86400000 // 24 hours
      })
    })
  );

  // API routes prefix
  const apiRouter = express.Router();
  app.use('/api', apiRouter);

  // Authentication routes
  apiRouter.post('/auth/register', usersController.registerUser);
  apiRouter.post('/auth/login', usersController.loginUser);
  apiRouter.post('/auth/logout', usersController.logoutUser);
  apiRouter.get('/auth/me', isAuthenticated, usersController.getCurrentUser);

  // User routes
  apiRouter.get('/users/:id', usersController.getUserById);
  apiRouter.get('/users/:id/videos', usersController.getUserVideos);
  apiRouter.patch('/users/:id', isAuthenticated, uploadAvatar, usersController.updateUser);
  apiRouter.put('/users', isAuthenticated, uploadAvatar, usersController.updateUser);
  apiRouter.post('/users/change-password', isAuthenticated, usersController.changePassword);
  apiRouter.get('/users/subscriptions', isAuthenticated, usersController.getUserSubscriptions);
  apiRouter.get('/users/subscription-videos', isAuthenticated, usersController.getSubscriptionVideos);
  apiRouter.post('/users/:channelId/subscribe', isAuthenticated, usersController.subscribeToChannel);
  apiRouter.delete('/users/:channelId/subscribe', isAuthenticated, usersController.unsubscribeFromChannel);

  // Video routes
  apiRouter.get('/videos', optionalAuth, videosController.getAllVideos);
  apiRouter.post('/videos', isAuthenticated, uploadVideo, videosController.uploadVideo);
  apiRouter.get('/videos/:id', optionalAuth, videosController.getVideoById);
  apiRouter.put('/videos/:id', isAuthenticated, uploadThumbnail, videosController.updateVideo);
  apiRouter.delete('/videos/:id', isAuthenticated, videosController.deleteVideo);
  apiRouter.post('/videos/:id/like', isAuthenticated, videosController.likeVideo);
  apiRouter.post('/videos/:id/restore', isAuthenticated, videosController.restoreVideo);
  apiRouter.delete('/videos/:id/permanent', isAuthenticated, videosController.permanentlyDeleteVideo);
  apiRouter.get('/videos/trash/list', isAuthenticated, videosController.getDeletedVideos);

  // Watch later routes
  apiRouter.post('/videos/:id/watch-later', isAuthenticated, videosController.addToWatchLater);
  apiRouter.delete('/videos/:id/watch-later', isAuthenticated, videosController.removeFromWatchLater);
  apiRouter.get('/watch-later', isAuthenticated, videosController.getWatchLaterVideos);

  // Watch history routes
  apiRouter.get('/history', isAuthenticated, videosController.getWatchHistory);
  apiRouter.delete('/history', isAuthenticated, videosController.clearWatchHistory);

  // Liked videos route
  apiRouter.get('/liked-videos', isAuthenticated, videosController.getLikedVideos);

  // Creator video analytics route (protected by monetization approval)
  apiRouter.get('/creator/video-analytics', isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const usersCollection = await getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if monetization is approved
      if (user.monetizationStatus !== 'approved') {
        return res.status(403).json({ 
          message: 'Monetization access not approved',
          monetizationStatus: user.monetizationStatus || 'not_requested'
        });
      }

      // If approved, continue to analytics controller
      next();
    } catch (error) {
      console.error('Error checking monetization access:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }, analyticsController.getCreatorVideoAnalytics);

  // Playlist routes
  apiRouter.get('/playlists', isAuthenticated, async (req, res) => {
    try {
      const playlistsCollection = await getCollection('playlists');
      const playlists = await playlistsCollection.find({ userId: req.userId }).toArray();
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching playlists' });
    }
  });

  apiRouter.get('/playlists/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const playlistsCollection = await getCollection('playlists');
      const videosCollection = await getCollection('videos');
      const usersCollection = await getCollection('users');
      const { ObjectId } = await import('mongodb');

      const playlist = await playlistsCollection.findOne({
        _id: new ObjectId(id),
        userId: req.userId
      });

      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      // Get the videos in the playlist
      if (playlist.videos && playlist.videos.length > 0) {
        const videos = await videosCollection.find({
          _id: { $in: playlist.videos.map((id: string) => new ObjectId(id)) }
        }).toArray();

        // Add user information to each video
        for (let video of videos) {
          const user = await usersCollection.findOne(
            { _id: video.userId },
            { projection: { password: 0 } }
          );
          video.user = user;
        }

        playlist.videos = videos;
      } else {
        playlist.videos = [];
      }

      res.json(playlist);
    } catch (error) {
      console.error('Get playlist error:', error);
      res.status(500).json({ message: 'Failed to get playlist' });
    }
  });

  apiRouter.post('/playlists', isAuthenticated, async (req, res) => {
    try {
      const { title, description = '', isPrivate = false } = req.body;
      const playlistsCollection = await getCollection('playlists');

      const newPlaylist = {
        title,
        description,
        userId: req.userId,
        videos: [],
        createdAt: new Date(),
        isPrivate
      };

      const result = await playlistsCollection.insertOne(newPlaylist);
      res.status(201).json({ ...newPlaylist, _id: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: 'Error creating playlist' });
    }
  });

  apiRouter.post('/playlists/:id/videos', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { videoId } = req.body;
      const playlistsCollection = await getCollection('playlists');
      const { ObjectId } = await import('mongodb');

      const playlist = await playlistsCollection.findOne({ 
        _id: new ObjectId(id),
        userId: req.userId 
      });

      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      const result = await playlistsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { videos: videoId } }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: 'Video already in playlist or update failed' });
      }

      res.json({ message: 'Video added to playlist successfully' });
    } catch (error) {
      console.error('Error adding video to playlist:', error);
      res.status(500).json({ message: 'Error adding video to playlist' });
    }
  });

  apiRouter.delete('/playlists/:id/videos/:videoId', isAuthenticated, async (req, res) => {
    try {
      const { id, videoId } = req.params;
      const playlistsCollection = await getCollection('playlists');
      const { ObjectId } = await import('mongodb');

      const playlist = await playlistsCollection.findOne({
        _id: new ObjectId(id),
        userId: req.userId
      });

      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      const result = await playlistsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { videos: videoId } }
      );

      if (result.modifiedCount === 0) {
        return res.status(400).json({ message: 'Video not found in playlist or update failed' });
      }

      res.json({ message: 'Video removed from playlist successfully' });
    } catch (error) {
      console.error('Error removing video from playlist:', error);
      res.status(500).json({ message: 'Error removing video from playlist' });
    }
  });

  // Comment routes
  apiRouter.get('/videos/:videoId/comments', commentsController.getComments);
  apiRouter.post('/videos/:videoId/comments', isAuthenticated, commentsController.addComment);
  apiRouter.delete('/comments/:id', isAuthenticated, commentsController.deleteComment);
  apiRouter.post('/comments/:id/like', isAuthenticated, commentsController.likeComment);
  apiRouter.post('/comments/:id/dislike', isAuthenticated, commentsController.dislikeComment);
  apiRouter.post('/comments/:id/reply', isAuthenticated, commentsController.replyToComment);

  // Thumbnail upload route
  apiRouter.post('/upload/thumbnail', isAuthenticated, uploadThumbnail, (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No thumbnail uploaded' });
    }

    const thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
    return res.status(200).json({ thumbnailUrl });
  });

  // Admin routes
  apiRouter.get('/admin/stats', async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Get monetization requests for admin
  apiRouter.get('/admin/monetization/requests', async (req, res) => {
    try {
      const usersCollection = await getCollection('users');
      const requests = await usersCollection.find({
        monetizationStatus: { $in: ['pending', 'approved', 'rejected'] }
      }).project({ password: 0 }).toArray();

      res.json(requests);
    } catch (error) {
      console.error('Error fetching monetization requests:', error);
      res.status(500).json({ message: 'Failed to fetch monetization requests' });
    }
  });

  // Approve/reject monetization request
  apiRouter.patch('/admin/monetization/requests/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, adminNotes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const usersCollection = await getCollection('users');
      const updateData: any = {
        monetizationStatus: status,
        monetizationProcessedAt: new Date()
      };

      if (status === 'approved') {
        updateData.monetizationApprovedAt = new Date();
      }

      if (adminNotes) {
        updateData.monetizationAdminNotes = adminNotes;
      }

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ 
        success: true, 
        message: `Monetization request ${status} successfully` 
      });
    } catch (error) {
      console.error('Error processing monetization request:', error);
      res.status(500).json({ message: 'Failed to process monetization request' });
    }
  });

  // Admin User Management Routes
  apiRouter.get('/admin/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  apiRouter.patch('/admin/users/:id/ban', async (req, res) => {
    try {
      const { id } = req.params;
      const { isBanned, banReason } = req.body;
      const user = await storage.banUser(id, isBanned, banReason);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({ message: 'Failed to update user ban status' });
    }
  });

  // Admin Video Management Routes
  apiRouter.get('/admin/videos', async (req, res) => {
    try {
      const videos = await storage.getAllVideosForAdmin();
      res.json(videos);
    } catch (error) {
      console.error('Error fetching videos for admin:', error);
      res.status(500).json({ message: 'Failed to fetch videos' });
    }
  });

  // Ad management routes
  apiRouter.get('/admin/ads', async (req, res) => {
    try {
      const ads = await storage.getAllAds();
      res.json(ads);
    } catch (error) {
      console.error('Error fetching ads:', error);
      res.status(500).json({ message: 'Failed to fetch ads' });
    }
  });

  apiRouter.post('/admin/ads', async (req, res) => {
    try {
      const adData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };
      const ad = await storage.createAd(adData);
      res.status(201).json(ad);
    } catch (error) {
      console.error('Error creating ad:', error);
      res.status(500).json({ message: 'Failed to create ad' });
    }
  });

  apiRouter.patch('/admin/ads/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (req.body.startDate) {
        updateData.startDate = new Date(req.body.startDate);
      }
      if (req.body.endDate) {
        updateData.endDate = new Date(req.body.endDate);
      }

      const ad = await storage.updateAd(id, updateData);
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      res.json(ad);
    } catch (error) {
      console.error('Error updating ad:', error);
      res.status(500).json({ message: 'Failed to update ad' });
    }
  });

  apiRouter.delete('/admin/ads/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteAd(id);
      if (!success) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      res.json({ message: 'Ad deleted successfully' });
    } catch (error) {
      console.error('Error deleting ad:', error);
      res.status(500).json({ message: 'Failed to delete ad' });
    }
  });

  // Special route to update campaigns with real metric values
  apiRouter.get('/admin/update-campaign-metrics', async (req, res) => {
    try {
      // Get MongoDB collection directly for direct database updates
      const adsCollection = await getCollection('ads');
      const { ObjectId } = await import('mongodb');

      // Update first campaign (Sihab)
      const campaign1 = await adsCollection.updateOne(
        { _id: { $toString: { $eq: "683281182084e60881ea38db" } } },
        { 
          $set: {
            cpm: 1000,
            revenuePerView: 0.7,
            targetImpressions: 8000,
            remainingImpressions: 7995,
            companyPercentage: 30
          }
        }
      );

      // Update second campaign (Sihab 2)
      const campaign2 = await adsCollection.updateOne(
        { _id: new ObjectId("6832839b38cb4697f04bbd42") },
        { 
          $set: {
            cpm: 500,
            revenuePerView: 0.35,
            targetImpressions: 4000,
            remainingImpressions: 3999,
            companyPercentage: 30
          }
        }
      );

      res.json({
        success: true,
        message: 'Campaign metrics updated successfully',
        updatedCampaigns: {
          sihab: campaign1.modifiedCount > 0,
          sihab2: campaign2.modifiedCount > 0
        }
      });
    } catch (error) {
      console.error('Error updating campaign metrics:', error);
      res.status(500).json({ message: 'Failed to update campaign metrics' });
    }
  });

  apiRouter.patch('/admin/ads/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const success = await storage.toggleAdStatus(id, isActive);
      if (!success) {
        return res.status(404).json({ message: 'Ad not found' });
      }
      res.json({ message: 'Ad status updated' });
    } catch (error) {
      console.error('Error toggling ad status:', error);
      res.status(500).json({ message: 'Failed to update ad status' });
    }
  });

  // Create ad campaign with file upload support
  apiRouter.post('/admin/ads/create', uploadAdContent, async (req, res) => {
    try {
      let imageUrl = null;

      // Handle file upload if present
      if (req.file) {
        imageUrl = `/uploads/ads/${req.file.filename}`;
        console.log('File uploaded:', req.file.filename);
      }

      // Parse input values and ensure they're valid numbers
      const cpm = parseFloat(req.body.cpm) || 0;
      const budget = parseFloat(req.body.budget) || 0;
      const companyPercentage = parseFloat(req.body.companyPercentage) || 0;
      const creatorRevenue = parseFloat(req.body.creatorRevenue) || 0;

      // Use provided revenue per view or calculate it
      let revenuePerView = creatorRevenue;
      if (!revenuePerView && cpm > 0) {
        revenuePerView = (cpm / 1000) * ((100 - companyPercentage) / 100);
      }

      // Calculate target impressions based on budget and CPM
      const targetImpressions = cpm > 0 ? Math.floor((budget / cpm) * 1000) : 0;

      // Create ad data object with all required fields
      const adData = {
        title: req.body.name || 'নতুন বিজ্ঞাপন',
        description: req.body.description || `${req.body.type} বিজ্ঞাপন - ${req.body.name}`,
        targetUrl: req.body.targetUrl || '#',
        adType: req.body.type || 'banner',
        imageUrl: imageUrl,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        budget: budget,
        spent: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        createdAt: new Date(),
        cpm: cpm,
        revenuePerView: revenuePerView,
        targetImpressions: targetImpressions,
        remainingImpressions: targetImpressions,
        companyPercentage: companyPercentage
      };

      console.log('Creating ad with data:', adData);
      console.log('Request body:', req.body);
      console.log('Uploaded file:', req.file);

      const ad = await storage.createAd(adData);
      console.log('Ad created successfully:', ad);
      res.status(201).json(ad);
    } catch (error) {
      console.error('Error creating ad campaign:', error);
      res.status(500).json({ message: 'Failed to create ad campaign', error: (error as Error).message });
    }
  });

  // Special update route to fix campaign metrics with real values
  apiRouter.get('/admin/fix-campaign/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { ObjectId } = await import('mongodb');

      // Get MongoDB collection directly
      const adsCollection = await getCollection('ads');

      // First get the ad to determine appropriate values based on its budget
      const ad = await adsCollection.findOne({ _id: new ObjectId(id) });
      if (!ad) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Calculate real values based on budget
      const budget = ad.budget || 0;
      let cpm = 0;
      let targetImpressions = 0;

      // Calculate sensible values based on budget
      if (id === "683281182084e60881ea38db") { // Sihab campaign
        cpm = 1000;
        targetImpressions = 8000;
      } else if (id === "6832839b38cb4697f04bbd42") { // Sihab 2 campaign
        cpm = 500;
        targetImpressions = 4000;
      } else {
        // For any other campaign
        cpm = budget > 0 ? budget / 8 : 1000; // CPM as 1/8 of budget
        targetImpressions = budget > 0 ? Math.floor((budget / cpm) * 1000) : 10000;
      }

      // Update the campaign with the real values
      const result = await adsCollection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: {
            cpm: cpm,
            revenuePerView: (cpm / 1000) * 0.7, // 70% to creator
            targetImpressions: targetImpressions,
            remainingImpressions: targetImpressions - (ad.impressions || 0),
            companyPercentage: 30
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      res.json({ 
        success: true,
        message: 'Campaign updated with real values',
        updatedFields: {
          cpm: 1000,
          revenuePerView: 0.7,
          targetImpressions: 8000,
          remainingImpressions: 8000,
          companyPercentage: 30
        }
      });
    } catch (error) {
      console.error('Error fixing campaign:', error);
      res.status(500).json({ message: 'Failed to fix campaign data' });
    }
  });

  // Get ad stats for dashboard
  apiRouter.get('/admin/ads/stats', async (req, res) => {
    try {
      const ads = await storage.getAllAds();

      // Process campaign data with real values from database
      const processedCampaigns = ads.map(ad => {
        // Log the entire ad object to see all available fields
        console.log('Raw ad data from MongoDB:', JSON.stringify(ad, null, 2));

        // Extract the values from the original campaign creation request
        // This ensures we always show the real data from when you created the campaign

        // First, parse the budget to make sure we have a number
        const budget = ad.budget || 0;

        // If CPM is missing, calculate it from the database values or use the values from the request
        let cpm = ad.cpm;
        if (!cpm && ad.budget && ad.targetImpressions) {
          // Calculate CPM based on budget and target impressions
          cpm = (ad.budget / ad.targetImpressions) * 1000;
        }

        // If target impressions is missing, calculate it from CPM and budget
        let targetImpressions = ad.targetImpressions;
        if (!targetImpressions && cpm && ad.budget) {
          targetImpressions = Math.floor((ad.budget / cpm) * 1000);
        }

        // Calculate remaining impressions based on target and current impressions
        let remainingImpressions = ad.remainingImpressions;
        if (remainingImpressions === undefined || remainingImpressions === null) {
          remainingImpressions = Math.max(0, targetImpressions - (ad.impressions || 0));
        }
        // Ensure remaining impressions is never negative
        remainingImpressions = Math.max(0, remainingImpressions);

        // Get company percentage or use default
        let companyPercentage = ad.companyPercentage || 30;

        // If revenue per view is missing, calculate it from CPM and company percentage
        let revenuePerView = ad.revenuePerView;
        if (!revenuePerView && cpm) {
          const creatorPercentage = (100 - companyPercentage) / 100;
          revenuePerView = (cpm / 1000) * creatorPercentage;
        }

        console.log(`Processing campaign ${ad.title} with ID: ${ad._id}`);
        console.log(`Real values - CPM: ${cpm}, Revenue/View: ${revenuePerView}`);

        // Make sure all fields have sensible default values if still undefined
        cpm = cpm || 0;
        targetImpressions = targetImpressions || 0;
        remainingImpressions = remainingImpressions || 0;
        revenuePerView = revenuePerView || 0;

        // Calculate CTR (click-through rate)
        const impressions = ad.impressions || 0;
        const clicks = ad.clicks || 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

        return {
          id: ad._id,
          title: ad.title,
          type: ad.adType,
          status: ad.isActive ? 'active' : 'paused',
          budget: ad.budget || 0,
          spent: ad.spent || 0,
          impressions: impressions,
          clicks: clicks,
          ctr: parseFloat(ctr.toFixed(2)),
          startDate: ad.startDate.toISOString(),
          endDate: ad.endDate.toISOString(),
          targetImpressions: targetImpressions,
          remainingImpressions: remainingImpressions,
          cpm: cpm,
          revenuePerView: revenuePerView,
          companyPercentage: companyPercentage
        };
      });

      const stats = {
        totalRevenue: ads.reduce((sum, ad) => sum + (ad.spent || 0), 0),
        activeCampaigns: ads.filter(ad => ad.isActive).length,
        totalClicks: ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0),
        totalImpressions: ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0),
        ctr: 0,
        campaigns: processedCampaigns
      };

      // Calculate overall CTR
      if (stats.totalImpressions > 0) {
        stats.ctr = parseFloat(((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2));
      }

      res.json(stats);
    } catch (error) {
      console.error('Error fetching ad stats:', error);
      res.status(500).json({ message: 'Failed to fetch ad statistics' });
    }
  });

  // Get active ads for display
  apiRouter.get('/ads/active', async (req, res) => {
    try {
      const { type } = req.query;
      const ads = await storage.getAllAds();
      const activeAds = ads.filter(ad => {
        const remainingImpressions = ad.remainingImpressions !== undefined ? 
          ad.remainingImpressions : 
          Math.max(0, (ad.targetImpressions || 0) - (ad.impressions || 0));

        return ad.isActive && 
          new Date() >= ad.startDate && 
          new Date() <= ad.endDate &&
          (!type || ad.adType === type.toString()) &&
          remainingImpressions > 0; // Only return ads that have remaining impressions
      });
      res.json(activeAds);
    } catch (error) {
      console.error('Error fetching active ads:', error);
      res.status(500).json({ message: 'Failed to fetch active ads' });
    }
  });

  // Track ad impressions for revenue calculation
  apiRouter.post('/videos/ad-impression', async (req, res) => {
    try {
      const { videoId, adId, adType, timestamp } = req.body;

      if (!videoId || !adId || !adType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }

      const videoViewsCollection = await getCollection('video_views');
      const adsCollection = await getCollection('ads');

      // Get the ad details to calculate revenue
      const { ObjectId } = await import('mongodb');
      const ad = await adsCollection.findOne({ _id: new ObjectId(adId) });
      if (!ad) {
        return res.status(404).json({ 
          success: false, 
          message: 'Ad not found' 
        });
      }

      // Check for recent duplicate impressions (within last 30 seconds)
      const recentImpressionThreshold = Date.now() - (30 * 1000); // 30 seconds
      const sessionId = req.sessionID || 'anonymous';

      const recentImpression = await videoViewsCollection.findOne({
        videoId: videoId.toString(),
        sessionId: sessionId,
        'adImpressions.adId': adId,
        'adImpressions.adType': adType,
        'adImpressions.timestamp': { $gte: recentImpressionThreshold }
      });

      if (recentImpression) {
        console.log(`Duplicate ad impression detected for video ${videoId}, ad ${ad.title} - skipping`);
        return res.json({
          success: true,
          revenueEarned: 0,
          adTitle: ad.title,
          message: 'Duplicate impression - not counted'
        });
      }

      console.log(`Tracking ad impression for video ${videoId}, ad ${ad.title}, revenue: $${ad.revenuePerView || 0}`);

      // Create or update video view record with ad impression
      const adImpression = {
        adId: adId,
        adType,
        timestamp: timestamp || Date.now(),
        revenueEarned: ad.revenuePerView || 0
      };

      // Always create a new impression record for accurate tracking
      const viewRecord = {
        videoId: videoId.toString(),
        adImpressions: [adImpression],
        createdAt: new Date(),
        sessionId: sessionId,
        userAgent: req.headers['user-agent'] || 'unknown'
      };

      const result = await videoViewsCollection.insertOne(viewRecord);
      console.log(`Created view record with ID: ${result.insertedId}`);

      // Update ad impression count and decrease remaining impressions
      await adsCollection.updateOne(
        { _id: new ObjectId(adId) },
        { 
          $inc: { 
            impressions: 1,
            remainingImpressions: -1
          },
          $set: { lastShown: new Date() }
        }
      );

      console.log(`Ad impression tracked: Video ${videoId}, Ad ${ad.title}, Revenue: $${ad.revenuePerView || 0}`);

      res.json({
        success: true,
        revenueEarned: ad.revenuePerView || 0,
        adTitle: ad.title
      });
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  });

  // Track ad click
  apiRouter.post('/ads/:id/click', async (req, res) => {
    try {
      const { id } = req.params;
      const ad = await storage.getAdById(id);
      if (ad) {
        const newClicks = (ad.clicks || 0) + 1;
        const newImpressions = ad.impressions || 1;
        const newCtr = (newClicks / newImpressions) * 100;

        // Create a properly typed update object
        const updateData: Partial<MongoAd> = {
          clicks: newClicks,
          ctr: newCtr
        };
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking click:', error);
      res.status(500).json({ message: 'Failed to track click' });
    }
  });

  // Withdrawal management routes
  apiRouter.get('/admin/withdraws', async (req, res) => {
    try {
      const { status } = req.query;
      const withdraws = await storage.getAllWithdrawRequests(status as string);
      res.json(withdraws);
    } catch (error) {
      console.error('Error fetching withdraws:', error);
      res.status(500).json({ message: 'Failed to fetch withdrawal requests' });
    }
  });

  apiRouter.get('/admin/withdraws/stats', async (req, res) => {
    try {
      const stats = await storage.getWithdrawStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching withdraw stats:', error);
      res.status(500).json({ message: 'Failed to fetch withdrawal stats' });
    }
  });

  apiRouter.patch('/admin/withdraws/:id/process', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const withdraw = await storage.updateWithdrawRequest(id, {
        status,
        adminNotes,
        processedAt: new Date()
      });

      if (!withdraw) {
        return res.status(404).json({ message: 'Withdrawal request not found' });
      }

      res.json(withdraw);
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      res.status(500).json({ message: 'Failed to process withdrawal request' });
    }
  });

  // Analytics endpoint
  apiRouter.post('/videos/analytics', async (req, res) => {
    try {
      const { videoId, currentTime, quality, playbackSpeed, volume, timestamp } = req.body;

      // Here you can store detailed analytics in a separate collection if needed
      console.log('Analytics received:', { videoId, currentTime, quality, playbackSpeed, volume, timestamp });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error handling analytics:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Debug route to check video revenue data
  apiRouter.get('/debug/video-revenue/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      const videoViewsCollection = await getCollection('video_views');
      const adsCollection = await getCollection('ads');

      // Get all view records for this video
      const videoViews = await videoViewsCollection.find({ videoId }).toArray();

      // Get all ads
      const ads = await adsCollection.find({}).toArray();

      let totalRevenue = 0;
      const revenueBreakdown = [];

      for (const view of videoViews) {
        if (view.adImpressions && view.adImpressions.length > 0) {
          for (const impression of view.adImpressions) {
            const ad = ads.find(a => a._id.toString() === impression.adId);
            if (ad && ad.revenuePerView) {
              totalRevenue += ad.revenuePerView;
              revenueBreakdown.push({
                adTitle: ad.title,
                revenuePerView: ad.revenuePerView,
                timestamp: impression.timestamp
              });
            }
          }
        }
      }

      res.json({
        videoId,
        totalViews: videoViews.length,
        totalRevenue,
        revenueBreakdown,
        allViewRecords: videoViews,
        availableAds: ads.map(ad => ({
          id: ad._id,
          title: ad.title,
          revenuePerView: ad.revenuePerView,
          impressions: ad.impressions
        }))
      });
    } catch (error) {
      console.error('Error getting debug revenue data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Check monetization approval status
  apiRouter.get('/monetization/status', isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const usersCollection = await getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        monetizationStatus: user.monetizationStatus || 'not_requested',
        monetizationRequestedAt: user.monetizationRequestedAt || null,
        monetizationApprovedAt: user.monetizationApprovedAt || null,
        hasAccess: user.monetizationStatus === 'approved'
      });
    } catch (error) {
      console.error('Error getting monetization status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Request monetization access
  apiRouter.post('/monetization/request', isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const usersCollection = await getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.monetizationStatus === 'approved') {
        return res.status(400).json({ message: 'Monetization already approved' });
      }

      if (user.monetizationStatus === 'pending') {
        return res.status(400).json({ message: 'Monetization request already pending' });
      }

      // Update user's monetization status to pending
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            monetizationStatus: 'pending',
            monetizationRequestedAt: new Date()
          }
        }
      );

      res.json({ 
        success: true, 
        message: 'Monetization request submitted successfully. Please wait for admin approval.' 
      });
    } catch (error) {
      console.error('Error requesting monetization:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Monetization routes (protected by approval check)
  apiRouter.get('/monetization/stats', isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const usersCollection = await getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if monetization is approved
      if (user.monetizationStatus !== 'approved') {
        return res.status(403).json({ 
          message: 'Monetization access not approved',
          monetizationStatus: user.monetizationStatus || 'not_requested'
        });
      }

      // Get user's current balance
      const availableBalance = user.balance || 0;

      // Get withdrawal requests for this user
      const withdrawalHistory = await storage.getAllWithdrawRequests();
      const userWithdrawals = withdrawalHistory.filter(w => w.userId === userId);

      // Calculate pending withdrawals
      const pendingWithdrawals = userWithdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);

      // Calculate total earnings (balance + withdrawn amounts)
      const totalWithdrawn = userWithdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0);

      const totalEarnings = availableBalance + totalWithdrawn + pendingWithdrawals;

      res.json({
        totalEarnings,
        pendingWithdrawals,
        availableBalance,
        withdrawalHistory: userWithdrawals,
        orders: []
      });
    } catch (error) {
      console.error('Error getting monetization stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Transfer video revenue to monetization balance
  apiRouter.post('/monetization/transfer-revenue', isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get user's total video revenue
      const videosCollection = await getCollection('videos');
      const videoViewsCollection = await getCollection('video_views');
      const adsCollection = await getCollection('ads');
      const usersCollection = await getCollection('users');

      // Get all videos for the creator
      const videos = await videosCollection.find({ userId }).toArray();

      let totalRevenue = 0;

      for (const video of videos) {
        // Get actual ad views for this video and calculate available revenue only
        const videoViews = await videoViewsCollection.find({ 
          videoId: video._id.toString() 
        }).toArray();

        for (const view of videoViews) {
          if (view.adImpressions && view.adImpressions.length > 0) {
            for (const adImpression of view.adImpressions) {
              // Only count revenue if not already transferred
              if (!adImpression.transferred) {
                const ad = await adsCollection.findOne({ _id: new ObjectId(adImpression.adId) });
                if (ad && ad.revenuePerView) {
                  totalRevenue += ad.revenuePerView;
                }
              }
            }
          }
        }
      }

      if (totalRevenue === 0) {
        return res.status(400).json({ message: 'No revenue available to transfer' });
      }

      // Update user's balance (add a balance field to user)
      const user = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { 
          $inc: { balance: totalRevenue },
          $set: { lastRevenueTransfer: new Date() }
        },
        { returnDocument: 'after' }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Mark all ad impressions as transferred
      for (const video of videos) {
        await videoViewsCollection.updateMany(
          { 
            videoId: video._id.toString(),
            'adImpressions.transferred': { $ne: true }
          },
          { 
            $set: { 'adImpressions.$[elem].transferred': true } 
          },
          {
            arrayFilters: [{ 'elem.transferred': { $ne: true } }]
          }
        );
      }

      res.json({
        success: true,
        transferredAmount: totalRevenue,
        newBalance: user.balance || totalRevenue,
        message: `Successfully transferred $${totalRevenue.toFixed(2)} to your monetization balance`
      });

    } catch (error) {
      console.error('Error transferring revenue:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Save payment method
  apiRouter.post('/monetization/payment-methods', isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const { type, details } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Validate input
      if (!type || !details) {
        return res.status(400).json({ message: 'Type and details are required' });
      }

      // Type-specific validation
      if (type === 'paypal' && !details.email) {
        return res.status(400).json({ message: 'PayPal email is required' });
      }

      if (type === 'bank' && (!details.bankName || !details.accountNumber || !details.routingNumber)) {
        return res.status(400).json({ message: 'All bank details are required' });
      }

      if (type === 'crypto' && (!details.type || !details.address)) {
        return res.status(400).json({ message: 'Crypto type and address are required' });
      }

      const usersCollection = await getCollection('users');
      const updateField = `paymentMethods.${type}`;

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            [updateField]: details,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      console.log(`Payment method ${type} saved for user ${userId}:`, details);
      res.json({ success: true, message: 'Payment method saved successfully' });
    } catch (error) {
      console.error('Error saving payment method:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get payment methods
  apiRouter.get('/monetization/payment-methods', isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const usersCollection = await getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ paymentMethods: user.paymentMethods || {} });
    } catch (error) {
      console.error('Error getting payment methods:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create withdrawal request
  apiRouter.post('/monetization/withdraw', isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const { amount, method, accountDetails } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const usersCollection = await getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userBalance = user.balance || 0;

      if (amount > userBalance) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      const withdrawRequest = {
        userId,
        username: user.username,
        email: user.email,
        amount,
        method,
        accountDetails: accountDetails || {},
        status: 'pending',
        requestedAt: new Date(),
        userBalance
      };

      const result = await storage.createWithdrawRequest(withdrawRequest);

      // Deduct amount from user balance
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { balance: -amount } }
      );

      res.json({
        success: true,
        withdrawRequest: result,
        message: 'Withdrawal request submitted successfully'
      });

    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}