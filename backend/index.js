require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Telegram Bot Setup (Optional - requires token)
if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    console.log('Telegram Bot initialized');
    
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        // bot.sendMessage(chatId, 'Received your message');
    });
} else {
    console.log('TELEGRAM_BOT_TOKEN not provided, skipping bot initialization');
}

// Supabase Setup (Optional - requires keys)
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('Supabase initialized');
} else {
    console.log('Supabase credentials not provided, skipping initialization');
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
