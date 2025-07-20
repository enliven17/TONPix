# TONPix Workflow - Detaylı İş Akışı

## 📋 Genel Bakış

TONPix, Telegram bot üzerinden TON blockchain ile QR kod tabanlı ödeme sistemi sağlayan bir platformdur. Bu dokümantasyon, sistemin tam iş akışını ve teknik detaylarını açıklar.

## 🔄 Ana İş Akışı

### 1. Satıcı (Merchant) İş Akışı

#### A) Bot Başlatma ve Kimlik Doğrulama
```
1. Kullanıcı Telegram'da @TONPixBot'u bulur
2. /start komutunu gönderir
3. Bot karşılama mesajı gönderir
4. Kullanıcı TON cüzdan adresini kaydeder (opsiyonel)
5. Ana menü gösterilir
```

#### B) Ödeme Talebi Oluşturma
```
1. Kullanıcı "Ödeme Al" butonuna basar
2. Bot ödeme miktarı sorar (BRL, USD, EUR vs.)
3. Kullanıcı miktarı girer
4. Sistem:
   - Anlık döviz kurunu çeker
   - TON/jUSDT karşılığını hesaplar
   - QR kodu oluşturur
   - TON transfer linki üretir
5. QR kod + TON adresi kullanıcıya gönderilir
```

#### C) Ödeme Bekleme ve Onay
```
1. Bot arka planda TON blockchain'i dinler
2. Ödeme geldiğinde:
   - İşlem hash'i kontrol edilir
   - Miktar doğrulanır
   - Satıcıya bildirim gönderilir
3. Ödeme onayı + fiş gönderilir
```

### 2. Alıcı (Customer) İş Akışı

#### A) QR Kod ile Ödeme
```
1. Satıcının QR kodunu tarar
2. TON Wallet uygulaması açılır
3. Ödeme detayları otomatik doldurulur:
   - Alıcı adresi
   - Miktar
   - Token tipi
4. Alıcı ödemeyi onaylar
5. TON blockchain'e işlem gönderilir
```

#### B) Blockchain Onayı
```
1. TON ağı işlemi işler (3-5 saniye)
2. İşlem hash'i oluşturulur
3. Bot işlemi algılar
4. Satıcıya bildirim gönderilir
```

### 3. Sistem (Backend) İş Akışı

#### A) Ödeme Oluşturma Süreci
```typescript
interface PaymentRequest {
  merchantId: string;
  amount: number;
  currency: string;
  tokenType: 'TON' | 'jUSDT';
  description?: string;
}

interface PaymentResponse {
  paymentId: string;
  qrCode: string;
  tonAddress: string;
  amount: number;
  tokenAmount: number;
  expiresAt: Date;
}
```

#### B) Blockchain Listener
```typescript
class TONListener {
  async watchAddress(address: string): Promise<void> {
    // Her 5 saniyede bir işlem kontrolü
    setInterval(async () => {
      const transactions = await this.getTransactions(address);
      const newPayments = this.filterNewPayments(transactions);
      
      for (const payment of newPayments) {
        await this.processPayment(payment);
      }
    }, 5000);
  }
}
```

#### C) Bildirim Sistemi
```typescript
class NotificationService {
  async sendPaymentNotification(
    chatId: number, 
    payment: Payment
  ): Promise<void> {
    const message = this.formatPaymentMessage(payment);
    await this.telegramBot.sendMessage(chatId, message);
  }
}
```

## 🔧 Teknik Detaylar

### 1. QR Kod Oluşturma
```typescript
// TON Deep Link formatı
const tonLink = `ton://transfer/${walletAddress}?amount=${amount}&text=${description}`;

// QR kod oluşturma
const qrCode = await QRCode.toDataURL(tonLink, {
  width: 256,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});
```

### 2. TON Blockchain Entegrasyonu
```typescript
// TON API ile işlem kontrolü
const response = await axios.get(
  `${TON_RPC_URL}/getTransactions`,
  {
    params: {
      address: walletAddress,
      limit: 10
    },
    headers: {
      'X-API-Key': TON_API_KEY
    }
  }
);
```

### 3. Döviz Kuru Entegrasyonu
```typescript
// Anlık döviz kuru çekme
const exchangeRate = await this.getExchangeRate(fromCurrency, 'TON');
const tonAmount = amount * exchangeRate;
```

## 🚨 Hata Senaryoları ve Çözümler

### 1. Eksik Ödeme
```
Senaryo: Alıcı yanlış miktar gönderdi
Çözüm: 
- Bot "Eksik ödeme" uyarısı gönderir
- Doğru miktar bilgisi tekrar gösterilir
- 15 dakika timeout süresi verilir
```

### 2. Blockchain Gecikmesi
```
Senaryo: İşlem blockchain'de gecikmeli onaylanıyor
Çözüm:
- 60 saniye timeout eklenir
- "İşlem işleniyor" mesajı gösterilir
- Retry mekanizması çalışır
```

### 3. QR Kod Okunamıyor
```
Senaryo: QR kod tarayıcıda okunmuyor
Çözüm:
- "TON Adresini Kopyala" butonu sunulur
- Manuel transfer talimatları verilir
- Alternatif QR kod formatı denenir
```

## 📊 Veri Akışı

### 1. Ödeme Verisi
```typescript
interface Payment {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  tokenAmount: number;
  tokenType: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  transactionHash?: string;
  qrCode: string;
  tonAddress: string;
}
```

### 2. Kullanıcı Verisi
```typescript
interface User {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  tonAddress?: string;
  createdAt: Date;
  lastActivity: Date;
  totalPayments: number;
  totalAmount: number;
}
```

## 🔐 Güvenlik Önlemleri

### 1. Ödeme Doğrulama
- İşlem hash'i kontrolü
- Miktar doğrulama
- Zaman damgası kontrolü
- Çift harcama önleme

### 2. API Güvenliği
- Rate limiting
- API key doğrulama
- Input validation
- SQL injection koruması

### 3. Veri Şifreleme
- Hassas verilerin şifrelenmesi
- JWT token kullanımı
- HTTPS zorunluluğu

## 📈 Performans Optimizasyonu

### 1. Caching
- Döviz kurları 5 dakika cache
- QR kodlar 1 saat cache
- Kullanıcı verileri 30 dakika cache

### 2. Database Optimizasyonu
- İndeksleme stratejileri
- Connection pooling
- Query optimizasyonu

### 3. Blockchain Monitoring
- WebSocket bağlantıları
- Batch işlem kontrolü
- Fallback API'ler

## 🧪 Test Senaryoları

### 1. Birim Testleri
- QR kod oluşturma
- Döviz kuru hesaplama
- Ödeme doğrulama
- Bildirim gönderme

### 2. Entegrasyon Testleri
- Telegram Bot API
- TON Blockchain API
- Exchange Rate API

### 3. End-to-End Testleri
- Tam ödeme akışı
- Hata senaryoları
- Performans testleri

## 🚀 Deployment Süreci

### 1. Development
```bash
npm run dev          # Geliştirme sunucusu
npm run test         # Test çalıştırma
npm run lint         # Kod kontrolü
```

### 2. Production
```bash
npm run build        # TypeScript derleme
npm start           # Production sunucusu
docker-compose up   # Docker deployment
```

### 3. Monitoring
- Log aggregation
- Error tracking
- Performance monitoring
- Uptime monitoring

## 📱 API Endpoints

### 1. Payment Endpoints
```
POST /api/payments/create     # Yeni ödeme oluştur
GET  /api/payments/:id        # Ödeme durumu sorgula
GET  /api/payments/user/:id   # Kullanıcı ödemeleri
```

### 2. User Endpoints
```
POST /api/users/register      # Kullanıcı kaydı
GET  /api/users/:id           # Kullanıcı bilgileri
PUT  /api/users/:id/wallet    # Cüzdan adresi güncelle
```

### 3. Blockchain Endpoints
```
GET /api/blockchain/balance/:address    # Bakiye sorgula
GET /api/blockchain/transactions/:address # İşlem geçmişi
POST /api/blockchain/verify             # İşlem doğrula
```

Bu workflow, TONPix projesinin tüm teknik detaylarını ve iş akışını kapsar. Geliştirme sürecinde bu dokümantasyon referans olarak kullanılabilir. 