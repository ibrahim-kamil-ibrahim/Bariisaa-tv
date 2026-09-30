import { Router } from 'express';
import * as bookController from './book.controller';
import { validate } from '../../middleware/validate';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { auditLog } from '../../middleware/auditLog';
import { uploadImage, uploadAudio, uploadPdf, uploadMultiple } from '../../middleware/upload';
import { createBookSchema, updateBookSchema, bookQuerySchema } from './book.validation';
import { getMediaSignedUrl } from './bookMediaProxy.controller';

const router: Router = Router();

router.post('/', authenticate, authorize('books:create'), auditLog('create', 'book'), uploadMultiple as any, validate(createBookSchema), bookController.createBook);
router.put('/:id', authenticate, authorize('books:update'), auditLog('update', 'book'), validate(updateBookSchema), bookController.updateBook);
router.delete('/:id', authenticate, authorize('books:delete'), auditLog('delete', 'book'), bookController.deleteBook);
router.get('/featured', optionalAuth, bookController.getFeaturedBooks);
router.get('/trending', optionalAuth, bookController.getTrendingBooks);
router.get('/new-releases', optionalAuth, bookController.getNewReleases);
router.get('/free', optionalAuth, bookController.getFreeBooks);
router.get('/:id/related', optionalAuth, bookController.getRelatedBooks);
router.get('/:id', optionalAuth, bookController.getBookById);
router.get('/', optionalAuth, validate(bookQuerySchema, 'query'), bookController.listBooks);
router.put('/:id/cover', authenticate, authorize('books:update'), uploadImage as any, bookController.uploadBookCover);
router.put('/:id/thumbnail', authenticate, authorize('books:update'), uploadImage as any, bookController.uploadBookThumbnail);
router.post('/:id/audio', authenticate, authorize('books:update'), uploadAudio as any, bookController.uploadBookAudio);
router.delete('/:id/audio/:audioId', authenticate, authorize('books:update'), bookController.deleteBookAudio);
router.post('/:id/pdf', authenticate, authorize('books:update'), uploadPdf as any, bookController.uploadBookPdf);
router.delete('/:id/pdf/:pdfId', authenticate, authorize('books:update'), bookController.deleteBookPdf);
router.get('/:bookId/media/:fileType/:fileId', authenticate, getMediaSignedUrl);

export default router;
