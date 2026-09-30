/* eslint-disable @typescript-eslint/no-explicit-any */
import { mockPrisma } from '../../../test/mocks/prisma.mock';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('../../config/environment', () => ({
  env: { R2_PUBLIC_URL: '' },
}));

jest.mock('../../services/storage/r2.service', () => ({
  R2_UPLOAD_URL_EXPIRY: 900,
  R2_DOWNLOAD_URL_EXPIRY: 300,
  generateVideoKey: jest.fn((bookId: string, videoId: string) => `videos/${bookId}/${videoId}/original/video.mp4`),
  generateThumbnailKey: jest.fn(() => 'thumbnails/book/video/thumbnail.jpg'),
  createUploadUrl: jest.fn(),
  createDownloadUrl: jest.fn(),
  deleteObject: jest.fn(),
  objectExists: jest.fn(),
  getPublicUrl: jest.fn(),
}));

jest.mock('../subscriptions/subscription.service', () => ({
  checkSubscriptionActive: jest.fn(),
}));

import * as r2 from '../../services/storage/r2.service';
import { checkSubscriptionActive } from '../subscriptions/subscription.service';
import * as videoService from './video.service';

const baseVideo = (overrides: Record<string, any> = {}) => ({
  id: 'video-1',
  name: 'lesson.mp4',
  originalName: 'lesson.mp4',
  type: 'video',
  mimeType: 'video/mp4',
  size: 1000,
  url: '',
  thumbnail: null,
  folderId: null,
  createdBy: 'admin-1',
  tags: [],
  isPublic: false,
  bookId: 'book-1',
  storageProvider: 'R2',
  storageKey: 'videos/book-1/video-1/original/video.mp4',
  thumbnailKey: null,
  uploadStatus: 'COMPLETED',
  processingStatus: 'READY',
  visibility: 'PREMIUM',
  durationSeconds: null,
  uploadedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe('VideoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestVideoUploadUrl', () => {
    it('generates an upload URL and creates a record (direct-to-R2)', async () => {
      mockPrisma.mediaFile.create.mockResolvedValue({ id: 'video-1' });
      (r2.createUploadUrl as jest.Mock).mockResolvedValue('https://r2.example/upload');

      const result = await videoService.requestVideoUploadUrl(
        { fileName: 'lesson.mp4', contentType: 'video/mp4', fileSize: 1000, bookId: 'book-1' },
        'admin-1'
      );

      expect(result).toMatchObject({ mediaId: 'video-1', uploadUrl: 'https://r2.example/upload' });
      expect(mockPrisma.mediaFile.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'video', storageProvider: 'R2' }) })
      );
      expect(mockPrisma.mediaFile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ uploadStatus: 'UPLOADING' }) })
      );
    });

    it('rejects an invalid file type', async () => {
      await expect(
        videoService.requestVideoUploadUrl({ fileName: 'x.txt', contentType: 'text/plain', fileSize: 10 }, 'admin-1')
      ).rejects.toThrow('Unsupported video type');
      expect(mockPrisma.mediaFile.create).not.toHaveBeenCalled();
    });

    it('rejects a file that is too large', async () => {
      await expect(
        videoService.requestVideoUploadUrl(
          { fileName: 'big.mp4', contentType: 'video/mp4', fileSize: 3 * 1024 * 1024 * 1024 },
          'admin-1'
        )
      ).rejects.toThrow('maximum allowed size');
    });
  });

  describe('completeVideoUpload', () => {
    it('marks COMPLETED when the object exists in R2', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(baseVideo({ uploadStatus: 'UPLOADING' }));
      (r2.objectExists as jest.Mock).mockResolvedValue(true);
      mockPrisma.mediaFile.update.mockResolvedValue(baseVideo({ uploadStatus: 'COMPLETED' }));

      const result = await videoService.completeVideoUpload('video-1');

      expect(result.uploadStatus).toBe('COMPLETED');
      expect(mockPrisma.mediaFile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ uploadStatus: 'COMPLETED' }) })
      );
    });

    it('marks FAILED when the object is missing', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(baseVideo({ uploadStatus: 'UPLOADING' }));
      (r2.objectExists as jest.Mock).mockResolvedValue(false);

      await expect(videoService.completeVideoUpload('video-1')).rejects.toThrow('not found in R2');
      expect(mockPrisma.mediaFile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ uploadStatus: 'FAILED' }) })
      );
    });

    it('propagates an R2 failure', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(baseVideo({ uploadStatus: 'UPLOADING' }));
      (r2.objectExists as jest.Mock).mockRejectedValue(new Error('R2 unavailable'));

      await expect(videoService.completeVideoUpload('video-1')).rejects.toThrow('R2 unavailable');
    });
  });

  describe('getVideoPlaybackUrl', () => {
    it('returns a signed URL for PUBLIC content', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(baseVideo({ visibility: 'PUBLIC' }));
      (r2.createDownloadUrl as jest.Mock).mockResolvedValue('https://r2.example/signed');

      const result = await videoService.getVideoPlaybackUrl('video-1', 'user-1', []);

      expect(result.url).toBe('https://r2.example/signed');
      expect(checkSubscriptionActive).not.toHaveBeenCalled();
    });

    it('denies PREMIUM without an active subscription', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(baseVideo({ visibility: 'PREMIUM' }));
      (checkSubscriptionActive as jest.Mock).mockResolvedValue(false);

      await expect(videoService.getVideoPlaybackUrl('video-1', 'user-1', [])).rejects.toThrow(
        'Premium subscription required'
      );
    });

    it('allows PREMIUM with an active subscription', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(baseVideo({ visibility: 'PREMIUM' }));
      (checkSubscriptionActive as jest.Mock).mockResolvedValue(true);
      (r2.createDownloadUrl as jest.Mock).mockResolvedValue('https://r2.example/signed');

      const result = await videoService.getVideoPlaybackUrl('video-1', 'user-1', []);

      expect(result.url).toBe('https://r2.example/signed');
    });

    it('allows PREMIUM for super_admin without a subscription', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(baseVideo({ visibility: 'PREMIUM' }));
      (r2.createDownloadUrl as jest.Mock).mockResolvedValue('https://r2.example/signed');

      const result = await videoService.getVideoPlaybackUrl('video-1', 'admin-1', ['super_admin']);

      expect(result.url).toBe('https://r2.example/signed');
      expect(checkSubscriptionActive).not.toHaveBeenCalled();
    });

    it('rejects when the video is not ready', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(baseVideo({ uploadStatus: 'PENDING' }));

      await expect(videoService.getVideoPlaybackUrl('video-1', 'user-1', [])).rejects.toThrow(
        'not ready for playback'
      );
    });
  });

  describe('deleteVideo', () => {
    it('deletes R2 objects and soft-deletes the record', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(baseVideo({ thumbnailKey: 'thumbnails/b/v/thumbnail.jpg' }));
      (r2.deleteObject as jest.Mock).mockResolvedValue(undefined);

      await videoService.deleteVideo('video-1');

      expect(r2.deleteObject).toHaveBeenCalledTimes(2); // video + thumbnail
      expect(mockPrisma.mediaFile.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ uploadStatus: 'DELETED', deletedAt: expect.any(Date) }) })
      );
    });
  });
});
