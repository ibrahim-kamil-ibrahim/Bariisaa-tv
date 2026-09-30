import { Router } from 'express';
import * as musicController from './music.controller';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { upload } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { createTrackSchema, updateTrackSchema } from './music.validation';

const router: Router = Router();

router.post('/',           authenticate, authorize('music:create'), auditLog('create', 'music'), validate(createTrackSchema), musicController.createTrack);
router.put('/:id',         authenticate, authorize('music:update'), auditLog('update', 'music'), validate(updateTrackSchema), musicController.updateTrack);
router.delete('/:id',      authenticate, authorize('music:delete'), auditLog('delete', 'music'), musicController.deleteTrack);
router.get('/featured',    optionalAuth, musicController.getFeaturedTracks);
router.get('/genres',      optionalAuth, musicController.getGenres);
router.post('/:id/play',   optionalAuth, musicController.incrementPlay);
router.get('/:id/play',    optionalAuth, musicController.getPlayUrl);
router.get('/:id',         optionalAuth, musicController.getTrackById);
router.get('/',            optionalAuth, musicController.listTracks);

// File uploads from device
router.post('/upload-audio', authenticate, authorize('music:create'), upload.single('audio'), musicController.uploadAudio);
router.post('/upload-cover', authenticate, authorize('music:create'), upload.single('cover'), musicController.uploadCover);
router.post('/upload-pdf',   authenticate, authorize('music:create'), upload.single('pdf'), musicController.uploadPdf);

export default router;
