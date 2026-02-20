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

function isAdmin(req) {
  const secret = String(process.env.ADMIN_SECRET || '').trim();
  if (!secret) return false;
  const header = String(req.headers['x-admin-secret'] || '').trim();
  if (header && header === secret) return true;
  const auth = String(req.headers.authorization || '').trim();
  if (auth && auth === secret) return true;
  if (auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice('bearer '.length).trim();
    if (token === secret) return true;
  }
  return false;
}

// Telegram Bot Setup (Optional - requires token)
const telegramToken = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
const apiBot = telegramToken ? new TelegramBot(telegramToken, { polling: false }) : null;

if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    console.log('Telegram Bot initialized');
    
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        // bot.sendMessage(chatId, 'Received your message');
    });

    bot.onText(/^\/postnav(?:\s+(.+))?$/i, async (msg) => {
        try {
            const adminUserIdRaw = String(process.env.TELEGRAM_ADMIN_USER_ID || '').trim();
            const adminUserId = adminUserIdRaw ? Number(adminUserIdRaw) : null;
            if (adminUserId && msg?.from?.id !== adminUserId) {
                return;
            }

            const rawChannelId = String(process.env.TELEGRAM_TARGET_CHAT_ID || '').trim();
            const channelId = rawChannelId || '-1002055411531';
            const webAppUrl = String(process.env.TELEGRAM_WEBAPP_URL || '').trim();
            if (!webAppUrl) {
                await bot.sendMessage(msg.chat.id, 'TELEGRAM_WEBAPP_URL не задан', { reply_to_message_id: msg.message_id });
                return;
            }

            const text = 'Навигация по каналу';
            const buttonText = 'Открыть';

            const result = await bot.sendMessage(channelId, text, {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [[{ text: buttonText, web_app: { url: webAppUrl } }]]
                }
            });
            await bot.pinChatMessage(channelId, result.message_id, { disable_notification: true });
            await bot.sendMessage(msg.chat.id, `Готово: отправлено и закреплено (message_id=${result.message_id})`, {
                reply_to_message_id: msg.message_id
            });
        } catch (e) {
            const message = e && typeof e.message === 'string' ? e.message : 'Unknown error';
            try {
                await bot.sendMessage(msg.chat.id, `Ошибка: ${message}`, { reply_to_message_id: msg.message_id });
            } catch {}
        }
    });
} else {
    console.log('TELEGRAM_BOT_TOKEN not provided, skipping bot initialization');
}

app.post('/telegram/channel-webapp-post', async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    if (!apiBot) {
      return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN is not set' });
    }

    const chatId = String(req.body?.chatId || process.env.TELEGRAM_TARGET_CHAT_ID || '').trim();
    const text = String(req.body?.text || 'Навигация по каналу').trim();
    const webAppUrl = String(req.body?.webAppUrl || process.env.TELEGRAM_WEBAPP_URL || '').trim();
    const buttonText = String(req.body?.buttonText || 'Открыть').trim();
    const pin = Boolean(req.body?.pin);

    if (!chatId) return res.status(400).json({ ok: false, error: 'chatId is required' });
    if (!text) return res.status(400).json({ ok: false, error: 'text is required' });
    if (!webAppUrl) return res.status(400).json({ ok: false, error: 'webAppUrl is required' });

    let parsed;
    try {
      parsed = new URL(webAppUrl);
    } catch {
      return res.status(400).json({ ok: false, error: 'webAppUrl must be a valid URL' });
    }
    if (parsed.protocol !== 'https:') {
      return res.status(400).json({ ok: false, error: 'webAppUrl must be https' });
    }

    const result = await apiBot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: buttonText, web_app: { url: webAppUrl } }]]
      }
    });

    if (pin) {
      await apiBot.pinChatMessage(chatId, result.message_id, { disable_notification: true });
    }

    return res.json({ ok: true, message_id: result.message_id, pinned: pin });
  } catch (e) {
    const message = e && typeof e.message === 'string' ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
});

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
