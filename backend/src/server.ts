import app from './app';
import { env } from './config/environment';
import { initTelegramBot } from './services/telegram-bot';

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

// Initialize Telegram bot if token is configured
if (env.TELEGRAM_BOT_TOKEN) {
  try {
    initTelegramBot();
    console.log('Telegram bot initialized');
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
  }
}

const PORT = env.PORT;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  console.log(`API prefix: ${env.API_PREFIX}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

server.timeout = 120000;
