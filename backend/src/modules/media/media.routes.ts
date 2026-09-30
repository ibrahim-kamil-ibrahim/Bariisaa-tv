import { Router } from 'express';
import * as mediaController from './media.controller';
import * as videoController from './video.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { videoUploadUrlSchema, thumbnailUploadUrlSchema } from './video.validation';

const router: Router = Router();

// Folders
router.post('/folders', authenticate, authorize('media:create'), auditLog('create', 'media-folder'), mediaController.createFolder);
router.put('/folders/:id', authenticate, authorize('media:update'), auditLog('update', 'media-folder'), mediaController.updateFolder);
router.delete('/folders/:id', authenticate, authorize('media:delete'), auditLog('delete', 'media-folder'), mediaController.deleteFolder);
router.get('/folders', authenticate, mediaController.listFolders);

// Files
router.post('/files', authenticate, authorize('media:create'), upload.single('file'), mediaController.uploadFile);
router.put('/files/:id', authenticate, authorize('media:update'), auditLog('update', 'media-file'), mediaController.updateFile);
router.delete('/files/:id', authenticate, authorize('media:delete'), auditLog('delete', 'media-file'), mediaController.deleteFile);
router.post('/files/:id/restore', authenticate, authorize('media:update'), mediaController.restoreFile);
router.get('/files/:id/preview', authenticate, mediaController.previewFile);
router.get('/files', authenticate, mediaController.listFiles);
router.get('/stats', authenticate, mediaController.getStats);

// Videos — Cloudflare R2 direct upload + secure playback
router.post('/videos/upload-url', authenticate, authorize('media:create'), validate(videoUploadUrlSchema), auditLog('create', 'media-video'), videoController.requestVideoUploadUrl);
router.post('/videos/:id/complete', authenticate, authorize('media:update'), auditLog('update', 'media-video'), videoController.completeVideoUpload);
router.get('/videos/:id/play', authenticate, videoController.getVideoPlaybackUrl);
router.get('/videos/:id', authenticate, videoController.getVideo);
router.delete('/videos/:id', authenticate, authorize('media:delete'), auditLog('delete', 'media-video'), videoController.deleteVideo);
router.post('/videos/:id/thumbnail/upload-url', authenticate, authorize('media:update'), validate(thumbnailUploadUrlSchema), videoController.requestThumbnailUploadUrl);

export default router;
