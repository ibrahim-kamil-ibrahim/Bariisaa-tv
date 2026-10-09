import prisma from '../../config/database';
import { env } from '../../config/environment';
import { AppError } from '../../middleware/errorHandler';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function buildPgDumpCommand(): { command: string; options: { env: NodeJS.ProcessEnv } } {
  const url = new URL(env.DATABASE_URL);
  const user = decodeURIComponent(url.username || 'postgres');
  const password = decodeURIComponent(url.password || '');
  const host = url.hostname || 'localhost';
  const port = url.port || '5432';
  const database = url.pathname.replace(/^\//, '') || 'postgres';
  const command = `pg_dump -h ${host} -p ${port} -U ${user} -d ${database}`;
  return { command, options: { env: { ...process.env, PGPASSWORD: password } } };
}

export async function create(data: any, createdBy: string) {
  const backup = await prisma.backup.create({
    data: { type: data.type || 'manual', createdBy, includes: data.includes || { tables: 'all', includeMedia: false }, status: 'IN_PROGRESS' },
  });

  // Start backup in background
  setImmediate(async () => {
    try {
      const { command, options } = buildPgDumpCommand();
      const result = await execAsync(command, { ...options, maxBuffer: 1024 * 1024 * 512 });
      await prisma.backup.update({
        where: { id: backup.id },
        data: { status: 'COMPLETED', fileSize: Buffer.byteLength(result.stdout), completedAt: new Date() },
      });
    } catch (error: any) {
      await prisma.backup.update({
        where: { id: backup.id },
        data: { status: 'FAILED', error: error.message },
      });
    }
  });

  return backup;
}

export async function list(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [backups, total] = await Promise.all([
    prisma.backup.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.backup.count(),
  ]);
  return { backups, total };
}

export async function restore(id: string) {
  const backup = await prisma.backup.findUnique({ where: { id } });
  if (!backup) throw new AppError('Backup not found', 404);
  if (backup.status !== 'COMPLETED') throw new AppError('Backup not completed', 400);
  // Restore logic would go here
  return prisma.backup.update({ where: { id }, data: { status: 'IN_PROGRESS' } });
}

export async function deleteBackup(id: string) {
  return prisma.backup.delete({ where: { id } });
}
