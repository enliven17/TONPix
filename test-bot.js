const TelegramBot = require('node-telegram-bot-api');

// Bot token
const token = '7967245177:AAEA84l5H4euoDf9usKdrva9turb2bwJcCE';

// Test chat ID (kendi chat ID'nizi buraya yazın)
const testChatId = 'YOUR_CHAT_ID_HERE'; // Buraya kendi chat ID'nizi yazın

// Bot instance
const bot = new TelegramBot(token, { polling: false });

async function testBot() {
  try {
    console.log('🤖 TONPix Bot Test Starting...\n');

    // 1. Get bot information
    console.log('1. Getting bot information...');
    const botInfo = await bot.getMe();
    console.log(`✅ Bot: ${botInfo.first_name} (@${botInfo.username})`);
    console.log(`✅ Bot ID: ${botInfo.id}\n`);

    // 2. Send test message
    if (testChatId !== 'YOUR_CHAT_ID_HERE') {
      console.log('2. Sending test message...');
      await bot.sendMessage(testChatId, '🧪 TONPix Bot Test Message\n\nBot is working! 🎉');
      console.log('✅ Test message sent\n');
    } else {
      console.log('⚠️  Test message not sent (Chat ID not configured)\n');
    }

    // 3. Check server status
    console.log('3. Checking server status...');
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      const health = await response.json();
      console.log(`✅ Server: ${health.status}`);
      console.log(`✅ Version: ${health.version}`);
      console.log(`✅ Timestamp: ${health.timestamp}\n`);
    } else {
      console.log('❌ Server not running\n');
    }

    console.log('🎉 Bot test completed!');
    console.log('\n📱 To test on Telegram:');
    console.log('1. Search for @PixTonBot username');
    console.log('2. Send /start command');
    console.log('3. Click "💰 Receive Payment" button');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// How to get Chat ID:
async function getChatId() {
  console.log('📋 Chat ID guide:');
  console.log('1. Send a message to the bot');
  console.log('2. Visit this URL:');
  console.log(`   https://api.telegram.org/bot${token}/getUpdates`);
  console.log('3. Copy the "chat" -> "id" value');
  console.log('4. Paste it in the testChatId variable\n');
}

// Test çalıştır
if (process.argv.includes('--get-chat-id')) {
  getChatId();
} else {
  testBot();
} 