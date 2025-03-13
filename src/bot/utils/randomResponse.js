const fs = require('fs');
const { randomTexts, randomStickers } = require('../../../config');
const logger = require('./logger');

async function sendRandomResponse(sock, chatId) {
  try {
    // Verify this is a group chat before responding
    if (!chatId.endsWith('@g.us')) {
      return;
    }

    // Simulate typing
    await sock.sendPresenceUpdate('composing', chatId);
    const typingDuration = 500 + Math.floor(Math.random() * 1500);
    await new Promise(resolve => setTimeout(resolve, typingDuration));

    const isSticker = Math.random() < 0.5;

    if (isSticker && randomStickers.length > 0) {
      // Get random sticker path
      const randomStickerPath = randomStickers[Math.floor(Math.random() * randomStickers.length)];
      
      try {
        const stickerBuffer = fs.readFileSync(randomStickerPath);
        
        // Send as sticker
        await sock.sendMessage(chatId, {
          sticker: stickerBuffer
        });
      } catch (error) {
        logger.error(`Error reading sticker file ${randomStickerPath}:`, error);
        // Fall back to text if sticker fails
        const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
        await sock.sendMessage(chatId, { text: randomText });
      }
    } else {
      // Send random text
      const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
      await sock.sendMessage(chatId, { text: randomText });
    }
  } catch (error) {
    logger.error('Error during random response:', error);
  }
}

module.exports = { sendRandomResponse };