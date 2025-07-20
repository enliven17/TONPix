# TONPix - QR-Based TON Payment Bot

TONPix, küçük işletmeler için Telegram üzerinden TON blockchain ile QR kod tabanlı ödeme sistemi sağlayan bir bot uygulamasıdır.

## 🚀 Özellikler

- **Telegram Bot Entegrasyonu**: Kolay kullanım için Telegram bot arayüzü
- **QR Kod Ödemeleri**: Hızlı ve güvenli QR kod tabanlı ödemeler
- **TON Blockchain**: Hızlı ve düşük maliyetli TON blockchain entegrasyonu
- **Gerçek Zamanlı Bildirimler**: Anlık ödeme onayları
- **Çoklu Token Desteği**: TON, jUSDT ve diğer TON token'ları
- **Döviz Kuru Entegrasyonu**: Anlık döviz kuru hesaplamaları

## 🏗️ Proje Yapısı

```
tonpix/
├── src/
│   ├── bot/              # Telegram bot logic
│   ├── blockchain/       # TON blockchain integration
│   ├── payment/          # Payment processing
│   ├── qr/              # QR code generation
│   ├── utils/           # Helper functions
│   └── config/          # Configuration files
├── tests/               # Test files
├── docs/               # Documentation
└── scripts/            # Deployment scripts
```

## 🛠️ Teknoloji Stack'i

- **Backend**: Node.js + TypeScript
- **Telegram Bot**: node-telegram-bot-api
- **TON Blockchain**: @ton/ton, @ton/core
- **QR Codes**: qrcode
- **Database**: PostgreSQL (ödeme geçmişi için)
- **API**: Express.js
- **Testing**: Jest
- **Deployment**: Docker + Railway/Vercel

## 📋 Kurulum

1. **Repository'yi klonlayın**
```bash
git clone https://github.com/your-username/tonpix.git
cd tonpix
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment variables'ları ayarlayın**
```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

4. **Bot'u çalıştırın**
```bash
npm run dev
```

## 🔧 Environment Variables

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# TON Blockchain
TON_NETWORK=mainnet # veya testnet
TON_API_KEY=your_ton_api_key

# Database
DATABASE_URL=postgresql://...

# Exchange Rate API
EXCHANGE_API_KEY=your_exchange_api_key
```

## 🚀 Kullanım

1. Telegram'da @TONPixBot'u bulun
2. `/start` komutunu gönderin
3. "Ödeme Al" butonuna basın
4. QR kodu tarayın veya TON adresini kopyalayın
5. TON Wallet ile ödeme yapın
6. Anlık onay alın!

## 📱 API Endpoints

- `POST /api/payments/create` - Yeni ödeme oluştur
- `GET /api/payments/:id` - Ödeme durumu sorgula
- `GET /api/transactions/:address` - TON işlem geçmişi

## 🧪 Test

```bash
npm test
```

## 📄 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

- Telegram: @TONPixBot
- Email: support@tonpix.com
- Website: https://tonpix.com 