const { shouldClaimCard } = require('../services/claimService');
const { sendRandomResponse } = require('../utils/randomResponse');
const { addPendingClaim, handleOthersClaim } = require('../events/pendingClaims');
const logger = require('../utils/logger');

async function handleClaimCommands(sock, message, sender, chatId, messageText) {
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
      // Store in pending claims to monitor if someone else claims it
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