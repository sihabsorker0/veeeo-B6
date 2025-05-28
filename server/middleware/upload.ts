import multer from 'multer';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Create upload directories if they don't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const videoDir = path.join(uploadDir, 'videos');
const thumbnailDir = path.join(uploadDir, 'thumbnails');
const avatarDir = path.join(uploadDir, 'avatars');
const adDir = path.join(uploadDir, 'ads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir);
}
if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir);
}
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir);
}
if (!fs.existsSync(adDir)) {
  fs.mkdirSync(adDir);
}

// Configure storage for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Configure storage for thumbnails
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, thumbnailDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for videos
const videoFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, MOV, AVI, and MPEG videos are allowed.'));
  }
};

// File filter for thumbnails
const thumbnailFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'));
  }
};

// Create upload middlewares
export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 * 1024 // 15GB limit
  }
}).single('video');

export const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: thumbnailFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for thumbnails
  }
}).single('thumbnail');

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: thumbnailFilter, // Same as thumbnail filter (images)
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('avatar');

// Configure storage for ads
const adStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, adDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filter for ad content (images and videos)
const adFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed for ads'));
  }
};

export const uploadAdContent = multer({
  storage: adStorage,
  fileFilter: adFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024 // 5GB limit for ads
  }
}).single('adContent');

// Function to get file paths
export const getFilePath = (directory: string, filename: string) => {
  return path.join(directory, filename);
};

// Function to delete a file
export const deleteFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
