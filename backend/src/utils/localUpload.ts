import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/environment';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) { void e; }
}

export async function uploadFileLocal(
  buffer: Buffer,
  originalName: string,
  _contentType: string,
  folder: string
): Promise<string> {
  await ensureDir(path.join(UPLOADS_DIR, folder));
  const ext = path.extname(originalName);
  const filename = `${uuidv4()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, folder, filename);
  await fs.writeFile(filePath, buffer);
  const relativePath = `uploads/${folder}/${filename}`;
  return `${env.APP_URL}/${relativePath}`;
}

export async function deleteFileLocal(fileKey: string): Promise<void> {
  const filePath = path.join(UPLOADS_DIR, fileKey.replace('uploads/', ''));
  try {
    await fs.unlink(filePath);
  } catch (e) { void e; }
}
