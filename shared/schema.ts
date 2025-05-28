import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  subscribers: integer("subscribers").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  avatarUrl: true
});

// Videos Table
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  duration: text("duration"),
  category: text("category"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  description: true,
  userId: true,
  videoUrl: true,
  thumbnailUrl: true,
  category: true,
  tags: true,
  duration: true
});

// Comments Table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  videoId: integer("video_id").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  userId: true,
  videoId: true
});

// Watch History Table
export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  videoId: integer("video_id").notNull(),
  watchedAt: timestamp("watched_at").defaultNow()
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).pick({
  userId: true,
  videoId: true
});

// Watch Later Table
export const watchLater = pgTable("watch_later", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  videoId: integer("video_id").notNull(),
  addedAt: timestamp("added_at").defaultNow()
});

export const insertWatchLaterSchema = createInsertSchema(watchLater).pick({
  userId: true,
  videoId: true
});

// Likes Table (for videos)
export const videoLikes = pgTable("video_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  videoId: integer("video_id").notNull(),
  isLike: boolean("is_like").notNull(), // true for like, false for dislike
  createdAt: timestamp("created_at").defaultNow()
});

export const insertVideoLikeSchema = createInsertSchema(videoLikes).pick({
  userId: true,
  videoId: true,
  isLike: true
});

// Subscriptions Table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id").notNull(),
  channelId: integer("channel_id").notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow()
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  subscriberId: true,
  channelId: true
});

// Ads Table for Admin
export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  targetUrl: text("target_url").notNull(),
  adType: text("ad_type").notNull(), // banner, video-overlay, sidebar, pre-roll
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  budget: integer("budget").default(0), // in cents
  spent: integer("spent").default(0), // in cents
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  ctr: integer("ctr").default(0), // click-through rate * 10000 for precision
  createdAt: timestamp("created_at").defaultNow()
});

export const insertAdSchema = createInsertSchema(ads).pick({
  title: true,
  description: true,
  imageUrl: true,
  targetUrl: true,
  adType: true,
  startDate: true,
  endDate: true,
  budget: true
});

// Withdraw Requests Table for Admin
export const withdrawRequests = pgTable("withdraw_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // in cents
  method: text("method").notNull(), // paypal, bank, crypto
  accountDetails: jsonb("account_details").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected, completed
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  adminNotes: text("admin_notes")
});

export const insertWithdrawRequestSchema = createInsertSchema(withdrawRequests).pick({
  userId: true,
  amount: true,
  method: true,
  accountDetails: true
});

// MongoDB specific types for our application
export type MongoUser = {
  _id: string;
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
  subscribers: number;
  isBanned?: boolean;
  banReason?: string;
  createdAt: Date;
};

export type MongoVideo = {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  views: number;
  likes: number;
  dislikes: number;
  duration?: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  canRestoreUntil?: Date;
};

export type MongoComment = {
  _id: string;
  content: string;
  userId: string;
  videoId: string;
  likes: number;
  createdAt: Date;
};

// MongoDB specific validation schema for comments
export const mongoCommentSchema = z.object({
  content: z.string().min(1),
  userId: z.string(),
  videoId: z.string()
});

export type MongoPlaylist = {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  videos: string[];
  createdAt: Date;
  isPrivate: boolean;
};

export type MongoWatchHistory = {
  _id: string;
  userId: string;
  videoId: string;
  watchedAt: Date;
};

export type MongoWatchLater = {
  _id: string;
  userId: string;
  videoId: string;
  addedAt: Date;
};

export type MongoVideoLike = {
  _id: string;
  userId: string;
  videoId: string;
  isLike: boolean;
  createdAt: Date;
};

export type MongoSubscription = {
  _id: string;
  subscriberId: string;
  channelId: string;
  subscribedAt: Date;
};

export type MongoAd = {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  targetUrl: string;
  adType: 'banner' | 'video-overlay' | 'sidebar' | 'pre-roll';
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: Date;
  cpm: number;
  revenuePerView: number;
  targetImpressions: number;
  remainingImpressions: number;
  companyPercentage: number;
};

export interface MongoWithdrawRequest {
  _id: string;
  userId: string;
  username: string;
  email: string;
  amount: number;
  method: 'paypal' | 'bank' | 'crypto';
  accountDetails: {
    paypalEmail?: string;
    bankAccount?: string;
    bankName?: string;
    routingNumber?: string;
    cryptoAddress?: string;
    cryptoType?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Date;
  processedAt?: Date;
  adminNotes?: string;
  userBalance: number;
}

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type WatchHistory = typeof watchHistory.$inferSelect;
export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;

export type WatchLater = typeof watchLater.$inferSelect;
export type InsertWatchLater = z.infer<typeof insertWatchLaterSchema>;

export type VideoLike = typeof videoLikes.$inferSelect;
export type InsertVideoLike = z.infer<typeof insertVideoLikeSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Ad = typeof ads.$inferSelect;
export type InsertAd = z.infer<typeof insertAdSchema>;

export type WithdrawRequest = typeof withdrawRequests.$inferSelect;
export type InsertWithdrawRequest = z.infer<typeof insertWithdrawRequestSchema>;