# 🤖 TONPix - TON Blockchain QR Payment Bot

A Telegram bot for creating QR code-based payments using the TON blockchain. Built with TypeScript, Express.js, and modern development practices.

## 🚀 Features

- **Telegram Bot Integration**: Easy-to-use bot interface
- **QR Code Generation**: Generate TON payment QR codes
- **Multi-Currency Support**: BRL, USD, EUR, TON
- **TON Blockchain Integration**: Real-time payment verification
- **Modular Architecture**: Clean, maintainable codebase
- **TypeScript**: Full type safety
- **Docker Support**: Easy deployment
- **API Endpoints**: RESTful API for integrations

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Telegram Bot Token (from @BotFather)
- TON API Key (from toncenter.com)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tonpix.git
cd tonpix
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
```

Edit `.env` file with your configuration:
```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_BOT_USERNAME=TONPixBot

# TON Blockchain Configuration
TON_NETWORK=testnet
TON_API_KEY=your_ton_api_key_here
TON_RPC_URL=https://testnet.toncenter.com/api/v2/jsonRPC
TON_WALLET_ADDRESS=your_wallet_address_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

4. **Build the project**
```bash
npm run build
```

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## 📱 Bot Commands

- `/start` - Main menu
- `/help` - Help and commands
- `/create_payment <amount> <currency>` - Create new payment
- `/balance` - Check wallet balance
- `/history` - View payment history

### Examples
```
/create_payment 10 BRL
/create_payment 5 USD
/create_payment 100 EUR
```

## 🏗️ Project Structure

```
src/
├── bot/           # Telegram bot service
├── blockchain/    # TON blockchain integration
├── config/        # Configuration management
├── payment/       # Payment management
├── qr/           # QR code generation
├── types/        # TypeScript types
├── utils/        # Utility functions
└── index.ts      # Main application
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Required |
| `TON_API_KEY` | TON Center API key | Required |
| `TON_NETWORK` | TON network (testnet/mainnet) | testnet |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |

### API Endpoints

- `GET /health` - Health check
- `GET /api/status` - API status
- `POST /api/payments/create` - Create payment
- `GET /api/payments/:id` - Get payment status

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Docker

### Build Image
```bash
docker build -t tonpix .
```

### Run Container
```bash
docker run -p 3000:3000 --env-file .env tonpix
```

### Docker Compose
```bash
docker-compose up -d
```

## 🔒 Security

- Environment variables for sensitive data
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers

## 📊 Monitoring

- Winston logging
- Health check endpoints
- Error tracking
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/tonpix/issues)
- **Telegram**: @TONPixSupport
- **Email**: support@tonpix.com

## 🎯 Roadmap

- [ ] Real-time payment verification
- [ ] QR code image generation
- [ ] Database integration
- [ ] Telegram Mini-App
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Webhook support
- [ ] Admin dashboard

## 🙏 Acknowledgments

- [TON Foundation](https://ton.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [TON Center](https://toncenter.com/)

---

**Made with ❤️ for the TON ecosystem** 