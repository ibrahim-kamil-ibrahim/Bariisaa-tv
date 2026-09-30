import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getMediaSignedUrl } from './bookMediaProxy.controller';

const router = Router();

/**
 * Premium media proxy — generates short-lived signed URLs for audio/PDF files.
 *
 * Storage proxy for premium book media. The backend stores file keys (not full
 * URLs) and the client receives only expiring signed URLs via this endpoint.
 * This keeps storage credentials server-side and makes premium entitlement
 * enforceable at the URL-generation layer.
 *
 * NOTE: the media files themselves are served by the storage provider (R2/S3/local).
 * This endpoint does NOT serve file bytes — it only issues signed URLs.
 */
router.get('/:bookId/media/:fileType/:fileId', authenticate, getMediaSignedUrl);

export default router;
