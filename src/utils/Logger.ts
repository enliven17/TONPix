import winston from 'winston';
import { LogEntry } from '@/types';

export class Logger {
  private logger: winston.Logger;
  private context: string;

  constructor(context: string) {
    this.context = context;
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'tonpix', context },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });

    // If we're not in production, log to console as well
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  public info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, { ...meta, context: this.context });
  }

  public error(message: string, error?: Error | any, meta?: Record<string, any>): void {
    this.logger.error(message, { 
      error: error instanceof Error ? error.stack : error,
      ...meta, 
      context: this.context 
    });
  }

  public warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, { ...meta, context: this.context });
  }

  public debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, { ...meta, context: this.context });
  }

  public log(entry: LogEntry): void {
    const { level, message, context, error, ...meta } = entry;
    
    switch (level) {
      case 'error':
        this.error(message, error, meta);
        break;
      case 'warn':
        this.warn(message, meta);
        break;
      case 'info':
        this.info(message, meta);
        break;
      case 'debug':
        this.debug(message, meta);
        break;
      default:
        this.info(message, meta);
    }
  }
} 