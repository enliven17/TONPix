// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables for testing
process.env.TELEGRAM_BOT_TOKEN = 'test_bot_token';
process.env.TON_API_KEY = 'test_ton_api_key';
process.env.TON_WALLET_ADDRESS = 'EQDtest123456789012345678901234567890123456789012345678901234567890';
process.env.TON_NETWORK = 'testnet';

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 