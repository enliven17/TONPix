import axios from 'axios';
import { Payment, TONTransaction, TONBalance } from '@/types';
import { tonConfig } from '@/config';
import { Logger } from '@/utils/Logger';

export class TONService {
  private logger: Logger;
  private apiKey: string;
  private rpcUrl: string;
  private network: string;

  constructor() {
    this.logger = new Logger('TONService');
    this.apiKey = tonConfig.apiKey;
    this.rpcUrl = tonConfig.rpcUrl;
    this.network = tonConfig.network;
  }

  public async getBalance(address: string): Promise<TONBalance> {
    try {
      this.logger.info(`Getting balance for address: ${address}`);

      const response = await axios.get(`${this.rpcUrl}/getAddressBalance`, {
        params: { address },
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.data.ok) {
        throw new Error(`TON API error: ${response.data.error}`);
      }

      const balance: TONBalance = {
        address,
        balance: response.data.result,
        lastTransactionId: undefined // Will be populated if needed
      };

      this.logger.info(`Balance retrieved for ${address}`, {
        balance: balance.balance
      });

      return balance;

    } catch (error) {
      this.logger.error('Error getting balance:', error);
      throw error;
    }
  }

  public async getTransactions(address: string, limit: number = 10): Promise<TONTransaction[]> {
    try {
      this.logger.info(`Getting transactions for address: ${address}`);

      const response = await axios.get(`${this.rpcUrl}/getTransactions`, {
        params: {
          address,
          limit
        },
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.data.ok) {
        throw new Error(`TON API error: ${response.data.error}`);
      }

      const transactions: TONTransaction[] = response.data.result.map((tx: any) => ({
        hash: tx.hash,
        lt: tx.lt,
        account: {
          address: tx.account.address
        },
        in: {
          amount: tx.in?.amount || '0',
          source: tx.in?.source
        },
        out: tx.out?.map((out: any) => ({
          amount: out.amount,
          destination: out.destination
        })) || [],
        time: tx.time
      }));

      this.logger.info(`Retrieved ${transactions.length} transactions for ${address}`);

      return transactions;

    } catch (error) {
      this.logger.error('Error getting transactions:', error);
      throw error;
    }
  }

  public async verifyPayment(payment: Payment): Promise<boolean> {
    try {
      this.logger.info(`Verifying payment: ${payment.id}`);

      // Get recent transactions for the wallet address
      const transactions = await this.getTransactions(tonConfig.walletAddress, 20);

      // Look for a transaction that matches the payment amount
      const matchingTransaction = transactions.find(tx => {
        const incomingAmount = parseFloat(tx.in.amount);
        const expectedAmount = payment.tokenAmount * Math.pow(10, 9); // Convert to nano TON

        // Check if amount matches (with some tolerance for fees)
        const tolerance = 0.01; // 1% tolerance
        const minAmount = expectedAmount * (1 - tolerance);
        const maxAmount = expectedAmount * (1 + tolerance);

        return incomingAmount >= minAmount && incomingAmount <= maxAmount;
      });

      if (matchingTransaction) {
        this.logger.info(`Payment verified for ${payment.id}`, {
          transactionHash: matchingTransaction.hash,
          amount: matchingTransaction.in.amount
        });

        // Update payment with transaction hash
        payment.transactionHash = matchingTransaction.hash;
        return true;
      }

      this.logger.warn(`No matching transaction found for payment ${payment.id}`);
      return false;

    } catch (error) {
      this.logger.error('Error verifying payment:', error);
      return false;
    }
  }

  public async createDeepLink(payment: Payment): Promise<string> {
    try {
      const amount = payment.tokenAmount * Math.pow(10, 9); // Convert to nano TON
      const text = `Payment for ${payment.amount} ${payment.currency}`;
      
      // Create TON deep link
      const deepLink = `ton://transfer/${tonConfig.walletAddress}?amount=${amount}&text=${encodeURIComponent(text)}`;
      
      this.logger.info(`Created deep link for payment ${payment.id}`, {
        deepLink,
        amount: payment.tokenAmount
      });

      return deepLink;

    } catch (error) {
      this.logger.error('Error creating deep link:', error);
      throw error;
    }
  }

  public async getTransactionInfo(hash: string): Promise<TONTransaction | null> {
    try {
      this.logger.info(`Getting transaction info for hash: ${hash}`);

      const response = await axios.get(`${this.rpcUrl}/getTransaction`, {
        params: { hash },
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.data.ok) {
        this.logger.warn(`Transaction not found: ${hash}`);
        return null;
      }

      const tx = response.data.result;
      const transaction: TONTransaction = {
        hash: tx.hash,
        lt: tx.lt,
        account: {
          address: tx.account.address
        },
        in: {
          amount: tx.in?.amount || '0',
          source: tx.in?.source
        },
        out: tx.out?.map((out: any) => ({
          amount: out.amount,
          destination: out.destination
        })) || [],
        time: tx.time
      };

      this.logger.info(`Transaction info retrieved for ${hash}`);
      return transaction;

    } catch (error) {
      this.logger.error('Error getting transaction info:', error);
      return null;
    }
  }

  public async isAddressValid(address: string): Promise<boolean> {
    try {
      // Basic TON address validation
      const tonAddressRegex = /^EQ[a-zA-Z0-9]{48}$/;
      return tonAddressRegex.test(address);
    } catch (error) {
      this.logger.error('Error validating address:', error);
      return false;
    }
  }

  public async getNetworkInfo(): Promise<{
    network: string;
    blockHeight: number;
    lastBlockTime: number;
  }> {
    try {
      const response = await axios.get(`${this.rpcUrl}/getMasterchainInfo`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      if (!response.data.ok) {
        throw new Error(`TON API error: ${response.data.error}`);
      }

      return {
        network: this.network,
        blockHeight: response.data.result.last_block.seqno,
        lastBlockTime: response.data.result.last_block.gen_utime
      };

    } catch (error) {
      this.logger.error('Error getting network info:', error);
      throw error;
    }
  }

  public async estimateFee(
    fromAddress: string,
    toAddress: string,
    amount: number
  ): Promise<number> {
    try {
      // For MVP, return a fixed fee estimate
      // In production, you would call the TON API to get actual fee estimates
      
      const baseFee = 0.01; // Base fee in TON
      const transferFee = 0.005; // Transfer fee in TON
      
      return baseFee + transferFee;

    } catch (error) {
      this.logger.error('Error estimating fee:', error);
      return 0.015; // Default fallback fee
    }
  }

  public async getJettonBalance(
    walletAddress: string,
    jettonAddress: string
  ): Promise<number> {
    try {
      // For MVP, return a mock balance
      // In production, you would call the TON API to get actual jetton balances
      
      this.logger.info(`Getting jetton balance for ${walletAddress}`, {
        jettonAddress
      });

      // Mock implementation
      return 0;

    } catch (error) {
      this.logger.error('Error getting jetton balance:', error);
      return 0;
    }
  }

  public async sendTestTransaction(
    toAddress: string,
    amount: number,
    message?: string
  ): Promise<string> {
    try {
      this.logger.info(`Sending test transaction to ${toAddress}`, {
        amount,
        message
      });

      // For MVP, this is a mock implementation
      // In production, you would implement actual transaction sending
      
      const mockHash = `mock_hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.logger.info(`Test transaction sent`, {
        hash: mockHash,
        toAddress,
        amount
      });

      return mockHash;

    } catch (error) {
      this.logger.error('Error sending test transaction:', error);
      throw error;
    }
  }
} 