const { sendRandomResponse } = require('../utils/randomResponse');
const logger = require('../utils/logger');

// Storage for pending claims
const pendingClaims = new Map();

function addPendingClaim(claimId, chatId, cardName) {
  pendingClaims.set(claimId, { chatId, cardName });
  
  // Set a timeout to remove this from pending after 5 minutes
  setTimeout(() => {
    if (pendingClaims.has(claimId)) {
      pendingClaims.delete(claimId);
    }
  }, 5 * 60 * 1000);
}

async function handleOthersClaim(sock, claimId, sender) {
  if (pendingClaims.has(claimId)) {
    const { chatId, cardName } = pendingClaims.get(claimId);
    
    // Check if chatId is a group chat before responding
    if (chatId.endsWith('@g.us')) {
      // 35% chance to send "Fuck u" after someone else claims
      if (Math.random() < 0.35) {
        try {
          await sock.sendPresenceUpdate('composing', chatId);
          const typingDuration = 500 + Math.floor(Math.random() * 500);
          await new Promise(resolve => setTimeout(resolve, typingDuration));
          await sock.sendMessage(chatId, { text: "Fuck u" });
        } catch (error) {
          logger.error('Error sending "Fuck u" response:', error);
        }
      }
    }
    
    pendingClaims.delete(claimId);
    return true;
  }
  return false;
}

function hasPendingClaim(claimId) {
  return pendingClaims.has(claimId);
}

module.exports = {
  pendingClaims,
  addPendingClaim,
  handleOthersClaim,
  hasPendingClaim
};