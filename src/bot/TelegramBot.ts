import TelegramBot from 'node-telegram-bot-api';
import { botConfig } from '@/config';
import { PaymentService } from '@/payment/PaymentService';
import { QRService } from '@/qr/QRService';
import { TONService } from '@/blockchain/TONService';
import QRCode from 'qrcode';
import { ExchangeRateService } from '@/utils/ExchangeRateService';

interface PendingPayment {
  chatId: number;
  address: string;
  amount: number;
  expiresAt: number;
  notified: boolean;
  notifiedTxHashes?: string[]; // Bildirilen transaction hash'leri
  createdAt: number; // Ödeme oluşturulma zamanı
}

export class TelegramBotService {
  private bot: TelegramBot;
  private paymentService: PaymentService;
  private qrService: QRService;
  private tonService: TONService;
  private userAddresses: Map<number, string> = new Map(); // chatId -> TON address
  private pendingPayments: PendingPayment[] = [];
  private paymentCheckInterval: NodeJS.Timeout | null = null;
  private exchangeRateService: ExchangeRateService;

  constructor() {
    this.bot = new TelegramBot(botConfig.token, {
      polling: botConfig.polling,
      webHook: botConfig.webhookUrl ? { port: 8443 } : undefined,
    });
    this.paymentService = new PaymentService();
    this.qrService = new QRService();
    this.tonService = new TONService();
    this.exchangeRateService = new ExchangeRateService();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle /start command
    this.bot.onText(/\/start/, this.handleStart.bind(this));

    // Handle /help command
    this.bot.onText(/\/help/, this.handleHelp.bind(this));

    // Handle /create_payment command
    this.bot.onText(/\/create_payment (.+)/, this.handleCreatePayment.bind(this));

    // Handle /set_address command
    this.bot.onText(/\/set_address (.+)/, this.handleSetAddress.bind(this));

    // Handle /balance command
    this.bot.onText(/\/balance/, this.handleBalance.bind(this));

    // Handle /history command
    this.bot.onText(/\/history/, this.handleHistory.bind(this));

    // Handle callback queries (button clicks)
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

    // Handle errors
    this.bot.on('error', this.handleError.bind(this));

    // Handle polling errors
    this.bot.on('polling_error', this.handlePollingError.bind(this));

    console.log('Telegram bot event handlers setup completed');
  }

  private async handleStart(msg: any): Promise<void> {
    try {
      const chatId = msg.chat.id;
      const user = msg.from;

      const welcomeMessage = `
Hello ${user.first_name}! 👋

🤖 Welcome to pixTON!

You can create payment requests in TON or fiat currencies (USD, EUR, BRL).

Examples:
• /create_payment 5 TON
• /create_payment 10 USD
• /create_payment 100 BRL

The bot will automatically calculate the TON equivalent using the latest exchange rate.

To get Testnet TON: @testgiver_ton_bot

Available Commands:
• /set_address <address> - Set your TON address
• /create_payment <amount> <currency> - Create new payment (in TON or fiat)
• /balance - View wallet balance
• /history - View transaction history
• /help - Help menu

Quick Start:
1. Set your TON address: /set_address <your_address>
2. Click "💰 Receive Payment" button
3. Enter amount (e.g., 10 USD or 5 TON)
4. Share QR code with customers

Use the buttons below to get started:`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '💰 Receive Payment (TON/USD/EUR/BRL)', callback_data: 'create_payment' },
            { text: '💳 Balance', callback_data: 'balance' }
          ],
          [
            { text: '📊 History', callback_data: 'history' },
            { text: '❓ Help', callback_data: 'help' }
          ],
          [
            { text: '⚙️ Settings', callback_data: 'settings' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard
      });

      console.log('Start message sent successfully');

    } catch (error) {
      console.error('Error in handleStart:', error);
      await this.sendErrorMessage(msg?.chat?.id);
    }
  }

  private async handleHelp(msg: any): Promise<void> {
    try {
      const chatId = msg.chat.id;

      const helpMessage = `
📚 **pixTON Help Menu**

**Basic Commands:**
• \`/start\` - Open main menu
• \`/create_payment <amount>\` - Create new payment
• \`/balance\` - View wallet balance
• \`/history\` - View payment history

**Usage Examples:**
• \`/create_payment 10 BRL\` - Create payment worth 10 BRL
• \`/create_payment 5 USD\` - Create payment worth 5 USD
• \`/create_payment 100 EUR\` - Create payment worth 100 EUR

**Supported Currencies:**
• BRL (Brazilian Real)
• USD (US Dollar)
• EUR (Euro)
• TON (TON Coin)

**Supported Tokens:**
• TON (TON Coin)
• jUSDT (Jetton USDT)

**Need Help?**
• Technical support: @cankat17
      `;

      await this.bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Error in handleHelp:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleCreatePayment(msg: any): Promise<void> {
    try {
      const chatId = msg.chat.id;
      const text = msg.text || '';

      // Extract amount and optional currency
      const match = text.match(/\/create_payment\s+(\d+(?:\.\d+)?)(?:\s*([A-Z]{3}))?/i);
      
      if (!match) {
        await this.showPaymentAmountPrompt(chatId);
        return;
      }

      const amount = parseFloat(match[1]);
      let currency = 'TON';
      if (match[2]) {
        currency = match[2].toUpperCase();
      }

      await this.createPayment(chatId, amount, currency);

    } catch (error) {
      console.error('Error in handleCreatePayment:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleBalance(msg: any): Promise<void> {
    try {
      const chatId = msg.chat.id;
      
      // Check if user has set their address
      const userAddress = this.userAddresses.get(chatId);
      if (!userAddress) {
        await this.bot.sendMessage(chatId, `❌ Please set your TON address first!\n\nUse:\n/set_address <your_ton_address>\n\nExample:\n/set_address EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t`);
        return;
      }

      // Send loading message
      await this.bot.sendMessage(chatId, `⏳ Fetching wallet balance...`);

      try {
        // Get balance from explorer API
        const balance = await this.tonService.getBalance(userAddress);
        const balanceInTON = parseFloat(balance.balance) / 1e9;
        
        const balanceMessage = `
💳 **Wallet Balance**

**Network:** testnet
**Address:** \`${userAddress}\`
**Balance:** **${balanceInTON.toFixed(6)} TON**

*Last updated: ${new Date().toLocaleString()}*
        `;

        await this.bot.sendMessage(chatId, balanceMessage, {
          parse_mode: 'Markdown'
        });

      } catch (apiError) {
        console.error('Error fetching balance:', apiError);
        await this.bot.sendMessage(chatId, `❌ **Error fetching balance**\n\nAddress: \`${userAddress}\`\n\nCould not fetch wallet balance. Please try again later.\n\nIf the problem persists, contact: @cankat17`);
      }

    } catch (error) {
      console.error('Error in handleBalance:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleHistory(msg: any): Promise<void> {
    try {
      const chatId = msg.chat.id;
      
      // Check if user has set their address
      const userAddress = this.userAddresses.get(chatId);
      if (!userAddress) {
        await this.bot.sendMessage(chatId, `❌ Please set your TON address first!\n\nUse:\n/set_address <your_ton_address>\n\nExample:\n/set_address EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t`);
        return;
      }

      // Send loading message
      await this.bot.sendMessage(chatId, `⏳ Fetching transaction history...`);

      try {
        // Get recent transactions from explorer API
        const transactions = await this.qrService.getTransactions(userAddress, 10);
        
        if (!transactions || transactions.length === 0) {
          await this.bot.sendMessage(chatId, `📊 **Transaction History**\n\nAddress: \`${userAddress}\`\n\nNo transactions found.`);
          return;
        }

        let historyMessage = `📊 **Transaction History**\n\nAddress: \`${userAddress}\`\n\n**Recent Transactions:**\n\n`;
        
        transactions.forEach((tx, index) => {
          try {
            const amount = parseFloat(tx.in?.amount || '0') / 1e9;
            const time = new Date((tx.time || Date.now() / 1000) * 1000).toLocaleString();
            
            // Extract sender address properly
            let senderAddress = 'unknown';
            if (tx.in?.source) {
              if (typeof tx.in.source === 'string') {
                senderAddress = tx.in.source;
              } else if (tx.in.source.address) {
                senderAddress = tx.in.source.address;
              }
            }
            
            const hash = tx.hash || 'unknown';
            
            historyMessage += `${index + 1}. 💰 **${amount} TON**\n`;
            historyMessage += `   👤 From: \`${senderAddress}\`\n`;
            historyMessage += `   ⏰ Time: ${time}\n`;
            historyMessage += `   🔗 Hash: \`${hash}\`\n\n`;
          } catch (txError) {
            console.error('Error processing transaction:', txError);
            historyMessage += `${index + 1}. ❌ **Error processing transaction**\n\n`;
          }
        });

        await this.bot.sendMessage(chatId, historyMessage, {
          parse_mode: 'Markdown'
        });

      } catch (apiError) {
        console.error('Error fetching transaction history:', apiError);
        await this.bot.sendMessage(chatId, `❌ **Error fetching transaction history**\n\nAddress: \`${userAddress}\`\n\nCould not fetch transaction history. Please try again later.\n\nIf the problem persists, contact: @cankat17`);
      }

    } catch (error) {
      console.error('Error in handleHistory:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    try {
      const chatId = query.message?.chat.id;
      const data = query.data;

      if (!chatId) return;

      switch (data) {
        case 'create_payment':
          await this.showPaymentAmountPrompt(chatId);
          break;
        case 'balance':
          await this.handleBalance({ chat: { id: chatId } });
          break;
        case 'history':
          await this.handleHistory({ chat: { id: chatId } });
          break;
        case 'help':
          await this.handleHelp({ chat: { id: chatId } });
          break;
        case 'settings':
          await this.showSettings(chatId);
          break;
        default:
          if (data.startsWith('payment_')) {
            await this.handlePaymentCallback(chatId, data);
          }
          break;
      }

    } catch (error) {
      console.error('Error in handleCallbackQuery:', error);
      await this.sendErrorMessage(query.message?.chat.id);
    }
  }

  private async showPaymentAmountPrompt(chatId: number): Promise<void> {
    const message = `💰 **Create Payment**

You can receive payments in TON or fiat currencies (USD, EUR, BRL) which will be automatically converted to TON.

**TON Payments:**
Format: \`/create_payment <amount>\`

**Fiat Payments:**
Format: \`/create_payment <amount> <currency>\`

**Examples:**
• \`/create_payment 10\` (TON)
• \`/create_payment 5.5\` (TON)
• \`/create_payment 50 USD\`
• \`/create_payment 100 EUR\`
• \`/create_payment 200 BRL\`

Or use the quick options below:`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '1 TON', callback_data: 'payment_amount_1_TON' },
          { text: '5 TON', callback_data: 'payment_amount_5_TON' },
          { text: '10 TON', callback_data: 'payment_amount_10_TON' }
        ],
        [
          { text: '25 TON', callback_data: 'payment_amount_25_TON' },
          { text: '50 TON', callback_data: 'payment_amount_50_TON' },
          { text: '100 TON', callback_data: 'payment_amount_100_TON' }
        ],
        [
          { text: '50 USD', callback_data: 'payment_amount_50_USD' },
          { text: '100 EUR', callback_data: 'payment_amount_100_EUR' },
          { text: '200 BRL', callback_data: 'payment_amount_200_BRL' }
        ],
        [
          { text: '🔙 Back', callback_data: 'back_to_main' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handlePaymentCallback(chatId: number, data: string): Promise<void> {
    const parts = data.split('_');
    if (parts.length >= 4) {
      const amount = parseFloat(parts[2]);
      const currency = parts[3];
      await this.createPayment(chatId, amount, currency);
    }
  }

  private async createPayment(chatId: number, amount: number, currency: string): Promise<void> {
    try {
      console.log(`Creating payment: ${amount} ${currency} for chat ${chatId}`);

      // Check if user has set their address
      const userAddress = this.userAddresses.get(chatId);
      if (!userAddress) {
        await this.bot.sendMessage(chatId, `❌ Please set your TON address first!\n\nGo to Settings (⚙️) and use:\n/set_address <your_ton_address>\n\nExample:\n/set_address EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t\n\nThis address will be used to receive your payments.`);
        return;
      }

      let tonAmount = amount;
      let originalAmountMsg = '';
      if (currency !== 'TON') {
        // Convert to TON
        const rate = await this.exchangeRateService.getExchangeRate(currency, 'TON');
        tonAmount = parseFloat((amount * rate).toFixed(6));
        originalAmountMsg = `Original: ${amount} ${currency}\nTON Equivalent: ${tonAmount} TON`;
      }

      // Create payment for user's address
      const expiresAt = Date.now() + 15 * 60 * 1000;
      this.pendingPayments.push({
        chatId,
        address: userAddress,
        amount: tonAmount,
        expiresAt,
        notified: false,
        notifiedTxHashes: [],
        createdAt: Date.now()
      });

      // Create QR code data
      const tonLink = `ton://transfer/${userAddress}?amount=${tonAmount * 1000000000}&text=Payment for ${tonAmount} TON`;
      const qrCodeDataUrl = await QRCode.toDataURL(tonLink, { width: 256, margin: 2 });
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

      // Send payment information
      const paymentMessage = `
💳 Payment Created

${originalAmountMsg ? originalAmountMsg + '\n' : ''}Status: ⏳ Pending
Expires: ${new Date(expiresAt).toLocaleString('en-US')}

Your TON Address:
\`${userAddress}\`

TON Link:
[Open in TON Wallet](${tonLink})

Share this link or QR code with your customers to receive payment.

⚠️ *After the expiration time, this payment request will no longer be tracked by the bot. Please create a new payment if needed. The QR code and link may still work, but the bot will not notify you about late payments.*
      `;

      await this.bot.sendMessage(chatId, paymentMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      // QR kodunu gönder
      await this.bot.sendPhoto(chatId, qrCodeBuffer, {
        caption: 'Scan this QR code with TON Wallet to pay.'
      });

      // Send QR code instructions
      const qrInstructions = `
📱 How to Use QR Code:

1. 📱 Open TON Wallet app on your phone
2. 📷 Tap "Scan QR Code" button
3. 📷 Scan the QR code above with your camera
4. ✅ Check the amount and address
5. 💰 Confirm the payment
      `;

      await this.bot.sendMessage(chatId, qrInstructions, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Error creating payment:', error);
      await this.sendErrorMessage(chatId);
    }
  }

  private async showSettings(chatId: number): Promise<void> {
    const userAddress = this.userAddresses.get(chatId) || 'Not set';
    
    const settingsMessage = `⚙️ Settings

Your TON Address: ${userAddress}

To set your TON address, send:
/set_address <your_ton_address>

Example:
/set_address EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t

Network: testnet

*Your address will be used for receiving payments*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔙 Main Menu', callback_data: 'back_to_main' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, settingsMessage, {
      reply_markup: keyboard
    });
  }

  private async handleSetAddress(msg: any): Promise<void> {
    try {
      const chatId = msg.chat.id;
      const text = msg.text || '';

      // Extract address from command
      const match = text.match(/\/set_address\s+(.+)/);
      
      if (!match) {
        await this.bot.sendMessage(chatId, 'Please provide a valid TON address.\nExample: /set_address EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t');
        return;
      }

      const address = match[1].trim();

      // Flexible TON address validation
      if (address.length < 48 || address.length > 60 || /[^a-zA-Z0-9_-]/.test(address)) {
        await this.bot.sendMessage(chatId, 'Invalid TON address format. Please provide a valid address (48-60 chars, no spaces or special chars).');
        return;
      }

      // Save user's address
      this.userAddresses.set(chatId, address);

      await this.bot.sendMessage(chatId, `✅ Your TON address has been set to:\n\`${address}\`\n\nYou can now receive payments to this address.`, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Error in handleSetAddress:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleError(error: Error): Promise<void> {
    console.error('Telegram bot error:', error);
  }

  private async handlePollingError(error: Error): Promise<void> {
    console.error('Telegram bot polling error:', error);
  }

  private async sendErrorMessage(chatId?: number): Promise<void> {
    if (!chatId) return;

    const errorMessage = `
❌ **An error occurred**

Sorry, an error occurred. Please try again later.

If the problem persists, contact our support team:
• @cankat17
      `;

    try {
      await this.bot.sendMessage(chatId, errorMessage, {
        parse_mode: 'Markdown'
      });
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }

  public async start(): Promise<void> {
    try {
      if (botConfig.webhookUrl) {
        await this.bot.setWebHook(botConfig.webhookUrl);
        console.log(`Webhook set to: ${botConfig.webhookUrl}`);
      } else {
        console.log('Starting bot with polling...');
      }
      // Start payment check interval - check every 5 seconds instead of 10
      this.paymentCheckInterval = setInterval(() => this.checkPendingPayments(), 5000);
      console.log('pixTON Telegram bot started successfully');
    } catch (error) {
      console.error('Error starting bot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.bot.stopPolling();
      console.log('pixTON Telegram bot stopped');
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  }

  public getBot(): TelegramBot {
    return this.bot;
  }

  private async checkPendingPayments(): Promise<void> {
    const now = Date.now();
    console.log(`[DEBUG] Checking ${this.pendingPayments.length} pending payments...`);
    
    for (const payment of this.pendingPayments) {
      if (payment.expiresAt < now) {
        console.log(`[DEBUG] Payment expired for chat ${payment.chatId}`);
        continue;
      }
      
      try {
        if (!payment.notifiedTxHashes) payment.notifiedTxHashes = [];
        console.log(`[DEBUG] Checking payment for chat ${payment.chatId}, address: ${payment.address}`);
        
        // Check for incoming transactions using explorer API
        const transactions = await this.qrService.getTransactions(payment.address, 10);
        console.log(`[DEBUG] Found ${transactions.length} transactions for ${payment.address}`);
        
        // Log all transactions for debugging
        transactions.forEach((tx, index) => {
          const incomingAmount = parseFloat(tx.in?.amount || '0') / 1e9;
          console.log(`[DEBUG] TX ${index}: amount=${incomingAmount}, source=${tx.in?.source || 'unknown'}, timestamp=${tx.time}, hash=${tx.hash}`);
        });
        
        // Check for new transactions that haven't been notified yet
        for (const tx of transactions) {
          const incomingAmount = parseFloat(tx.in?.amount || '0') / 1e9;
          const txTime = tx.time * 1000; // Convert to milliseconds
          
          // Only notify for transactions that came after payment was created
          if (tx.in?.amount && !payment.notifiedTxHashes.includes(tx.hash) && txTime >= payment.createdAt) {
            // New IN transaction found - send notification
            console.log(`[DEBUG] New IN transaction found: ${tx.hash}, amount: ${incomingAmount} TON, txTime: ${new Date(txTime).toLocaleString()}, createdAt: ${new Date(payment.createdAt).toLocaleString()}`);
            
            // Extract sender address properly
            let senderAddress = 'unknown';
            if (tx.in?.source) {
              if (typeof tx.in.source === 'string') {
                senderAddress = tx.in.source;
              } else if (tx.in.source.address) {
                senderAddress = tx.in.source.address;
              }
            }
            
            await this.bot.sendMessage(payment.chatId, `🎉 **Payment Received!** 🎉

💰 **Amount:** ${incomingAmount} TON
👤 **From:** \`${senderAddress}\`
⏰ **Time:** ${new Date(txTime).toLocaleString()}
🔗 **Hash:** \`${tx.hash}\`

✅ Your payment has been successfully received!`, {
              parse_mode: 'Markdown'
            });
            payment.notifiedTxHashes.push(tx.hash);
          } else if (tx.in?.amount && !payment.notifiedTxHashes.includes(tx.hash)) {
            console.log(`[DEBUG] Skipping old transaction: ${tx.hash}, txTime: ${new Date(txTime).toLocaleString()}, createdAt: ${new Date(payment.createdAt).toLocaleString()}`);
          }
        }
        
      } catch (err) {
        console.error('Error checking payment:', err);
      }
    }
    
    // Remove expired payments
    const beforeCount = this.pendingPayments.length;
    this.pendingPayments = this.pendingPayments.filter(p => p.expiresAt > now);
    const afterCount = this.pendingPayments.length;
    console.log(`[DEBUG] Cleaned up payments: ${beforeCount} -> ${afterCount}`);
  }
} 