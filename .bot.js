const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ALLOWED_NUMBERS = require('./allowedNumbers');
const RANDOM_TEXTS = require('./randomTexts');
const RANDOM_STICKERS = require('./randomStickers');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log('Scan the QR code below to log in:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log(`WhatsApp Bot is ready! Listening only to ${ALLOWED_NUMBERS.join(', ')}`);
});

const pendingClaims = new Map();

client.on('message', async message => {
    const sender = message.author || message.from;

    if (!ALLOWED_NUMBERS.includes(sender)) return;

    const claimPattern = /\.claim\s+([\w\d]+)/;
    const tierPattern = /⭐\s*\*Tier\*:\s*(\w+)/;
    
    const tierMatch = message.body.match(tierPattern);
    const claimMatch = message.body.match(claimPattern);

    if (tierMatch) {
        const tier = tierMatch[1];
        // console.log(`Tier detected: ${tier}`);

        let claimId = null;
        if (claimMatch) {
            claimId = claimMatch[1];
            // console.log(`Card appearance with claim ID: ${claimId}`);
        } else {
            // console.log("No claim ID found in the card appearance message");
            return;
        }

        const chat = await message.getChat();
        const chatId = chat.id._serialized;

        let shouldClaim = false;
        
        if (tier === 'S' || parseInt(tier, 10) >= 4) {
            // 80% chance to claim for tier 4-6 or S
            shouldClaim = Math.random() < 0.8;
        } else if (parseInt(tier, 10) >= 1 && parseInt(tier, 10) <= 3) {
            // 45% chance to claim for tier 1-3
            shouldClaim = Math.random() < 0.45;
        }

        if (shouldClaim) {
            // Send after 2 second delay
            setTimeout(async () => {
                try {
                    await chat.sendStateTyping();
                    const typingDuration = 500 + Math.floor(Math.random() * 500);
                    await new Promise(resolve => setTimeout(resolve, typingDuration));
                    
                    await client.sendMessage(chatId, `.claim ${claimId}`);
                    
                    setTimeout(async () => {
                        sendRandomResponse(chat, chatId);
                    }, 5000);
                } catch (error) {
                    console.error('Error during message processing:', error);
                }
            }, 1500);
        } else {
            pendingClaims.set(claimId, { chat, chatId });
            
            // Set a timeout to remove this from pending after 5 minutes
            setTimeout(() => {
                if (pendingClaims.has(claimId)) {
                    pendingClaims.delete(claimId);
                    // console.log(`Removed expired claim wait for: ${claimId}`);
                }
            }, 5 * 60 * 1000);
        }
    } 
    
    // If this is a claim message (from someone else, not the bot)
    else if (claimMatch && !message.fromMe) {
        const claimedId = claimMatch[1];
        // console.log(`Someone claimed: ${claimedId}`);
        
        if (pendingClaims.has(claimedId)) {
            const { chat, chatId } = pendingClaims.get(claimedId);
            
            // 35% chance to send "Fuck u" after someone else claims
            if (Math.random() < 0.35) {
                // console.log(`Sending "Fuck u" response for claim: ${claimedId} (35% chance triggered)`);
                
                try {
                    await chat.sendStateTyping();
                    const typingDuration = 500 + Math.floor(Math.random() * 500);
                    await new Promise(resolve => setTimeout(resolve, typingDuration));
                    await client.sendMessage(chatId, "Fuck u");
                } catch (error) {
                    console.error('Error sending "Fuck u" response:', error);
                }
            } else {
            }
            
            pendingClaims.delete(claimedId);
        }
    }
});

async function sendRandomResponse(chat, chatId) {
    try {
        await chat.sendStateTyping();
        const typingDuration = 500 + Math.floor(Math.random() * 1500);
        await new Promise(resolve => setTimeout(resolve, typingDuration));

        const isSticker = Math.random() < 0.5;

        if (isSticker && RANDOM_STICKERS.length > 0) {
            const randomStickerPath = RANDOM_STICKERS[Math.floor(Math.random() * RANDOM_STICKERS.length)];
            const media = MessageMedia.fromFilePath(randomStickerPath);
            await chat.sendMessage(media, { sendMediaAsSticker: true });
        } else {
            const randomText = RANDOM_TEXTS[Math.floor(Math.random() * RANDOM_TEXTS.length)];
            await client.sendMessage(chatId, randomText);
        }
    } catch (error) {
        console.error('Error during random response:', error);
    }
}

client.initialize();