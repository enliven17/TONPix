import TelegramBot from 'node-telegram-bot-api';
import { botConfig } from '@/config';

export class TelegramBotService {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(botConfig.token, {
      polling: botConfig.polling,
      webHook: botConfig.webhookUrl ? { port: 8443 } : undefined,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle /start command
    this.bot.onText(/\/start/, this.handleStart.bind(this));

    // Handle /help command
    this.bot.onText(/\/help/, this.handleHelp.bind(this));

    // Handle /create_payment command
    this.bot.onText(/\/create_payment (.+)/, this.handleCreatePayment.bind(this));

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
      console.log('handleStart çağrıldı. Gelen mesaj:', JSON.stringify(msg, null, 2));
      if (!msg) {
        console.error('Gelen msg nesnesi undefined veya null!');
        return;
      }
      if (!msg.chat) {
        console.error('msg.chat alanı yok! Gelen msg:', JSON.stringify(msg, null, 2));
        return;
      }
      if (!msg.from) {
        console.error('msg.from alanı yok! Gelen msg:', JSON.stringify(msg, null, 2));
        return;
      }
      const chatId = msg.chat.id;
      const user = msg.from;

      console.log(`Kullanıcı: ${user.id}, Ad: ${user.first_name}`);

      const welcomeMessage = `
🤖 **Welcome to TONPix!**

Hello ${user.first_name}! TONPix provides QR code-based payment system with TON blockchain.

**Available Commands:**
• /create_payment <amount> - Create new payment
• /balance - View wallet balance
• /history - View payment history
• /help - Help menu

**Quick Start:**
1. Click "Receive Payment" button
2. Enter amount (e.g., 10 BRL)
3. Scan QR code
4. Make payment with TON Wallet

Use the buttons below to get started:
      `;

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
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('handleStart fonksiyonunda hata oluştu:', error);
      console.error('Hatalı gelen mesaj:', JSON.stringify(msg, null, 2));
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

      // Extract amount and currency from command
      const match = text.match(/\/create_payment\s+(\d+(?:\.\d+)?)\s*([A-Z]{3})?/);
      
      if (!match) {
        await this.showPaymentAmountPrompt(chatId);
        return;
      }

      const amount = parseFloat(match[1]);
      const currency = match[2] || 'BRL';

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
    const message = `
💰 **Create Payment**

Please enter the payment amount and currency:

**Format:** \`/create_payment <amount> <currency>\`

**Examples:**
• \`/create_payment 10 BRL\`
• \`/create_payment 5 USD\`
• \`/create_payment 100 EUR\`

**Or use the quick options below:**
      `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '10 BRL', callback_data: 'payment_amount_10_BRL' },
          { text: '5 USD', callback_data: 'payment_amount_5_USD' },
          { text: '50 EUR', callback_data: 'payment_amount_50_EUR' }
        ],
        [
          { text: '25 BRL', callback_data: 'payment_amount_25_BRL' },
          { text: '10 USD', callback_data: 'payment_amount_10_USD' },
          { text: '100 EUR', callback_data: 'payment_amount_100_EUR' }
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

      // Create mock payment for demo
      const paymentId = `payment_${Date.now()}`;
      const tokenAmount = amount * 0.00015; // Mock exchange rate
      const tonAddress = 'EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t';

      // Create QR code data
      const tonLink = `ton://transfer/${tonAddress}?amount=${tokenAmount}&text=Payment for ${amount} ${currency}`;
      
      // For demo, we'll create a simple text representation
      const qrCodeText = `
QR Code Data:
${tonLink}
      `;

      // Send payment information
      const paymentMessage = `
💳 **Payment Created**

**Amount:** ${amount} ${currency}
**TON Equivalent:** ${tokenAmount} TON
**Status:** ⏳ Pending
**Expires:** ${new Date(Date.now() + 15 * 60 * 1000).toLocaleString('en-US')}

**TON Address:**
\`${tonAddress}\`

**QR Code Data:**
\`${tonLink}\`

You can make payment by scanning the QR code or copying the address.
      `;

      // Send message with payment info
      await this.bot.sendMessage(chatId, paymentMessage, {
        parse_mode: 'Markdown'
      });

      // Send QR code instructions
      const qrInstructions = `
📱 **QR Code Usage:**

1. Copy the TON link above
2. Open TON Wallet app
3. Click "Transfer" option
4. Paste the address and check the amount
5. Confirm the payment

**To get Testnet TON:**
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
    const settingsMessage = `
⚙️ **Settings**

**Bot Settings:**
• Notifications: ✅ Enabled
• Language: 🇺🇸 English
• Timezone: UTC+0

**Wallet Settings:**
• TON Address: EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t
• Network: testnet

*Settings menu coming soon...*
      `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔙 Main Menu', callback_data: 'back_to_main' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, settingsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
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