import multer from 'multer';
import { AppError } from './errorHandler';

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

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

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
