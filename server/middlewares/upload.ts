import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer with memory storage for buffer processing
const storage = multer.memoryStorage();

// Create multer instance with 5MiB file size limit
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MiB size limit
  },
  fileFilter: (_req, file, callback) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(new Error('Only image files are allowed'));
    }
  }
});

// Error handling middleware for multer
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File size exceeds limit of 5MiB' 
      });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
}; 