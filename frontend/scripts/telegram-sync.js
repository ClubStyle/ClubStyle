import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN is not set.');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

const DATA_FILE = path.join(__dirname, '../data/materials.json');
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const TARGET_CHAT_ID = (() => {
    const raw = (process.env.TELEGRAM_TARGET_CHAT_ID || '').trim();
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n !== 0 ? n : -1002055411531;
})();
const DAYS_WINDOW = (() => {
    const raw = (process.env.TELEGRAM_DAYS_WINDOW || '').trim();
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 365;
})();
const CUTOFF_TS = Math.floor(Date.now() / 1000) - (DAYS_WINDOW * 24 * 60 * 60);
const MODE = (process.env.TELEGRAM_SYNC_MODE || 'once').toLowerCase();

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(filepath);
                res.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else {
                reject(new Error(`Failed to download image: ${res.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

async function sync() {
    console.log('Connecting to Telegram...');
    try {
        const updates = [];
        let offset;
        while (true) {
            const batch = await bot.getUpdates({
                offset,
                limit: 100,
                allowed_updates: ['channel_post', 'message']
            });
            if (!batch.length) break;
            updates.push(...batch);
            offset = batch[batch.length - 1].update_id + 1;
            if (batch.length < 100) break;
        }

        console.log(`Found ${updates.length} updates in queue.`);

        let materials = [];
        if (fs.existsSync(DATA_FILE)) {
            materials = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }

        let addedCount = 0;
        const newItems = [];
        const groups = new Map(); // key: media_group_id or single:<message_id>

        for (const update of updates) {
            const msg = update.channel_post || update.message;
            if (!msg) continue;

            // Only channel posts from target channel
            if (!msg.chat || msg.chat.id !== TARGET_CHAT_ID) continue;
            if (!msg.date || msg.date < CUTOFF_TS) continue;

            const key = msg.media_group_id ? `group:${msg.media_group_id}` : `single:${msg.message_id}`;
            if (!groups.has(key)) {
                groups.set(key, {
                    ids: [],
                    chatId: msg.chat.id,
                    date: msg.date,
                    text: '',
                    photos: []
                });
            }
            const g = groups.get(key);
            g.ids.push(msg.message_id);
            g.date = Math.max(g.date, msg.date);

            const text = msg.caption || msg.text || '';
            if (text && text.length > (g.text?.length || 0)) {
                g.text = text;
            }

            if (msg.photo) {
                try {
                    const photo = msg.photo[msg.photo.length - 1];
                    const fileLink = await bot.getFileLink(photo.file_id);
                    const fileName = `${msg.message_id}.jpg`;
                    const localFilePath = path.join(UPLOADS_DIR, fileName);
                    if (!fs.existsSync(localFilePath)) {
                        await downloadImage(fileLink, localFilePath);
                    }
                    g.photos.push(`/uploads/${fileName}`);
                } catch (err) {
                    console.error(`Failed to download image for msg ${msg.message_id}:`, err.message);
                }
            }
        }

        for (const g of groups.values()) {
            const minId = g.ids.length ? Math.min(...g.ids) : undefined;
            if (!minId) continue;
            const id = String(minId);
            if (materials.find(m => m.id === id) || newItems.find(m => m.id === id)) continue;

            const title = g.text.split('\n')[0].substring(0, 100) || 'Новый пост';
            const hashtags = (g.text.match(/#[a-zа-я0-9_]+/gi) || []).join(' ');
            const chatId = g.chatId.toString().replace('-100', '');
            const link = `https://t.me/c/${chatId}/${id}`;
            const images = g.photos;
            const image = images.length ? images[0] : '/ban.png';

            const newItem = {
                id,
                title,
                hashtag: hashtags || '#новинка',
                image,
                images,
                link,
                description: g.text,
                date: g.date
            };

            newItems.unshift(newItem); // Add to top
            addedCount++;
        }

        // Preserve ALL existing items (manual content, бренды, гайды, эфиры) and prepend new channel posts
        const byId = new Map();
        for (const item of materials) {
            byId.set(item.id, item);
        }
        for (const item of newItems) {
            byId.set(item.id, item);
        }
        const combined = Array.from(byId.values()).sort((a, b) => (b.date || 0) - (a.date || 0));

        fs.writeFileSync(DATA_FILE, JSON.stringify(combined, null, 2));
        console.log(`Prepared ${combined.length} posts from the last ${DAYS_WINDOW} days. Newly added: ${addedCount}.`);

    } catch (error) {
        console.error('Error syncing with Telegram:', error.message);
        if (error.code === 'ETELEGRAM') {
            console.error('Make sure your Bot Token is correct and the bot is added to the channel.');
        }
    }
}

async function main() {
    await sync();
    if (MODE === 'daemon' || MODE === 'cron') {
        const { default: cron } = await import('node-cron');
        cron.schedule('*/30 * * * *', () => {
            sync();
        });
    }
}

await main().catch((err) => {
    console.error('Fatal error:', err?.message || err);
    process.exitCode = 1;
});
