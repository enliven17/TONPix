import QRCode from 'qrcode';
import { Payment, TONDeepLink, QRCodeOptions } from '@/types';
import { TONService } from '@/blockchain/TONService';
import { qrConfig } from '@/config';
import { Logger } from '@/utils/Logger';

export class QRService {
  private tonService: TONService;
  private logger: Logger;

  constructor() {
    this.tonService = new TONService();
    this.logger = new Logger('QRService');
  }

  public async generateQRCode(payment: Payment): Promise<string> {
    try {
      this.logger.info(`Generating QR code for payment: ${payment.id}`);

      // Create TON deep link
      const deepLink = await this.tonService.createDeepLink(payment);
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(deepLink, {
        width: qrConfig.size,
        margin: qrConfig.margin,
        color: qrConfig.color,
        errorCorrectionLevel: 'M'
      });

      // Update payment with QR code and TON address
      payment.qrCode = qrCodeDataUrl;
      payment.tonAddress = deepLink.split('?')[0].replace('ton://transfer/', '');

      this.logger.info(`QR code generated for payment ${payment.id}`, {
        deepLink,
        qrCodeSize: qrConfig.size
      });

      return qrCodeDataUrl;

    } catch (error) {
      this.logger.error('Error generating QR code:', error);
      throw error;
    }
  }

  public async generateQRCodeFromDeepLink(deepLink: string, options?: QRCodeOptions): Promise<string> {
    try {
      this.logger.info('Generating QR code from deep link');

      const qrOptions = {
        width: options?.width || qrConfig.size,
        margin: options?.margin || qrConfig.margin,
        color: options?.color || qrConfig.color,
        errorCorrectionLevel: 'M' as const
      };

      const qrCodeDataUrl = await QRCode.toDataURL(deepLink, qrOptions);

      this.logger.info('QR code generated from deep link', {
        deepLink,
        qrCodeSize: qrOptions.width
      });

      return qrCodeDataUrl;

    } catch (error) {
      this.logger.error('Error generating QR code from deep link:', error);
      throw error;
    }
  }

  public async generateQRCodeFromTONDeepLink(deepLink: TONDeepLink): Promise<string> {
    try {
      this.logger.info('Generating QR code from TON deep link object');

      // Construct TON deep link string
      const deepLinkString = this.constructTONDeepLink(deepLink);
      
      return await this.generateQRCodeFromDeepLink(deepLinkString);

    } catch (error) {
      this.logger.error('Error generating QR code from TON deep link object:', error);
      throw error;
    }
  }

  public async generatePaymentQRCode(
    amount: number,
    currency: string,
    description?: string
  ): Promise<{ qrCode: string; deepLink: string; tonAddress: string }> {
    try {
      this.logger.info('Generating payment QR code', {
        amount,
        currency,
        description
      });

      // Create TON deep link object
      const deepLink: TONDeepLink = {
        address: '', // Will be set from config
        amount: amount.toString(),
        text: description || `Payment for ${amount} ${currency}`,
        jetton: undefined
      };

      // Generate QR code
      const qrCode = await this.generateQRCodeFromTONDeepLink(deepLink);
      const deepLinkString = this.constructTONDeepLink(deepLink);
      const tonAddress = deepLinkString.split('?')[0].replace('ton://transfer/', '');

      return {
        qrCode,
        deepLink: deepLinkString,
        tonAddress
      };

    } catch (error) {
      this.logger.error('Error generating payment QR code:', error);
      throw error;
    }
  }

  public async generateJettonQRCode(
    jettonAddress: string,
    amount: number,
    description?: string
  ): Promise<{ qrCode: string; deepLink: string }> {
    try {
      this.logger.info('Generating jetton QR code', {
        jettonAddress,
        amount,
        description
      });

      // Create TON deep link for jetton transfer
      const deepLink: TONDeepLink = {
        address: '', // Will be set from config
        amount: amount.toString(),
        text: description || `Jetton transfer: ${amount}`,
        jetton: jettonAddress
      };

      const deepLinkString = this.constructJettonDeepLink(deepLink);
      const qrCode = await this.generateQRCodeFromDeepLink(deepLinkString);

      return {
        qrCode,
        deepLink: deepLinkString
      };

    } catch (error) {
      this.logger.error('Error generating jetton QR code:', error);
      throw error;
    }
  }

  public async generateQRCodeWithLogo(
    data: string,
    logoPath?: string,
    options?: QRCodeOptions
  ): Promise<string> {
    try {
      this.logger.info('Generating QR code with logo');

      // For MVP, we'll generate a basic QR code
      // In production, you would implement logo overlay functionality
      
      const qrOptions = {
        width: options?.width || qrConfig.size,
        margin: options?.margin || qrConfig.margin,
        color: options?.color || qrConfig.color,
        errorCorrectionLevel: 'H' as const // Higher error correction for logo overlay
      };

      const qrCodeDataUrl = await QRCode.toDataURL(data, qrOptions);

      this.logger.info('QR code with logo generated', {
        dataLength: data.length,
        qrCodeSize: qrOptions.width
      });

      return qrCodeDataUrl;

    } catch (error) {
      this.logger.error('Error generating QR code with logo:', error);
      throw error;
    }
  }

  public async generateMultipleQRCodes(
    payments: Payment[]
  ): Promise<Array<{ paymentId: string; qrCode: string; deepLink: string }>> {
    try {
      this.logger.info(`Generating multiple QR codes for ${payments.length} payments`);

      const results = await Promise.all(
        payments.map(async (payment) => {
          try {
            const qrCode = await this.generateQRCode(payment);
            const deepLink = await this.tonService.createDeepLink(payment);

            return {
              paymentId: payment.id,
              qrCode,
              deepLink
            };
          } catch (error) {
            this.logger.error(`Error generating QR code for payment ${payment.id}:`, error);
            return {
              paymentId: payment.id,
              qrCode: '',
              deepLink: ''
            };
          }
        })
      );

      this.logger.info(`Generated ${results.length} QR codes`);

      return results;

    } catch (error) {
      this.logger.error('Error generating multiple QR codes:', error);
      throw error;
    }
  }

  public async validateQRCode(qrCodeDataUrl: string): Promise<boolean> {
    try {
      // For MVP, we'll do basic validation
      // In production, you would decode the QR code and validate its content
      
      if (!qrCodeDataUrl.startsWith('data:image/png;base64,')) {
        return false;
      }

      // Check if the data URL is valid
      const base64Data = qrCodeDataUrl.split(',')[1];
      if (!base64Data) {
        return false;
      }

      // Try to decode base64
      try {
        Buffer.from(base64Data, 'base64');
        return true;
      } catch {
        return false;
      }

    } catch (error) {
      this.logger.error('Error validating QR code:', error);
      return false;
    }
  }

  public async getQRCodeInfo(qrCodeDataUrl: string): Promise<{
    size: number;
    format: string;
    dataLength: number;
  }> {
    try {
      const base64Data = qrCodeDataUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      return {
        size: buffer.length,
        format: 'PNG',
        dataLength: base64Data.length
      };

    } catch (error) {
      this.logger.error('Error getting QR code info:', error);
      throw error;
    }
  }

  public async getDeepLink(payment: Payment): Promise<string> {
    return this.tonService.createDeepLink(payment);
  }

  public async getTransactions(address: string, limit: number): Promise<any[]> {
    return this.tonService.getTransactions(address, limit);
  }

  private constructTONDeepLink(deepLink: TONDeepLink): string {
    const { address, amount, text, jetton } = deepLink;
    
    let deepLinkString = `ton://transfer/${address}?amount=${amount}`;
    
    if (text) {
      deepLinkString += `&text=${encodeURIComponent(text)}`;
    }
    
    if (jetton) {
      deepLinkString += `&jetton=${jetton}`;
    }
    
    return deepLinkString;
  }

  private constructJettonDeepLink(deepLink: TONDeepLink): string {
    const { address, amount, text, jetton } = deepLink;
    
    if (!jetton) {
      throw new Error('Jetton address is required for jetton transfers');
    }
    
    let deepLinkString = `ton://transfer/${address}?amount=${amount}&jetton=${jetton}`;
    
    if (text) {
      deepLinkString += `&text=${encodeURIComponent(text)}`;
    }
    
    return deepLinkString;
  }

  public async generateQRCodeSVG(data: string, options?: QRCodeOptions): Promise<string> {
    try {
      this.logger.info('Generating QR code as SVG');

      const qrOptions = {
        width: options?.width || qrConfig.size,
        margin: options?.margin || qrConfig.margin,
        color: options?.color || qrConfig.color,
        errorCorrectionLevel: 'M' as const
      };

      const svgString = await QRCode.toString(data, {
        type: 'svg',
        ...qrOptions
      });

      this.logger.info('SVG QR code generated');

      return svgString;

    } catch (error) {
      this.logger.error('Error generating SVG QR code:', error);
      throw error;
    }
  }
} 