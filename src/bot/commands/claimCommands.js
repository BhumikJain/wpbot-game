const { shouldClaimCard } = require('../services/claimService');
const { sendRandomResponse } = require('../utils/randomResponse');
const { addPendingClaim, handleOthersClaim } = require('../events/pendingClaims');
const logger = require('../utils/logger');

/**
 * Extract text content from different message types
 * @param {Object} message - The message object
 * @returns {string} - The extracted text content
 */
function extractMessageText(message) {
  if (!message || !message.message) return '';

  const msg = message.message;

  // Check for text in different message types
  if (msg.conversation) {
    return msg.conversation;
  } else if (msg.imageMessage && msg.imageMessage.caption) {
    return msg.imageMessage.caption;
  } else if (msg.videoMessage && msg.videoMessage.caption) {
    // This handles both videos and GIFs (GIFs are videoMessages with gifPlayback=true)
    return msg.videoMessage.caption;
  } else if (msg.extendedTextMessage && msg.extendedTextMessage.text) {
    return msg.extendedTextMessage.text;
  } else if (msg.buttonsResponseMessage && msg.buttonsResponseMessage.selectedDisplayText) {
    return msg.buttonsResponseMessage.selectedDisplayText;
  } else if (msg.templateButtonReplyMessage && msg.templateButtonReplyMessage.selectedDisplayText) {
    return msg.templateButtonReplyMessage.selectedDisplayText;
  } else if (msg.listResponseMessage && msg.listResponseMessage.title) {
    return msg.listResponseMessage.title;
  } else if (msg.documentMessage && msg.documentMessage.caption) {
    return msg.documentMessage.caption;
  }

  // If no text found, return empty string
  return '';
}

/**
 * Handle claim commands from any message type
 */
async function handleClaimCommands(sock, message, sender, chatId) {
  // Extract message text from any message type
  const messageText = extractMessageText(message);

  // Define regex patterns
  const claimPattern = /\.claim\s+([\w\d]+)/;
  const tierPattern = /⭐\s*\*Tier\*:\s*(\w+)/;
  const namePattern = /🎴\s*\*Name\*:\s*([^\n]+)/;

  // Check for patterns
  const tierMatch = messageText.match(tierPattern);
  const claimMatch = messageText.match(claimPattern);
  const nameMatch = messageText.match(namePattern);

  // Process card appearance with tier and name information
  if (tierMatch) {
    const tier = tierMatch[1];

    // If no claim ID found in the card message, skip processing
    if (!claimMatch) return false;

    const claimId = claimMatch[1];

    // Check if card name is in preferred list (if name was found)
    const cardName = nameMatch ? nameMatch[1].trim() : null;

    // Determine if we should claim the card
    const { shouldClaim, reason } = shouldClaimCard(tier, cardName);

    if (shouldClaim) {

      // Send after 1.5 second delay
      setTimeout(async () => {
        try {
          // Simulate typing
          await sock.sendPresenceUpdate('composing', chatId);
          const typingDuration = 500 + Math.floor(Math.random() * 500);
          await new Promise(resolve => setTimeout(resolve, typingDuration));

          // Send claim message
          await sock.sendMessage(chatId, { text: `.claim ${claimId}` });

          // 80% chance to send follow-up message
          if (Math.random() < 0.8) {
            // Random delay between 3 and 8 seconds
            const randomDelay = 3000 + Math.floor(Math.random() * 5000);
            setTimeout(async () => {
              await sendRandomResponse(sock, chatId);
            }, randomDelay);
          }
        } catch (error) {
          logger.error('Error during card claiming:', error);
        }
      }, 1500);
      return true;
    } else {
      addPendingClaim(claimId, chatId, cardName);
      return true;
    }
  }

  // If this is a claim message from someone else (not the bot)
  else if (claimMatch && !message.key.fromMe) {
    const claimedId = claimMatch[1];
    await handleOthersClaim(sock, claimedId, sender);
    return true;
  }

  return false;
}

module.exports = { handleClaimCommands };