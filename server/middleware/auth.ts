import { Request, Response, NextFunction } from 'express';
import { getCollection } from '../config/db';
import { MongoUser } from '@shared/schema';
import { ObjectId } from 'mongodb';

// Extend the Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: MongoUser;
      userId?: string;
    }
  }
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated via session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized: Please login to access this resource' });
    }

    // Get user from database
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(req.session.userId) });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request
    req.user = user as MongoUser;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

// Optional authentication middleware - continues even if no user is logged in
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session && req.session.userId) {
      const usersCollection = await getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(req.session.userId) });
      
      if (user) {
        req.user = user as MongoUser;
        req.userId = user._id.toString();
      }
    }
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if there's an error
  }
};
