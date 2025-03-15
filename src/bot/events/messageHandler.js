const { handleAdminCommands, isBotEnabled } = require('../commands/adminCommands');
const { handleClaimCommands } = require('../commands/claimCommands');
const { handleGameCommands } = require('../commands/gameCommands');
const { isAllowedNumber } = require('../services/adminService');
const logger = require('../utils/logger');
const { getDevice } = require("@whiskeysockets/baileys");

function setupMessageHandler(sock) {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      for (const message of messages) {
        const chatId = message.key.remoteJid;
        
        // Skip status updates and non-group messages
        if (chatId === 'status@broadcast' || !chatId.endsWith('@g.us')) continue;
        if (!message.message) continue;

        const senderJid = message.key.participant || chatId;
        const sender = senderJid.split('@')[0];
        const messageText = getMessageText(message);

        // Device detection
        const deviceType = getDevice(message.key.id);
        logger.debug(`Message from ${sender} received via ${deviceType}`);

        // Admin commands have priority - always process regardless of bot status
        if (messageText.startsWith('$opbot-')) {
          await handleAdminCommands(sock, message, sender, chatId, messageText);
          continue;
        }

        // If bot is disabled, don't process any other commands
        if (!isBotEnabled()) {
          continue;
        }

        // Check user permissions for non-admin commands
        if (!isAllowedNumber(sender)) {
          logger.warn(`Unauthorized access attempt by ${sender}`);
          continue;
        }

        // Process game commands
        await handleGameCommands(sock, message, sender, chatId, messageText);

        // Process claim commands
        await handleClaimCommands(sock, message, sender, chatId);
      }
    } catch (error) {
      logger.error('Fatal error processing messages:', error);
    }
  });
}

/**
 * Extracts message text from different message types
 */
function getMessageText(message) {
  return message.message?.conversation ||
         message.message?.extendedTextMessage?.text ||
         message.message?.imageMessage?.caption ||
         message.message?.videoMessage?.caption ||
         '';
}

module.exports = { setupMessageHandler };