# TONPix - QR-Based TON Payment Bot Workflow Özeti

## 🎯 Proje Genel Bakış

TONPix, küçük işletmeler için Telegram bot üzerinden TON blockchain ile QR kod tabanlı ödeme sistemi sağlayan bir platformdur. Bu proje, hackathon için geliştirilmiş MVP (Minimum Viable Product) versiyonudur.

## 🏗️ Proje Yapısı

```
tonpix/
├── src/
│   ├── bot/              # Telegram bot logic
│   │   └── TelegramBot.ts
│   ├── blockchain/       # TON blockchain integration
│   │   └── TONService.ts
│   ├── payment/          # Payment processing
│   │   └── PaymentService.ts
│   ├── qr/              # QR code generation
│   │   └── QRService.ts
│   ├── utils/           # Helper functions
│   │   ├── Logger.ts
│   │   ├── NotificationService.ts
│   │   └── ExchangeRateService.ts
│   ├── config/          # Configuration files
│   │   └── index.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── index.ts         # Main application file
├── tests/               # Test files
├── docs/               # Documentation
├── logs/               # Application logs
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── jest.config.js      # Test config
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose
└── README.md           # Project documentation
```

## 🚀 Teknoloji Stack'i

### Backend
- **Node.js 18** + **TypeScript** - Ana runtime ve dil
- **Express.js** - Web framework
- **node-telegram-bot-api** - Telegram Bot API
- **@ton/ton** + **@ton/core** - TON blockchain entegrasyonu
- **qrcode** - QR kod oluşturma
- **winston** - Logging
- **axios** - HTTP client

### Development Tools
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **ts-node-dev** - Development server

### Deployment
- **Docker** + **Docker Compose** - Containerization
- **Railway/Vercel** - Cloud deployment (önerilen)

## 🔄 Ana İş Akışı

### 1. Satıcı (Merchant) İş Akışı

#### A) Bot Başlatma
```
1. Kullanıcı Telegram'da @TONPixBot'u bulur
2. /start komutunu gönderir
3. Bot karşılama mesajı ve ana menü gösterir
4. Kullanıcı "Ödeme Al" butonuna basar
```

#### B) Ödeme Oluşturma
```
1. Bot ödeme miktarı sorar (BRL, USD, EUR)
2. Kullanıcı miktarı girer
3. Sistem:
   - Anlık döviz kurunu çeker
   - TON/jUSDT karşılığını hesaplar
   - QR kodu oluşturur
   - TON transfer linki üretir
4. QR kod + TON adresi kullanıcıya gönderilir
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
3. Ödeme detayları otomatik doldurulur
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

## 🔧 Teknik Detaylar

### 1. QR Kod Oluşturma
```typescript
// TON Deep Link formatı
const tonLink = `ton://transfer/${walletAddress}?amount=${amount}&text=${description}`;

// QR kod oluşturma
const qrCode = await QRCode.toDataURL(tonLink, {
  width: 256,
  margin: 2,
  color: { dark: '#000000', light: '#FFFFFF' }
});
```

### 2. TON Blockchain Entegrasyonu
```typescript
// TON API ile işlem kontrolü
const response = await axios.get(
  `${TON_RPC_URL}/getTransactions`,
  {
    params: { address: walletAddress, limit: 10 },
    headers: { 'X-API-Key': TON_API_KEY }
  }
);
```

### 3. Döviz Kuru Entegrasyonu
```typescript
// Anlık döviz kuru çekme (MVP için hardcoded)
const rates = {
  'BRL': 0.00015, // 1 BRL = 0.00015 TON
  'USD': 0.00075, // 1 USD = 0.00075 TON
  'EUR': 0.00082  // 1 EUR = 0.00082 TON
};
```

## 📱 Telegram Bot Komutları

### Temel Komutlar
- `/start` - Ana menüyü aç
- `/help` - Yardım menüsü
- `/create_payment <miktar> <para_birimi>` - Ödeme oluştur
- `/balance` - Cüzdan bakiyesi
- `/history` - Ödeme geçmişi

### Örnek Kullanım
```
/create_payment 10 BRL
/create_payment 5 USD
/create_payment 100 EUR
```

## 🔐 Güvenlik Önlemleri

### 1. Ödeme Doğrulama
- İşlem hash'i kontrolü
- Miktar doğrulama (1% tolerance)
- Zaman damgası kontrolü
- Çift harcama önleme

### 2. API Güvenliği
- Rate limiting
- API key doğrulama
- Input validation
- HTTPS zorunluluğu

### 3. Veri Şifreleme
- Hassas verilerin şifrelenmesi
- Environment variables kullanımı
- Güvenli konfigürasyon

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
  merchantId: number;
  amount: number;
  currency: string;
  tokenAmount: number;
  tokenType: 'TON' | 'jUSDT';
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  transactionHash?: string;
  qrCode: string;
  tonAddress: string;
  description?: string;
  expiresAt: Date;
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
  isActive: boolean;
}
```

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
npm install          # Bağımlılıkları yükle
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

### 3. Environment Variables
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=TONPixBot

# TON Blockchain
TON_NETWORK=testnet
TON_API_KEY=your_ton_api_key_here
TON_WALLET_ADDRESS=EQD... # Your TON wallet address

# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

## 📈 Performans Optimizasyonu

### 1. Caching
- Döviz kurları 5 dakika cache
- QR kodlar 1 saat cache
- Kullanıcı verileri 30 dakika cache

### 2. Database Optimizasyonu (Gelecek)
- İndeksleme stratejileri
- Connection pooling
- Query optimizasyonu

### 3. Blockchain Monitoring
- WebSocket bağlantıları
- Batch işlem kontrolü
- Fallback API'ler

## 🔮 Gelecek Geliştirmeler

### 1. Kısa Vadeli (1-2 Hafta)
- [ ] Database entegrasyonu (PostgreSQL)
- [ ] Gerçek döviz kuru API entegrasyonu
- [ ] Kullanıcı kimlik doğrulama
- [ ] Ödeme geçmişi sayfası

### 2. Orta Vadeli (1-2 Ay)
- [ ] Web dashboard
- [ ] Çoklu dil desteği
- [ ] Gelişmiş analitikler
- [ ] API rate limiting

### 3. Uzun Vadeli (3-6 Ay)
- [ ] Mobile app
- [ ] Çoklu blockchain desteği
- [ ] DeFi entegrasyonu
- [ ] Enterprise özellikleri

## 📞 Destek ve İletişim

### Teknik Destek
- **Telegram:** @TONPixSupport
- **Email:** support@tonpix.com
- **Website:** https://tonpix.com

### Geliştirici Kaynakları
- **GitHub:** https://github.com/your-username/tonpix
- **API Docs:** https://docs.tonpix.com
- **Community:** https://t.me/tonpixcommunity

## 🎯 Hackathon Hedefleri

### MVP Özellikleri ✅
- [x] Telegram bot entegrasyonu
- [x] QR kod oluşturma
- [x] TON blockchain entegrasyonu
- [x] Ödeme doğrulama
- [x] Bildirim sistemi
- [x] Docker deployment
- [x] TypeScript ile tip güvenliği
- [x] Kapsamlı logging
- [x] Error handling
- [x] Test altyapısı

### Demo Senaryosu
1. **Bot Başlatma** - Kullanıcı botu başlatır
2. **Ödeme Oluşturma** - 10 BRL ödeme talebi oluşturur
3. **QR Kod Tarama** - QR kodu tarar ve TON Wallet açılır
4. **Ödeme Yapma** - TON ile ödeme yapar
5. **Onay Alma** - Satıcı ödeme onayını alır

### Jüri Sunumu İçin
- **Demo Video:** 2-3 dakikalık ekran kaydı
- **Pitch Deck:** 5 slide (Problem, Çözüm, Teknoloji, Demo, Roadmap)
- **GitHub Repo:** Temiz kod ve dokümantasyon
- **Live Demo:** Canlı ödeme gösterimi

Bu workflow, TONPix projesinin tüm teknik detaylarını ve iş akışını kapsar. Hackathon için hazır bir MVP sunar ve gelecek geliştirmeler için sağlam bir temel oluşturur. 