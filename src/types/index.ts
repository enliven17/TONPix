// Telegram Bot Types
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
  };
  date: number;
  text?: string;
  reply_markup?: any;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

// Payment Types
export interface PaymentRequest {
  merchantId: number;
  amount: number;
  currency: string;
  tokenType: 'TON' | 'jUSDT';
  description?: string;
}

export interface Payment {
  id: string;
  merchantId: number;
  amount: number;
  currency: string;
  tokenAmount: number;
  tokenType: 'TON' | 'jUSDT';
  status: PaymentStatus;
  createdAt: Date;
  completedAt?: Date;
  transactionHash?: string;
  qrCode: string;
  tonAddress: string;
  description?: string | undefined;
  expiresAt: Date;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'expired';

// User Types
export interface User {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  tonAddress?: string;
  createdAt: Date;
  lastActivity: Date;
  totalPayments: number;
  totalAmount: number;
  isActive: boolean;
}

// TON Blockchain Types
export interface TONTransaction {
  hash: string;
  lt: string;
  account: {
    address: string;
  };
  in: {
    amount: string;
    source?: string;
  };
  out: Array<{
    amount: string;
    destination: string;
  }>;
  time: number;
}

export interface TONBalance {
  address: string;
  balance: string;
  lastTransactionId?: {
    lt: string;
    hash: string;
  } | undefined;
}

// Exchange Rate Types
export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export interface ExchangeRateResponse {
  base: string;
  rates: Record<string, number>;
  date: string;
}

// QR Code Types
export interface QRCodeOptions {
  width: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
}

export interface TONDeepLink {
  address: string;
  amount: string;
  text?: string;
  jetton?: string | undefined;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Configuration Types
export interface BotConfig {
  token: string;
  username: string;
  webhookUrl?: string | undefined;
  polling: boolean;
  network?: string;
  walletAddress?: string;
}

export interface TONConfig {
  network: 'mainnet' | 'testnet';
  apiKey: string;
  rpcUrl: string;
  walletAddress: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  paymentTimeout: number;
  minPaymentAmount: number;
  maxPaymentAmount: number;
}

// Notification Types
export interface NotificationMessage {
  chatId: number;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  replyMarkup?: any;
}

export interface PaymentNotification {
  payment: Payment;
  message: string;
  type: 'payment_received' | 'payment_expired' | 'payment_failed';
}

// Error Types
export interface AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Event Types
export interface PaymentEvent {
  type: 'payment_created' | 'payment_completed' | 'payment_expired';
  payment: Payment;
  timestamp: Date;
}

export interface BlockchainEvent {
  type: 'transaction_received' | 'transaction_confirmed';
  transaction: TONTransaction;
  timestamp: Date;
}

// Cache Types
export interface CacheItem<T> {
  data: T;
  expiresAt: Date;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number;
}

// Database Types (for future use)
export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

// Logging Types
export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

// Security Types
export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
  rateLimitWindow: number;
  rateLimitMax: number;
} 