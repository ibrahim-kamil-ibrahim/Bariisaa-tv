import winston from 'winston';
import { env } from '../config/environment';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.printf(
          ({ timestamp, level, message, stack }) =>
            `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`
        )
  ),
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

export default logger;
