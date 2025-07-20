# 🚀 TONPix Demo Guide

## ✅ Bot Status
- **Bot Username:** @PixTonBot
- **Bot Token:** ✅ Active
- **Server:** ✅ Running (Port 3000)
- **Status:** 🟢 Ready

## 📱 Testing on Telegram

### 1. Find the Bot
Search for `@PixTonBot` in Telegram or click this link:
```
https://t.me/PixTonBot
```

### 2. Start the Bot
```
/start
```

### 3. Main Menu
The bot will offer you these options:
- 💰 Receive Payment
- 💳 Balance
- 📊 History
- ❓ Help
- ⚙️ Settings

### 4. Create Payment
1. Click "💰 Receive Payment" button
2. Choose amount:
   - 10 BRL
   - 5 USD
   - 50 EUR
   - 25 BRL
   - 10 USD
   - 100 EUR
3. Or manually: `/create_payment 15 BRL`

### 5. QR Code and Payment
The bot will provide you with:
- **TON Address:** `EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t`
- **TON Link:** `ton://transfer/...`
- **Usage Instructions**

## 🧪 Test Scenarios

### Scenario 1: Quick Demo
1. `/start` → Main menu
2. "💰 Receive Payment" → Payment options
3. "10 BRL" → Payment created
4. Copy TON link
5. Test in TON Wallet

### Scenario 2: Manual Command
1. `/create_payment 25 USD`
2. Review payment details
3. Check QR code data

### Scenario 3: Help and Information
1. `/help` → Command list
2. "💳 Balance" → Wallet information
3. "📊 History" → Payment history

## 🔧 Technical Details

### Server Endpoints
- **Health Check:** `http://localhost:3000/health`
- **API Status:** `http://localhost:3000/api/status`
- **Payment API:** `http://localhost:3000/api/payments/create`

### Bot Commands
```
/start - Main menu
/help - Help
/create_payment <amount> <currency> - Create payment
/balance - Check balance
/history - View history
```

### Example Payment Commands
```
/create_payment 10 BRL
/create_payment 5 USD
/create_payment 100 EUR
```

## 📊 Demo Metrics

### Success Criteria
- ✅ Bot startup
- ✅ Menu navigation
- ✅ Payment creation
- ✅ QR code data
- ✅ TON link generation
- ✅ Error handling

### Features to Test
- [ ] Different currencies
- [ ] Large/small amounts
- [ ] Invalid commands
- [ ] Bot restart
- [ ] Multiple users

## 🎯 For Hackathon Presentation

### Demo Flow
1. **Introduction** (30 seconds)
   - "TONPix: TON Blockchain QR Payment System"
   - "Easy payment receiving via Telegram bot"

2. **Bot Demonstration** (2 minutes)
   - Open bot in Telegram
   - `/start` command
   - Main menu navigation
   - Payment creation

3. **QR Code Demo** (1 minute)
   - Generated QR code data
   - TON link format
   - Wallet integration

4. **Technical Features** (1 minute)
   - Written in TypeScript
   - Modular architecture
   - Docker support
   - API endpoints

5. **Conclusion** (30 seconds)
   - "Hackathon MVP ready"
   - "Future features"

### Presentation Notes
- Bot is currently running
- Can be tested with testnet TON
- Real payment integration requires TON API key
- QR code visualization can be added
- Database integration can be implemented

## 🔗 Useful Links

- **Bot:** https://t.me/PixTonBot
- **TON Testnet:** https://testnet.tonscan.org
- **TON Wallet:** https://ton.org/wallets
- **Testnet TON:** https://t.me/testgiver_ton_bot

## 📞 Support

If you encounter issues:
- Check logs
- Restart bot: `npm run dev`
- Check server status: `curl http://localhost:3000/health`

---

**🎉 TONPix Demo Ready!** 