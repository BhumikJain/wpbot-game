const { handleAdminCommands } = require('../commands/adminCommands');
const { handleClaimCommands } = require('../commands/claimCommands');
const { handleGameCommands } = require('../commands/gameCommands');
const { isAllowedNumber } = require('../services/adminService');
const logger = require('../utils/logger');

function setupMessageHandler(sock) {
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      try {
        // Skip status messages and messages without content
        if (message.key.remoteJid === 'status@broadcast' || !message.message) continue;

        // Get the chat ID
        const chatId = message.key.remoteJid;

        // Check if this is a group chat (group IDs end with "@g.us")
        const isGroupChat = chatId.endsWith('@g.us');

        // Skip if not a group chat
        if (!isGroupChat) continue;

        // Get the message text
        const messageText = message.message.conversation ||
          message.message.extendedTextMessage?.text ||
          message.message.imageMessage?.caption || '';

        // Get sender ID
        const author = message.key.participant || message.key.remoteJid;
        const sender = author.split('@')[0];

        // Process admin commands (first priority)
        if (messageText.startsWith('$opbot-')) {
          await handleAdminCommands(sock, message, sender, chatId, messageText);
          continue;
        }

        // For non-admin commands, check if sender is allowed
        if (!isAllowedNumber(sender)) continue;

        // Handle game-related commands
        await handleGameCommands(sock, message, sender, chatId, messageText);

        // Handle claim patterns
        await handleClaimCommands(sock, message, sender, chatId, messageText);
      } catch (error) {
        logger.error('Error processing message:', error);
      }
    }
  });
}

module.exports = { setupMessageHandler };