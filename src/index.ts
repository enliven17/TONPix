import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { TelegramBotService } from '@/bot/TelegramBot';
import { validateConfig } from '@/config';
import { Logger } from '@/utils/Logger';
import { appConfig } from '@/config';

class TONPixApp {
  private app: express.Application;
  private bot: TelegramBotService;
  private logger: Logger;

  constructor() {
    this.app = express();
    this.bot = new TelegramBotService();
    this.logger = new Logger('TONPixApp');

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS middleware
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://tonpix.com', 'https://www.tonpix.com']
        : true,
      credentials: true
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'TONPix'
      });
    });

    // API status endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV
      });
    });

    // Bot webhook endpoint (if using webhooks)
    this.app.post('/webhook/telegram', (req, res) => {
      // Handle Telegram webhook
      this.bot.getBot().handleUpdate(req.body);
      res.sendStatus(200);
    });

    // Payment API endpoints
    this.app.post('/api/payments/create', async (req, res) => {
      try {
        // This would be implemented with proper validation and authentication
        res.json({
          success: true,
          message: 'Payment creation endpoint - to be implemented'
        });
      } catch (error) {
        this.logger.error('Error in payment creation endpoint:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });

    // Error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Unhandled error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();

      // Start the Telegram bot
      await this.bot.start();

      // Start the Express server
      const server = this.app.listen(appConfig.port, () => {
        this.logger.info(`TONPix server started on port ${appConfig.port}`, {
          environment: appConfig.nodeEnv,
          port: appConfig.port
        });
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.gracefulShutdown(server));
      process.on('SIGINT', () => this.gracefulShutdown(server));

      this.logger.info('TONPix application started successfully');

    } catch (error) {
      this.logger.error('Failed to start TONPix application:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(server: any): Promise<void> {
    this.logger.info('Received shutdown signal, starting graceful shutdown...');

    try {
      // Stop the bot
      await this.bot.stop();

      // Close the server
      server.close(() => {
        this.logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        this.logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);

    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the application
if (require.main === module) {
  const app = new TONPixApp();
  app.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default TONPixApp; 