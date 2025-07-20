import TelegramBot from 'node-telegram-bot-api';
import { botConfig } from '@/config';
import { PaymentService } from '@/payment/PaymentService';
import { QRService } from '@/qr/QRService';

export class TelegramBotService {
  private bot: TelegramBot;
  private paymentService: PaymentService;
  private qrService: QRService;
  private userAddresses: Map<number, string> = new Map(); // chatId -> TON address

  constructor() {
    this.bot = new TelegramBot(botConfig.token, {
      polling: botConfig.polling,
      webHook: botConfig.webhookUrl ? { port: 8443 } : undefined,
    });
    this.paymentService = new PaymentService();
    this.qrService = new QRService();
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

      const welcomeMessage = `🤖 Welcome to TONPix!

Hello ${user.first_name}! TONPix provides QR code-based payment system with TON blockchain.

Available Commands:
• /set_address <address> - Set your TON address
• /create_payment <amount> - Create new payment (in TON)
• /balance - View wallet balance
• /history - View payment history
• /help - Help menu

Quick Start:
1. Set your TON address: /set_address <your_address>
2. Click "💰 Receive Payment" button
3. Enter amount (e.g., 10 TON)
4. Share QR code with customers

Use the buttons below to get started:`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '💰 Receive Payment', callback_data: 'create_payment' },
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
📚 **TONPix Help Menu**

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
• Technical support: @TONPixSupport
• Email: support@tonpix.com
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

      // Extract amount from command (only TON)
      const match = text.match(/\/create_payment\s+(\d+(?:\.\d+)?)/);
      
      if (!match) {
        await this.showPaymentAmountPrompt(chatId);
        return;
      }

      const amount = parseFloat(match[1]);
      const currency = 'TON'; // Always TON

      await this.createPayment(chatId, amount, currency);

    } catch (error) {
      console.error('Error in handleCreatePayment:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleBalance(msg: any): Promise<void> {
    try {
      const chatId = msg.chat.id;
      
      const balanceMessage = `
💳 **Wallet Balance**

**TON Network:** testnet
**Address:** \`EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t\`

*Balance query feature coming soon...*
      `;

      await this.bot.sendMessage(chatId, balanceMessage, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Error in handleBalance:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleHistory(msg: any): Promise<void> {
    try {
      const chatId = msg.chat.id;
      
      const historyMessage = `
📊 **Payment History**

*Payment history feature coming soon...*

With this feature you will be able to:
• View all your payments
• Check transaction details
• Filter and search payments
      `;

      await this.bot.sendMessage(chatId, historyMessage, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      console.error('Error in handleHistory:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleCallbackQuery(query: any): Promise<void> {
    try {
      const chatId = query.message?.chat.id;
      const data = query.data;

      if (!chatId || !data) {
        console.error('Invalid callback query data');
        return;
      }

      // Answer the callback query to remove loading state
      await this.bot.answerCallbackQuery(query.id);

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
    const message = `💰 Create Payment

Please enter the payment amount in TON:

Format: /create_payment <amount>

Examples:
• /create_payment 10
• /create_payment 5.5
• /create_payment 100

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
          { text: '🔙 Back', callback_data: 'back_to_main' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, message, {
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
        await this.bot.sendMessage(chatId, `❌ Please set your TON address first!

Go to Settings (⚙️) and use:
/set_address <your_ton_address>

Example:
/set_address EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t

This address will be used to receive your payments.`);
        return;
      }

      // Create payment for user's address
      const paymentId = `payment_${Date.now()}`;
      const tokenAmount = amount; // Direct TON amount

      // Create QR code data
      const tonLink = `ton://transfer/${userAddress}?amount=${tokenAmount * 1000000000}&text=Payment for ${amount} TON`;
      
      // Send payment information
      const paymentMessage = `
💳 Payment Created

Amount: ${amount} TON
Status: ⏳ Pending
Expires: ${new Date(Date.now() + 15 * 60 * 1000).toLocaleString('en-US')}

Your TON Address:
\`${userAddress}\`

TON Link:
[Open in TON Wallet](${tonLink})

Share this link or QR code with your customers to receive payment.
      `;

      await this.bot.sendMessage(chatId, paymentMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      // Send QR code instructions
      const qrInstructions = `
📱 QR Code Usage:

1. Copy the TON link above
2. Share it with your customers
3. Customers can pay using TON Wallet
4. You'll receive the payment to your address

To get Testnet TON:
https://t.me/testgiver_ton_bot
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
• @TONPixSupport
• support@tonpix.com
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

      console.log('TONPix Telegram bot started successfully');
    } catch (error) {
      console.error('Error starting bot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.bot.stopPolling();
      console.log('TONPix Telegram bot stopped');
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  }

  public getBot(): TelegramBot {
    return this.bot;
  }
} 