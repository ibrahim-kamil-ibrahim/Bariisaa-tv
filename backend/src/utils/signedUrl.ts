import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET, S3_SIGNED_URL_EXPIRY } from '../config/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { uploadFileLocal } from './localUpload';

export async function generateSignedGetUrl(fileKey: string): Promise<string> {
  if (!S3_BUCKET || !s3Client.config.endpoint) {
    throw new Error('S3/R2 storage not configured — cannot generate signed URL');
  }
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: fileKey,
  });
  return getSignedUrl(s3Client, command, { expiresIn: S3_SIGNED_URL_EXPIRY });
}

export async function generateSignedPutUrl(fileKey: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: fileKey,
    ContentType: contentType,
    ServerSideEncryption: 'AES256',
  });
  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string
): Promise<string> {
  if (!S3_BUCKET || !s3Client.config.endpoint) {
    console.warn('S3_BUCKET or S3_ENDPOINT not configured, falling back to local upload');
    return uploadFileLocal(buffer, originalName, contentType, folder);
  }

  const ext = path.extname(originalName);
  const key = `${folder}/${uuidv4()}${ext}`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      })
    );
    return key;
  } catch (err) {
    console.error('S3 upload failed, falling back to local:', err);
    return uploadFileLocal(buffer, originalName, contentType, folder);
  }
}

export async function deleteFile(fileKey: string): Promise<void> {
  if (!S3_BUCKET || !s3Client.config.endpoint) {
    console.warn('S3_BUCKET or S3_ENDPOINT not configured, skipping delete');
    return;
  }
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileKey,
      })
    );
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
}
