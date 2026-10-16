import app from './app';
import prisma from './config/database';
import { env } from './config/environment';
import logger from './utils/logger';

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

const PORT = env.PORT;

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  logger.info(`API prefix: ${env.API_PREFIX}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

server.timeout = 120000;

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    logger.error('HTTP server closed');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }
    process.exit(0);
  });
  // Force exit if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
