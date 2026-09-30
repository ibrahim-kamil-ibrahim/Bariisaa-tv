import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { generateSignedGetUrl } from '../../utils/signedUrl';
import { AppError } from '../../middleware/errorHandler';
import { getActivePlanId, hasContentAccess, isFreeContent } from '../../middleware/subscriptionGuard';

/**
 * GET /api/v1/books/:bookId/media/:fileType/:fileId
 *
 * Returns a short-lived signed URL for a book's premium media (audio/PDF).
 * - Authenticated only.
 * - The caller's subscription is checked (via book.isPremium) so non-entitled
 *   users never receive a usable media URL.
 * - The actual stored file key is resolved from the Prisma record (audioFile
 *   or pdfFile) so the signed URL targets the real object in storage.
 *
 * fileType: 'audio' | 'pdf'
 * fileId:  the Prisma id of the AudioFile or PdfFile record
 */
export async function getMediaSignedUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookId, fileType, fileId } = req.params;

    if (!bookId || !fileType || !fileId) {
      res.status(400).json({ success: false, message: 'bookId, fileType, and fileId are required' });
      return;
    }

    if (fileType !== 'audio' && fileType !== 'pdf') {
      res.status(400).json({ success: false, message: 'fileType must be audio or pdf' });
      return;
    }

    // Resolve the actual stored file key from the DB.
    const fileIdStr = Array.isArray(fileId) ? fileId[0] : fileId;
    const record = fileType === 'audio'
      ? await prisma.audioFile.findUnique({ where: { id: fileIdStr } })
      : await prisma.pdfFile.findUnique({ where: { id: fileIdStr } });

    if (!record) {
      res.status(404).json({ success: false, message: `${fileType === 'audio' ? 'Audio' : 'PDF'} file not found` });
      return;
    }

    // Book ownership check — file must belong to the requested book.
    if (record.bookId !== bookId) {
      res.status(404).json({ success: false, message: 'File not found for this book' });
      return;
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    // Entitlement: paid content requires an active subscription. The signed URL
    // is short-lived, but this keeps the endpoint honest — non-entitled callers
    // never receive a usable media URL.
    if (!isFreeContent(book)) {
      const userId = (req as any).userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const activePlanId = await getActivePlanId(userId);
      if (!hasContentAccess(book, activePlanId)) {
        // Return a web-friendly response instead of throwing — the mobile client
        // expects a JSON response it can render, not a raw exception.
        res.status(403).json({ success: false, message: 'Premium content subscription required' });
        return;
      }
    }

    let url: string;
    try {
      url = await generateSignedGetUrl(record.fileUrl);
    } catch (err) {
      if (err instanceof Error && err.message.includes('storage not configured')) {
        res.status(503).json({
          success: false,
          message: 'Media storage is not configured on the server. Please try again later.',
        });
        return;
      }
      throw err;
    }

    res.json({ success: true, data: { url, expiresIn: 120 } });
  } catch (err) {
    next(err);
  }
}
