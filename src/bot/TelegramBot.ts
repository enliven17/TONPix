import TelegramBot from 'node-telegram-bot-api';
import { BotConfig, TelegramMessage, TelegramCallbackQuery } from '@/types';
import { botConfig } from '@/config';
import { PaymentService } from '@/payment/PaymentService';
import { QRService } from '@/qr/QRService';
import { NotificationService } from '@/utils/NotificationService';
import { Logger } from '@/utils/Logger';

export class TelegramBotService {
  private bot: TelegramBot;
  private paymentService: PaymentService;
  private qrService: QRService;
  private notificationService: NotificationService;
  private logger: Logger;

  constructor() {
    this.bot = new TelegramBot(botConfig.token, {
      polling: botConfig.polling,
      webHook: botConfig.webhookUrl ? { port: 8443 } : undefined,
    });

    this.paymentService = new PaymentService();
    this.qrService = new QRService();
    this.notificationService = new NotificationService(this.bot);
    this.logger = new Logger('TelegramBot');

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

    this.logger.info('Telegram bot event handlers setup completed');
  }

  private async handleStart(msg: TelegramMessage): Promise<void> {
    try {
      const chatId = msg.chat.id;
      const user = msg.from;

      if (!user) {
        this.logger.error('No user information in start message');
        return;
      }

      this.logger.info(`User ${user.id} (${user.first_name}) started the bot`);

      const welcomeMessage = `
🤖 **TONPix'e Hoş Geldiniz!**

Merhaba ${user.first_name}! TONPix, TON blockchain ile QR kod tabanlı ödeme sistemi sağlar.

**Kullanılabilir Komutlar:**
• /create_payment <miktar> - Yeni ödeme oluştur
• /balance - Cüzdan bakiyenizi görüntüle
• /history - Ödeme geçmişinizi görüntüle
• /help - Yardım menüsü

**Hızlı Başlangıç:**
1. "Ödeme Al" butonuna basın
2. Miktarı girin (örn: 10 BRL)
3. QR kodu tarayın
4. TON Wallet ile ödeme yapın

Başlamak için aşağıdaki butonları kullanabilirsiniz:
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '💰 Ödeme Al', callback_data: 'create_payment' },
            { text: '💳 Bakiye', callback_data: 'balance' }
          ],
          [
            { text: '📊 Geçmiş', callback_data: 'history' },
            { text: '❓ Yardım', callback_data: 'help' }
          ],
          [
            { text: '⚙️ Ayarlar', callback_data: 'settings' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      this.logger.error('Error in handleStart:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleHelp(msg: TelegramMessage): Promise<void> {
    try {
      const chatId = msg.chat.id;

      const helpMessage = `
📚 **TONPix Yardım Menüsü**

**Temel Komutlar:**
• \`/start\` - Ana menüyü aç
• \`/create_payment <miktar>\` - Yeni ödeme oluştur
• \`/balance\` - Cüzdan bakiyenizi görüntüle
• \`/history\` - Ödeme geçmişinizi görüntüle

**Örnek Kullanım:**
• \`/create_payment 10 BRL\` - 10 BRL değerinde ödeme oluştur
• \`/create_payment 5 USD\` - 5 USD değerinde ödeme oluştur
• \`/create_payment 100 EUR\` - 100 EUR değerinde ödeme oluştur

**Desteklenen Para Birimleri:**
• BRL (Brezilya Reali)
• USD (Amerikan Doları)
• EUR (Euro)
• TON (TON Coin)

**Desteklenen Token'lar:**
• TON (TON Coin)
• jUSDT (Jetton USDT)

**Sorun mu yaşıyorsunuz?**
• Teknik destek: @TONPixSupport
• Email: support@tonpix.com
      `;

      await this.bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      this.logger.error('Error in handleHelp:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleCreatePayment(msg: TelegramMessage): Promise<void> {
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
      this.logger.error('Error in handleCreatePayment:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleBalance(msg: TelegramMessage): Promise<void> {
    try {
      const chatId = msg.chat.id;
      
      // This would integrate with TON blockchain to get actual balance
      const balanceMessage = `
💳 **Cüzdan Bakiyeniz**

**TON Network:** ${botConfig.network || 'testnet'}
**Adres:** \`${botConfig.walletAddress || 'Henüz ayarlanmadı'}\`

*Bakiye sorgulama özelliği yakında eklenecek...*
      `;

      await this.bot.sendMessage(chatId, balanceMessage, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      this.logger.error('Error in handleBalance:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleHistory(msg: TelegramMessage): Promise<void> {
    try {
      const chatId = msg.chat.id;
      
      const historyMessage = `
📊 **Ödeme Geçmişi**

*Ödeme geçmişi özelliği yakında eklenecek...*

Bu özellik ile:
• Tüm ödemelerinizi görüntüleyebilirsiniz
• İşlem detaylarını inceleyebilirsiniz
• Filtreleme ve arama yapabilirsiniz
      `;

      await this.bot.sendMessage(chatId, historyMessage, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      this.logger.error('Error in handleHistory:', error);
      await this.sendErrorMessage(msg.chat.id);
    }
  }

  private async handleCallbackQuery(query: TelegramCallbackQuery): Promise<void> {
    try {
      const chatId = query.message?.chat.id;
      const data = query.data;

      if (!chatId || !data) {
        this.logger.error('Invalid callback query data');
        return;
      }

      // Answer the callback query to remove loading state
      await this.bot.answerCallbackQuery(query.id);

      switch (data) {
        case 'create_payment':
          await this.showPaymentAmountPrompt(chatId);
          break;
        case 'balance':
          await this.handleBalance({ chat: { id: chatId } } as TelegramMessage);
          break;
        case 'history':
          await this.handleHistory({ chat: { id: chatId } } as TelegramMessage);
          break;
        case 'help':
          await this.handleHelp({ chat: { id: chatId } } as TelegramMessage);
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
      this.logger.error('Error in handleCallbackQuery:', error);
      await this.sendErrorMessage(query.message?.chat.id);
    }
  }

  private async showPaymentAmountPrompt(chatId: number): Promise<void> {
    const message = `
💰 **Ödeme Oluştur**

Lütfen ödeme miktarını ve para birimini girin:

**Format:** \`/create_payment <miktar> <para_birimi>\`

**Örnekler:**
• \`/create_payment 10 BRL\`
• \`/create_payment 5 USD\`
• \`/create_payment 100 EUR\`

**Veya aşağıdaki hızlı seçenekleri kullanın:**
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
          { text: '🔙 Geri', callback_data: 'back_to_main' }
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
      this.logger.info(`Creating payment: ${amount} ${currency} for chat ${chatId}`);

      // Create payment using PaymentService
      const payment = await this.paymentService.createPayment({
        merchantId: chatId,
        amount,
        currency,
        tokenType: 'TON'
      });

      // Generate QR code
      const qrCode = await this.qrService.generateQRCode(payment);

      // Send payment information
      const paymentMessage = `
💳 **Ödeme Oluşturuldu**

**Miktar:** ${amount} ${currency}
**TON Karşılığı:** ${payment.tokenAmount} ${payment.tokenType}
**Durum:** ${payment.status === 'pending' ? '⏳ Bekleniyor' : '✅ Tamamlandı'}
**Süre:** ${new Date(payment.expiresAt).toLocaleString('tr-TR')}

**TON Adresi:**
\`${payment.tonAddress}\`

QR kodu tarayarak veya adresi kopyalayarak ödeme yapabilirsiniz.
      `;

      // Send message with QR code
      await this.bot.sendPhoto(chatId, qrCode, {
        caption: paymentMessage,
        parse_mode: 'Markdown'
      });

      // Send additional options
      const optionsMessage = `
**Ek Seçenekler:**
• QR kodu yeniden oluştur
• Ödeme durumunu kontrol et
• İptal et
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔄 QR Yenile', callback_data: `refresh_qr_${payment.id}` },
            { text: '📊 Durum', callback_data: `check_status_${payment.id}` }
          ],
          [
            { text: '❌ İptal', callback_data: `cancel_payment_${payment.id}` }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, optionsMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      this.logger.error('Error creating payment:', error);
      await this.sendErrorMessage(chatId);
    }
  }

  private async showSettings(chatId: number): Promise<void> {
    const settingsMessage = `
⚙️ **Ayarlar**

**Bot Ayarları:**
• Bildirimler: ✅ Açık
• Dil: 🇹🇷 Türkçe
• Zaman Dilimi: UTC+3

**Cüzdan Ayarları:**
• TON Adresi: ${botConfig.walletAddress || 'Henüz ayarlanmadı'}
• Ağ: ${botConfig.network || 'testnet'}

*Ayarlar menüsü yakında eklenecek...*
      `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔙 Ana Menü', callback_data: 'back_to_main' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, settingsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  private async handleError(error: Error): Promise<void> {
    this.logger.error('Telegram bot error:', error);
  }

  private async handlePollingError(error: Error): Promise<void> {
    this.logger.error('Telegram bot polling error:', error);
  }

  private async sendErrorMessage(chatId?: number): Promise<void> {
    if (!chatId) return;

    const errorMessage = `
❌ **Bir hata oluştu**

Üzgünüz, bir hata oluştu. Lütfen daha sonra tekrar deneyin.

Eğer sorun devam ederse, destek ekibimizle iletişime geçin:
• @TONPixSupport
• support@tonpix.com
      `;

    try {
      await this.bot.sendMessage(chatId, errorMessage, {
        parse_mode: 'Markdown'
      });
    } catch (sendError) {
      this.logger.error('Error sending error message:', sendError);
    }
  }

  public async start(): Promise<void> {
    try {
      if (botConfig.webhookUrl) {
        await this.bot.setWebHook(botConfig.webhookUrl);
        this.logger.info(`Webhook set to: ${botConfig.webhookUrl}`);
      } else {
        this.logger.info('Starting bot with polling...');
      }

      this.logger.info('TONPix Telegram bot started successfully');
    } catch (error) {
      this.logger.error('Error starting bot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.bot.stopPolling();
      this.logger.info('TONPix Telegram bot stopped');
    } catch (error) {
      this.logger.error('Error stopping bot:', error);
    }
  }

  public getBot(): TelegramBot {
    return this.bot;
  }
} 