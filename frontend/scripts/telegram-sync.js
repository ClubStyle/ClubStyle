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

function readJsonExport(jsonPath) {
    try {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        return parsed;
    } catch {
        return null;
    }
}

function flattenText(parts) {
    if (typeof parts === 'string') return parts;
    if (!Array.isArray(parts)) return '';
    const out = [];
    for (const p of parts) {
        if (!p) continue;
        if (typeof p === 'string') {
            out.push(p);
            continue;
        }
        const type = typeof p.type === 'string' ? p.type : '';
        if (type === 'text_link' && typeof p.href === 'string' && typeof p.text === 'string') {
            out.push(p.text);
            out.push(' ');
            out.push(p.href);
            continue;
        }
        if (type === 'link' && typeof p.text === 'string') {
            out.push(p.text);
            continue;
        }
        if (typeof p.text === 'string') out.push(p.text);
    }
    return out.join('').trim();
}

function extractHashtags(text) {
    const tags = (text.match(/#[a-zA-Zа-яА-Я0-9_]+/g) || []).map((t) => t.trim());
    const seen = new Set();
    const uniq = [];
    for (const t of tags) {
        const k = t.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        uniq.push(t);
    }
    return uniq.join(' ');
}

async function importFromExport(jsonPath, photosPath) {
    console.log('Importing from Telegram export...');
    const exportData = readJsonExport(jsonPath);
    if (!exportData) {
        console.error('Failed to read export JSON');
        process.exit(1);
    }
    const list = Array.isArray(exportData?.chats?.list)
        ? exportData.chats.list
        : Array.isArray(exportData?.messages)
            ? [{ name: exportData?.name || '', type: exportData?.type || '', id: exportData?.id, messages: exportData.messages }]
            : [];
    const publicId = String(TARGET_CHAT_ID).replace('-100', '');
    const channelKey = `channel${publicId}`;
    let materials = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            materials = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch {
            materials = [];
        }
    }
    const byId = new Map();
    for (const item of materials) byId.set(item.id, item);
    const newItems = [];
    let addedCount = 0;

    for (const chat of list) {
        const messages = Array.isArray(chat?.messages) ? chat.messages : [];
        for (const m of messages) {
            if (m?.type !== 'message') continue;
            const fromId = typeof m?.from_id === 'string' ? m.from_id : '';
            const fwdId = typeof m?.forwarded_from_id === 'string' ? m.forwarded_from_id : '';
            const isTarget =
                fromId === channelKey ||
                fwdId === channelKey ||
                (typeof chat?.id === 'number' && String(chat.id) === publicId);
            if (!isTarget) continue;

            const id = String(m.id || '');
            if (!id || byId.has(id)) continue;

            const text = flattenText(m.text || '');
            if (!text && !m.photo) continue;

            const dateNum = Number(m.date_unixtime || 0) || 0;
            const link = id ? `https://t.me/c/${publicId}/${id}` : '';
            const hashtags = extractHashtags(text) || '#клубстильных';

            const images = [];
            const imagePath = typeof m.photo === 'string' ? m.photo : '';
            if (imagePath && photosPath) {
                const base = path.basename(imagePath);
                const src = path.join(photosPath, base);
                const ext = (base.includes('.') ? base.split('.').pop() : 'jpg') || 'jpg';
                const dstName = `${id}.${ext}`;
                const dst = path.join(UPLOADS_DIR, dstName);
                try {
                    if (fs.existsSync(src) && !fs.existsSync(dst)) {
                        fs.copyFileSync(src, dst);
                    }
                    if (fs.existsSync(dst)) {
                        images.push(`/uploads/${dstName}`);
                    }
                } catch {}
            }

            const image = images.length ? images[0] : '/ban.png';
            const titleRaw = text.split('\n')[0]?.trim() || '';
            const title = titleRaw || 'Пост';

            const item = {
                id,
                title,
                hashtag: hashtags,
                image,
                images,
                link,
                description: text,
                date: dateNum
            };
            newItems.push(item);
            byId.set(id, item);
            addedCount++;
        }
    }

    const combined = Array.from(byId.values()).sort((a, b) => (b.date || 0) - (a.date || 0));
    fs.writeFileSync(DATA_FILE, JSON.stringify(combined, null, 2));
    console.log(`Imported ${addedCount} posts. Total: ${combined.length}.`);
}

async function sync() {
    console.log('Connecting to Telegram...');
    try {
        const importJsonPath = (process.env.TELEGRAM_IMPORT_JSON_PATH || '').trim();
        const importPhotosPath = (process.env.TELEGRAM_IMPORT_PHOTOS_PATH || '').trim();
        if (importJsonPath) {
            await importFromExport(importJsonPath, importPhotosPath || '');
            return;
        }
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
