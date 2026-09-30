import TelegramBot from 'node-telegram-bot-api';
import prisma from '../config/database';
import { env } from '../config/environment';
import { getCachedOtp, invalidateCachedOtp } from '../utils/otp';

let botInstance: TelegramBot | null = null;
let botDisabled = false;

const PLACEHOLDER_TOKENS = [
  'your-telegram-bot-token',
  'YOUR_TELEGRAM_BOT_TOKEN',
  'YOUR_BOT_TOKEN_HERE',
  'REPLACE_ME',
  '',
];

function isValidToken(token: string | undefined): token is string {
  return !!token && !PLACEHOLDER_TOKENS.includes(token) && /^\d+:[A-Za-z0-9_-]+$/.test(token);
}

function getBot(): TelegramBot | null {
  if (botDisabled) return null;
  if (botInstance) {
    return botInstance;
  }

  const token = env.TELEGRAM_BOT_TOKEN;

  if (!isValidToken(token)) {
    console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN is missing or invalid. Bot is disabled.');
    console.warn('[Telegram Bot] Set TELEGRAM_BOT_TOKEN in .env to enable the bot.');
    botDisabled = true;
    return null;
  }

  botInstance = new TelegramBot(token, { polling: true });
  return botInstance;
}

export function initTelegramBot(): TelegramBot | null {
  const bot = getBot();

  if (!bot) {
    console.warn('[Telegram Bot] Skipping initialization — bot is disabled.');
    return null;
  }

  bot.onText(/\/start (.+)/, async (msg, match) => {
    if (!match) return;
    const requestId = match[1].trim();
    const chatId = String(msg.chat.id);

    try {
      const otp = await prisma.otpCode.findFirst({
        where: {
          purpose: requestId,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      });

      if (!otp) {
        await bot.sendMessage(chatId, '❌ This request ID is invalid or has expired.');
        return;
      }

      if (otp.attempts >= 5) {
        await bot.sendMessage(chatId, '❌ This OTP has exceeded the maximum number of attempts.');
        return;
      }

      const plaintextCode = getCachedOtp(requestId);
      if (!plaintextCode) {
        await bot.sendMessage(chatId, '❌ This OTP code is no longer available. Please request a new one.');
        return;
      }

      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { code: otp.code },
      });

      await bot.sendMessage(
        chatId,
        `🔐 Your verification code is: \`${plaintextCode}\`\n\n⚠️ This code expires in 5 minutes and can be used up to 5 times.`
      );

      invalidateCachedOtp(requestId);
    } catch (error) {
      console.error('[Telegram Bot] Error handling /start:', error);
    }
  });

  bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/start')) {
      bot.sendMessage(msg.chat.id, 'Welcome! Use /start {requestId} to retrieve your OTP.');
    }
  });

  bot.on('polling_error', (err) => {
    const telegramError = (err as any)?.message || '';
    const code = (err as any)?.code;
    if (code === 'ETELEGRAM' || telegramError.includes('409')) {
      const desc = (err as any)?.response?.body?.description || '';
      if (desc.includes('terminated by other getUpdates request')) {
        console.warn('[Telegram Bot] 409 Conflict — another bot instance is polling. Disabling this bot.');
        botDisabled = true;
        botInstance = null;
        return;
      }
    }
    if (code === 'EFATAL' || telegramError.includes('EFATAL') || telegramError.includes('ENOTFOUND') || telegramError.includes('getaddrinfo')) {
      console.warn('[Telegram Bot] Fatal network error — cannot reach Telegram API. Disabling bot.');
      botDisabled = true;
      botInstance = null;
      return;
    }
    console.error('[Telegram Bot] Polling error:', err);
  });

  console.log('[Telegram Bot] Bot initialized and polling started.');
  return bot;
}

export function getTelegramBot(): TelegramBot | null {
  return botInstance;
}
