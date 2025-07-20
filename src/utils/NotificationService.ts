import TelegramBot from 'node-telegram-bot-api';
import { Payment, PaymentNotification, NotificationMessage } from '@/types';
import { Logger } from './Logger';

export class NotificationService {
  private bot: TelegramBot;
  private logger: Logger;

  constructor(bot: TelegramBot) {
    this.bot = bot;
    this.logger = new Logger('NotificationService');
  }

  public async sendPaymentNotification(notification: PaymentNotification): Promise<void> {
    try {
      const { payment, message, type } = notification;
      
      const formattedMessage = this.formatPaymentMessage(payment, message, type);
      
      await this.bot.sendMessage(payment.merchantId, formattedMessage, {
        parse_mode: 'Markdown'
      });

      this.logger.info(`Payment notification sent to ${payment.merchantId}`, {
        paymentId: payment.id,
        type,
        amount: payment.amount,
        currency: payment.currency
      });

    } catch (error) {
      this.logger.error('Error sending payment notification:', error);
    }
  }

  public async sendMessage(notification: NotificationMessage): Promise<void> {
    try {
      await this.bot.sendMessage(notification.chatId, notification.text, {
        parse_mode: notification.parseMode,
        reply_markup: notification.replyMarkup
      });

      this.logger.info(`Message sent to ${notification.chatId}`);
    } catch (error) {
      this.logger.error('Error sending message:', error);
    }
  }

  public async sendPaymentReceived(payment: Payment): Promise<void> {
    const message = `
✅ **Ödeme Alındı!**

**Ödeme Detayları:**
• Miktar: ${payment.amount} ${payment.currency}
• TON Karşılığı: ${payment.tokenAmount} ${payment.tokenType}
• İşlem Hash: \`${payment.transactionHash}\`
• Zaman: ${payment.completedAt?.toLocaleString('tr-TR')}

**Durum:** ✅ Tamamlandı

Teşekkürler! Ödemeniz başarıyla alındı.
      `;

    await this.sendPaymentNotification({
      payment,
      message,
      type: 'payment_received'
    });
  }

  public async sendPaymentExpired(payment: Payment): Promise<void> {
    const message = `
⏰ **Ödeme Süresi Doldu**

**Ödeme Detayları:**
• Miktar: ${payment.amount} ${payment.currency}
• TON Karşılığı: ${payment.tokenAmount} ${payment.tokenType}
• Oluşturulma: ${payment.createdAt.toLocaleString('tr-TR')}

**Durum:** ❌ Süresi Doldu

Ödeme süresi doldu. Yeni bir ödeme oluşturmak için /create_payment komutunu kullanın.
      `;

    await this.sendPaymentNotification({
      payment,
      message,
      type: 'payment_expired'
    });
  }

  public async sendPaymentFailed(payment: Payment, reason: string): Promise<void> {
    const message = `
❌ **Ödeme Başarısız**

**Ödeme Detayları:**
• Miktar: ${payment.amount} ${payment.currency}
• TON Karşılığı: ${payment.tokenAmount} ${payment.tokenType}
• Hata: ${reason}

**Durum:** ❌ Başarısız

Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.
      `;

    await this.sendPaymentNotification({
      payment,
      message,
      type: 'payment_failed'
    });
  }

  public async sendWelcomeMessage(chatId: number, userName: string): Promise<void> {
    const message = `
🎉 **pixTON'a Hoş Geldiniz!**

Merhaba ${userName}! pixTON ile TON blockchain üzerinden güvenli ödemeler alabilirsiniz.

**Özellikler:**
• 🚀 Hızlı QR kod ödemeleri
• 💰 Düşük işlem ücretleri
• 🔒 Güvenli blockchain teknolojisi
• 🌍 Global erişim

Başlamak için /start komutunu kullanın!
      `;

    await this.sendMessage({
      chatId,
      text: message,
      parseMode: 'Markdown'
    });
  }

  public async sendError(chatId: number, error: string): Promise<void> {
    const message = `
❌ **Bir Hata Oluştu**

${error}

Lütfen daha sonra tekrar deneyin veya destek ekibimizle iletişime geçin.
      `;

    await this.sendMessage({
      chatId,
      text: message,
      parseMode: 'Markdown'
    });
  }

  private formatPaymentMessage(payment: Payment, message: string, type: string): string {
    const statusEmoji = {
      'payment_received': '✅',
      'payment_expired': '⏰',
      'payment_failed': '❌'
    };

    const emoji = statusEmoji[type as keyof typeof statusEmoji] || '📊';

    return `${emoji} ${message}`;
  }

  public async sendSystemNotification(chatIds: number[], message: string): Promise<void> {
    const promises = chatIds.map(chatId => 
      this.sendMessage({
        chatId,
        text: message,
        parseMode: 'Markdown'
      }).catch(error => {
        this.logger.error(`Failed to send system notification to ${chatId}:`, error);
      })
    );

    await Promise.allSettled(promises);
    this.logger.info(`System notification sent to ${chatIds.length} users`);
  }

  public async sendMaintenanceNotification(chatIds: number[], maintenanceTime: string): Promise<void> {
    const message = `
🔧 **Bakım Bildirimi**

Sistem bakımı yapılacaktır.

**Bakım Zamanı:** ${maintenanceTime}
**Süre:** Yaklaşık 30 dakika

Bu süre zarfında ödeme işlemleri geçici olarak durdurulacaktır.

Anlayışınız için teşekkürler!
      `;

    await this.sendSystemNotification(chatIds, message);
  }
} 