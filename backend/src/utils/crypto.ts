import crypto from 'crypto';
import { env } from '../config/environment';

const ALGORITHM = 'aes-256-cbc';

export function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(env.ENCRYPTION_IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(env.ENCRYPTION_KEY, 'utf8').subarray(0, 32), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

export function decrypt(encrypted: string, iv: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(env.ENCRYPTION_KEY, 'utf8').subarray(0, 32),
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function generateDeviceKey(deviceUid: string): Buffer {
  return crypto.createHash('sha256').update(deviceUid + env.ENCRYPTION_KEY).digest();
}

export function generateUserDeviceKey(userId: string, deviceUid: string): Buffer {
  return crypto.createHash('sha256').update(`${userId}:${deviceUid}:${env.ENCRYPTION_KEY}`).digest();
}

export function encryptBuffer(buffer: Buffer, key: Buffer): { encrypted: Buffer; iv: Buffer } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { encrypted, iv };
}

export function decryptBuffer(encrypted: Buffer, key: Buffer, iv: Buffer): Buffer {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
