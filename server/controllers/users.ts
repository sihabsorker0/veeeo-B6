import { Request, Response } from 'express';
import { getCollection } from '../config/db';
import { MongoUser, insertUserSchema } from '@shared/schema';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Register a new user
export const registerUser = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = insertUserSchema.parse(req.body);
    
    const usersCollection = await getCollection('users');
    
    // Check if username or email already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { username: validatedData.username },
        { email: validatedData.email }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username or email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user with MongoDB
    const newUser: Omit<MongoUser, '_id'> = {
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
      avatarUrl: validatedData.avatarUrl || '',
      subscribers: 0,
      createdAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    // Create session for the user
    if (req.session) {
      req.session.userId = result.insertedId.toString();
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        ...userWithoutPassword,
        _id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: fromZodError(error).message 
      });
    }
    
    res.status(500).json({ message: 'Internal server error during registration' });
  }
};

// Login user
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const usersCollection = await getCollection('users');
    
    // Find user by username
    const user = await usersCollection.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Create session
    if (req.session) {
      req.session.userId = user._id.toString();
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

// Logout user
export const logoutUser = async (req: Request, res: Response) => {
  try {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
      });
    } else {
      res.status(200).json({ message: 'Already logged out' });
    }
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ message: 'Internal server error during logout' });
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Remove password from user object
    const { password, ...userWithoutPassword } = req.user;
    
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user by ID
// Get user's videos
export const getUserVideos = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const videosCollection = await getCollection('videos');
    const videos = await videosCollection.find({ userId: id })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.status(200).json({ videos });
  } catch (error) {
    console.error('Error getting user videos:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from user object
    const { password, ...userWithoutPassword } = user as MongoUser;
    
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user profile
export const updateUser = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get user ID from URL params if provided, otherwise use authenticated user ID
    const targetUserId = req.params.id || req.userId;
    
    // Ensure user can only update their own profile
    if (targetUserId !== req.userId) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }
    
    const { username, email, avatarUrl, displayName, bio } = req.body;
    const updateData: { [key: string]: any } = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    if (displayName) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    
    // Handle uploaded avatar file
    if ((req as any).file) {
      const avatarUrl = `/uploads/avatars/${(req as any).file.filename}`;
      updateData.avatarUrl = avatarUrl;
    }
    
    const usersCollection = await getCollection('users');
    
    // Check if username is already taken by another user
    if (username) {
      const existingUser = await usersCollection.findOne({
        _id: { $ne: new ObjectId(req.userId) },
        username
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Update user
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(req.userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from user object
    const { password, ...userWithoutPassword } = result as MongoUser;
    
    res.status(200).json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Subscribe to a channel
export const subscribeToChannel = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { channelId } = req.params;
    
    if (!ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channel ID' });
    }
    
    if (req.userId === channelId) {
      return res.status(400).json({ message: 'You cannot subscribe to your own channel' });
    }
    
    const usersCollection = await getCollection('users');
    const subscriptionsCollection = await getCollection('subscriptions');
    
    // Check if channel exists
    const channel = await usersCollection.findOne({ _id: new ObjectId(channelId) });
    
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    
    // Check if already subscribed
    const existingSubscription = await subscriptionsCollection.findOne({
      subscriberId: req.userId,
      channelId
    });
    
    if (existingSubscription) {
      return res.status(400).json({ message: 'Already subscribed to this channel' });
    }
    
    // Create subscription
    await subscriptionsCollection.insertOne({
      subscriberId: req.userId,
      channelId,
      subscribedAt: new Date()
    });
    
    // Increment subscriber count
    await usersCollection.updateOne(
      { _id: new ObjectId(channelId) },
      { $inc: { subscribers: 1 } }
    );
    
    res.status(200).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error subscribing to channel:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Unsubscribe from a channel
export const unsubscribeFromChannel = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const { channelId } = req.params;
    
    if (!ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channel ID' });
    }
    
    const usersCollection = await getCollection('users');
    const subscriptionsCollection = await getCollection('subscriptions');
    
    // Check if subscription exists
    const existingSubscription = await subscriptionsCollection.findOne({
      subscriberId: req.userId,
      channelId
    });
    
    if (!existingSubscription) {
      return res.status(400).json({ message: 'Not subscribed to this channel' });
    }
    
    // Delete subscription
    await subscriptionsCollection.deleteOne({
      subscriberId: req.userId,
      channelId
    });
    
    // Decrement subscriber count
    await usersCollection.updateOne(
      { _id: new ObjectId(channelId) },
      { $inc: { subscribers: -1 } }
    );
    
    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing from channel:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's subscriptions
export const getUserSubscriptions = async (req: Request, res: Response) => {
  try {
    // Get user ID from session or request
    const userId = req.userId || (req.session && req.session.userId);
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const subscriptionsCollection = await getCollection('subscriptions');
    const usersCollection = await getCollection('users');
    
    // Get all subscription documents
    const subscriptions = await subscriptionsCollection.find({
      subscriberId: userId
    }).toArray();
    
    // Get channel ids
    const channelIds = subscriptions.map(sub => new ObjectId(sub.channelId));
    
    if (channelIds.length === 0) {
      return res.status(200).json({ subscriptions: [] });
    }
    
    // Get channel details
    const channels = await usersCollection.find({
      _id: { $in: channelIds }
    }).project({ password: 0 }).toArray();
    
    res.status(200).json({ subscriptions: channels });
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get videos from subscribed channels
export const getSubscriptionVideos = async (req: Request, res: Response) => {
  try {
    // Get user ID from session or request
    const userId = req.userId || (req.session && req.session.userId);
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const subscriptionsCollection = await getCollection('subscriptions');
    const videosCollection = await getCollection('videos');
    
    // Get all subscription documents
    const subscriptions = await subscriptionsCollection.find({
      subscriberId: userId
    }).toArray();
    
    // Get channel ids
    const channelIds = subscriptions.map(sub => sub.channelId);
    
    if (channelIds.length === 0) {
      return res.status(200).json({ videos: [] });
    }
    
    // Get videos from subscribed channels, sorted by newest first
    const videos = await videosCollection.find({
      userId: { $in: channelIds }
    }).sort({ createdAt: -1 }).toArray();
    
    res.status(200).json({ videos });
  } catch (error) {
    console.error('Error getting subscription videos:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Change user password
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const usersCollection = await getCollection('users');
    
    // Get current user
    const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) }) as MongoUser;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await usersCollection.updateOne(
      { _id: new ObjectId(req.userId) },
      { $set: { password: hashedNewPassword } }
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
