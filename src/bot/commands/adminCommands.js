const { updateAllowedNumbers, getAllowedNumbers, isAllowedNumber } = require('../services/adminService');
const { updateClaimProbabilities, getClaimProbabilities } = require('../services/claimService');
const { helpCommand } = require('./helpCommand');
const logger = require('../utils/logger');

async function handleAdminCommands(sock, message, sender, chatId, messageText) {
  // Check if sender is in allowed numbers for admin commands
  if (!isAllowedNumber(sender)) {
    return false;
  }

  const command = messageText.trim().split(' ');

  // Handle collection command
  if (command[0] === '$opbot-col') {
    try {
      // Delete the command message
      await sock.sendMessage(chatId, {
        delete: message.key
      });

      // Simulate typing
      await sock.sendPresenceUpdate('composing', chatId);
      const typingDuration = 500 + Math.floor(Math.random() * 500);
      await new Promise(resolve => setTimeout(resolve, typingDuration));

      // Send collection command
      await sock.sendMessage(chatId, { text: '.col' });
      return true;
    } catch (error) {
      logger.error('Error processing collection command:', error);
      return false;
    }
  }

  // Handle add number command: $opbot-add-number 12345678
  else if (command[0] === '$opbot-add-number') {
    let numberToAdd;

    // Check for mention first
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      const mentionedJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      numberToAdd = mentionedJid.split('@')[0];
    } else if (command.length > 1) {
      numberToAdd = command[1].trim().replace(/\D/g, ''); // Clean non-numeric characters
    } else {
      await sock.sendMessage(chatId, { text: '⚠️ Use: $opbot-add-number [number] or mention a user' });
      return true;
    }

    // Validate phone number format
    if (!/^\d{8,15}$/.test(numberToAdd)) {
      await sock.sendMessage(chatId, { text: '⚠️ Invalid phone number format' });
      return true;
    }

    const result = await updateAllowedNumbers('add', numberToAdd);
    await sock.sendMessage(chatId, { text: result.message });
    return true;
  }

  // Handle remove number command: $opbot-remove-number 12345678
  else if (command[0] === '$opbot-remove-number') {
    let numberToRemove;

    // Check for mention first
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      const mentionedJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
      numberToRemove = mentionedJid.split('@')[0];
    } else if (command.length > 1) {
      numberToRemove = command[1].trim().replace(/\D/g, '');
    } else {
      await sock.sendMessage(chatId, { text: '⚠️ Use: $opbot-remove-number [number] or mention a user' });
      return true;
    }

    const result = await updateAllowedNumbers('remove', numberToRemove);
    await sock.sendMessage(chatId, { text: result.message });
    return true;
  }

  /// Handle list numbers command: $opbot-list-numbers
  else if (command[0] === '$opbot-list-numbers') {
    const allowedNumbers = getAllowedNumbers();
    const numbersList = allowedNumbers.join('\n• ');
    await sock.sendMessage(chatId, { text: `📋 Allowed Numbers:\n• ${numbersList}` });
    return true;
  }

  // Handle set probability command: $opbot-set-prob category value
  else if (command[0] === '$opbot-set-prob' && command.length > 2) {
    const category = command[1];
    const probability = parseFloat(command[2]);

    if (isNaN(probability) || probability < 0 || probability > 1) {
      await sock.sendMessage(chatId, { text: '⚠️ Probability must be a number between 0 and 1' });
      return true;
    }

    if (category === 'preferred' || category === 'tierS' ||
      category === 'tier4to6' || category === 'tier1to3') {
      const result = await updateClaimProbabilities(category, probability);
      await sock.sendMessage(chatId, { text: result.message });
      return true;
    } else {
      await sock.sendMessage(chatId, {
        text: '⚠️ Invalid category. Use: preferred, tierS, tier4to6, or tier1to3'
      });
      return true;
    }
  }

  // Handle get probabilities command: $opbot-get-probs
  else if (command[0] === '$opbot-get-probs') {
    const probabilities = getClaimProbabilities();
    const probText = Object.entries(probabilities)
      .map(([category, prob]) => `• ${category}: ${(prob * 100).toFixed(1)}%`)
      .join('\n');

    await sock.sendMessage(chatId, { text: `📊 Current Claim Probabilities:\n${probText}` });
    return true;
  }

  // Handle help command: $opbot-help
  else if (command[0] === '$opbot-help') {
    await helpCommand(sock, chatId);
    return true;
  }

  return false;
}

module.exports = { handleAdminCommands };