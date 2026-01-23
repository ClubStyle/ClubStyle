const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN is not set in .env file.');
    console.log('Please create a .env file in the frontend directory with TELEGRAM_BOT_TOKEN=your_token');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

const DATA_FILE = path.join(__dirname, '../data/materials.json');
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

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
        // Get updates (offset can be stored to avoid re-fetching, but for now we fetch recent)
        // We use allowed_updates to ensure we get channel posts
        const updates = await bot.getUpdates({
            allowed_updates: ['channel_post', 'message']
        });

        console.log(`Found ${updates.length} updates.`);

        let materials = [];
        if (fs.existsSync(DATA_FILE)) {
            materials = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }

        let addedCount = 0;

        for (const update of updates) {
            const msg = update.channel_post || update.message;
            if (!msg) continue;

            // Use message ID as unique ID
            const id = msg.message_id.toString();

            // Check if already exists
            if (materials.find(m => m.id === id)) continue;

            // Extract content
            const text = msg.caption || msg.text || '';
            const title = text.split('\n')[0].substring(0, 100) || 'Новый пост';
            const hashtags = (text.match(/#[a-zа-я0-9_]+/gi) || []).join(' ');
            
            let imageUrl = '/ban.png'; // Placeholder
            
            if (msg.photo) {
                try {
                    // Get highest resolution photo
                    const photo = msg.photo[msg.photo.length - 1];
                    const fileLink = await bot.getFileLink(photo.file_id);
                    const fileName = `${id}.jpg`;
                    const localFilePath = path.join(UPLOADS_DIR, fileName);
                    
                    await downloadImage(fileLink, localFilePath);
                    imageUrl = `/uploads/${fileName}`;
                } catch (err) {
                    console.error(`Failed to download image for msg ${id}:`, err.message);
                }
            }

            // Construct link (assuming public or private structure)
            // For private channels with -100 prefix: t.me/c/ID/MSG_ID
            let link = '#';
            if (msg.chat && msg.chat.id) {
                const chatId = msg.chat.id.toString().replace('-100', '');
                link = `https://t.me/c/${chatId}/${id}`;
            }

            const newItem = {
                id,
                title,
                hashtag: hashtags || '#новинка',
                image: imageUrl,
                link,
                description: text
            };

            materials.unshift(newItem); // Add to top
            addedCount++;
        }

        if (addedCount > 0) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(materials, null, 2));
            console.log(`Successfully added ${addedCount} new posts.`);
        } else {
            console.log('No new posts to add.');
        }

    } catch (error) {
        console.error('Error syncing with Telegram:', error.message);
        if (error.code === 'ETELEGRAM') {
            console.error('Make sure your Bot Token is correct and the bot is added to the channel.');
        }
    }
}

sync();
