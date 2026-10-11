import * as winston from 'winston';
import 'winston-daily-rotate-file';

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

const createDailyRotate = (filename: string, level?: string) =>
  new winston.transports.DailyRotateFile({
    filename,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    ...(level && { level }),
    format: jsonFormat,
  });

export const winstonConfig = {
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ms }) =>
            `${timestamp} [${level}]: ${message} ${ms}`,
        ),
      ),
    }),
    createDailyRotate('logs/error-%DATE%.log', 'error'),
    createDailyRotate('logs/combined-%DATE%.log'),
  ],
};
