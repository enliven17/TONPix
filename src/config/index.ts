import dotenv from 'dotenv';
import { BotConfig, TONConfig, AppConfig, SecurityConfig } from '@/types';

// Load environment variables
dotenv.config();

// TON Blockchain Configuration
export const tonConfig: TONConfig = {
  network: (process.env.TON_NETWORK as 'mainnet' | 'testnet') || 'testnet',
  apiKey: process.env.TON_API_KEY || '',
  rpcUrl: process.env.TON_RPC_URL || 'https://testnet.toncenter.com/api/v2/jsonRPC',
  walletAddress: process.env.TON_WALLET_ADDRESS || '',
};

// Bot Configuration
export const botConfig: BotConfig = {
  token: process.env.TELEGRAM_BOT_TOKEN || '',
  username: process.env.TELEGRAM_BOT_USERNAME || 'TONPixBot',
  webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || undefined,
  polling: process.env.NODE_ENV === 'development' || !process.env.TELEGRAM_WEBHOOK_URL,
  network: tonConfig.network,
  walletAddress: tonConfig.walletAddress,
};

// Application Configuration
export const appConfig: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  paymentTimeout: parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '15', 10) * 60 * 1000, // Convert to milliseconds
  minPaymentAmount: parseFloat(process.env.MIN_PAYMENT_AMOUNT || '0.1'),
  maxPaymentAmount: parseFloat(process.env.MAX_PAYMENT_AMOUNT || '1000'),
};

// Security Configuration
export const securityConfig: SecurityConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key-change-in-production',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes in milliseconds
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

// Exchange Rate Configuration
export const exchangeConfig = {
  apiKey: process.env.EXCHANGE_API_KEY || '',
  apiUrl: process.env.EXCHANGE_API_URL || 'https://api.exchangerate-api.com/v4/latest',
  cacheTTL: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// QR Code Configuration
export const qrConfig = {
  size: parseInt(process.env.QR_CODE_SIZE || '256', 10),
  margin: parseInt(process.env.QR_CODE_MARGIN || '2', 10),
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

// Database Configuration (for future use)
export const databaseConfig = {
  url: process.env.DATABASE_URL || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'tonpix',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true',
};

// Validation function to check required environment variables
export function validateConfig(): void {
  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'TON_API_KEY',
    'TON_WALLET_ADDRESS',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Helper function to get configuration based on environment
export function getConfig() {
  return {
    bot: botConfig,
    ton: tonConfig,
    app: appConfig,
    security: securityConfig,
    exchange: exchangeConfig,
    qr: qrConfig,
    database: databaseConfig,
  };
}

// Export default configuration
export default getConfig(); 