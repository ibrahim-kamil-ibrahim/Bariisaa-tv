import multer from 'multer';
import { AppError } from './errorHandler';
import sharp from 'sharp';

const storage = multer.memoryStorage();

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed`, 400));
  }
};

// Image size validation options
export interface ImageValidationOptions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxFileSize?: number; // bytes
}

// Create a middleware that validates image dimensions and file size
export const validateImageDimensions = (options: ImageValidationOptions = {}) => {
  return async (req: Express.Request, res: Express.Response, next: any) => {
    if (!req.file) {
      return next();
    }

    try {
      const metadata = await sharp(req.file.buffer).metadata();
      const { width, height } = metadata;

      // Width checks
      if (options.minWidth && width < options.minWidth) {
        throw new AppError(
          `Image width ${width}px is smaller than minimum ${options.minWidth}px`,
          400
        );
      }
      if (options.maxWidth && width > options.maxWidth) {
        throw new AppError(
          `Image width ${width}px exceeds maximum ${options.maxWidth}px`,
          400
        );
      }

      // Height checks
      if (options.minHeight && height < options.minHeight) {
        throw new AppError(
          `Image height ${height}px is smaller than minimum ${options.minHeight}px`,
          400
        );
      }
      if (options.maxHeight && height > options.maxHeight) {
        throw new AppError(
          `Image height ${height}px exceeds maximum ${options.maxHeight}px`,
          400
        );
      }

      // File size check
      if (options.maxFileSize && req.file.size > options.maxFileSize) {
        throw new AppError(
          `File size ${req.file.size} bytes exceeds maximum ${options.maxFileSize} bytes`,
          400
        );
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Failed to validate image dimension', 400));
      }
    }
  };
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
});

// Pre-validatated upload handlers
export const uploadImage = upload.single('image');
export const uploadAudio = upload.single('audio');
export const uploadPdf = upload.single('pdf');
export const uploadMultiple = upload.fields([
  { name: 'audio', maxCount: 50 },
  { name: 'pdf', maxCount: 5 },
  { name: 'cover', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

export const uploadScreenTheme = upload.fields([
  { name: 'avatar', maxCount: 1 },
]);

// Pre-defined validation presets (typed as ImageValidationOptions)
export interface ImageValidations {
  cover: ImageValidationOptions;
  thumbnail: ImageValidationOptions;
  avatar: ImageValidationOptions;
  screenTheme: ImageValidationOptions;
}

export const imageValidations: ImageValidations = {
  // Content card cover (small, e.g., 300x300 px or landscape)
  cover: {
    minWidth: 200,
    minHeight: 200,
    maxWidth: 1200,
    maxHeight: 1200,
    maxFileSize: 500 * 1024, // 500 KB
  },

  // Thumbnail/advertising banner
  thumbnail: {
    minWidth: 150,
    minHeight: 150,
    maxWidth: 600,
    maxHeight: 600,
    maxFileSize: 250 * 1024, // 250 KB
  },

  // Author or user avatar
  avatar: {
    minWidth: 100,
    minHeight: 100,
    maxWidth: 400,
    maxHeight: 400,
    maxFileSize: 300 * 1024, // 300 KB
  },

  // Screen theme image (full screen)
  screenTheme: {
    minWidth: 1280,
    minHeight: 720,
    maxWidth: 1920,
    maxHeight: 1080,
    maxFileSize: 1 * 1024 * 1024, // 1 MB
  },
};

// Middleware factory: validates an uploaded file against given options
export const validateUpload = (validation: ImageValidationOptions) => {
  return async (req: Express.Request, res: Express.Response, next: any) => {
    const file = req.file;
    if (!file) return next();

    // Validate image dimensions and size
    await validateImageDimensions(validation)(req, res, next);
  };
};
