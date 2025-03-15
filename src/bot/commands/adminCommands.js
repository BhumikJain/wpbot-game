const { updateAllowedNumbers, getAllowedNumbers, isAllowedNumber } = require('../services/adminService');
const { updateClaimProbabilities, getClaimProbabilities } = require('../services/claimService');
const { helpCommand } = require('./helpCommand');
const logger = require('../utils/logger');
const { fileManager } = require('../utils/fileManager');
const path = require('path');

// Bot state control
let botEnabled = true;
let claimDelay = 1500; // Default delay in milliseconds

// Function to save bot state to a config file
async function saveBotState() {
  try {
    const botState = {
      enabled: botEnabled,
      claimDelay: claimDelay
    };

    await fileManager.writeJsonFile(
      path.join(__dirname, '../../../config/botState.json'),
      botState
    );

    return true;
  } catch (error) {
    logger.error('Error saving bot state:', error);
    return false;
  }
}

// Function to load bot state from config file
async function loadBotState() {
  try {
    const botState = await fileManager.readJsonFile(
      path.join(__dirname, '../../../config/botState.json')
    );

    if (botState) {
      botEnabled = botState.enabled;
      claimDelay = botState.claimDelay || 1500;
    }

    logger.info(`Bot state loaded: enabled=${botEnabled}, claimDelay=${claimDelay}ms`);
    return true;
  } catch (error) {
    logger.warn('Could not load bot state, using defaults:', error);
    return false;
  }
}

// Initialize bot state when the module is loaded
loadBotState().catch(err => {
  logger.error('Failed to initialize bot state:', err);
});

async function handleAdminCommands(sock, message, sender, chatId, messageText) {
  // Check if sender is in allowed numbers for admin commands
  if (!isAllowedNumber(sender)) {
    return false;
  }

  const command = messageText.trim().split(' ');

  // Handle bot on/off commands
  if (command[0] === '$opbot-off') {
    if (!botEnabled) {
      await sock.sendMessage(chatId, { text: '🔴 Bot is already OFF.' });
      return true;
    }

    botEnabled = false;
    await sock.sendMessage(chatId, { text: '🔴 Bot has been turned OFF. All commands and card claiming are now disabled.' });

    // Log the state change
    logger.info(`Bot disabled by admin: ${sender}`);

    // Save the state to persist across restarts
    await saveBotState();
    return true;
  }
  else if (command[0] === '$opbot-on') {
    if (botEnabled) {
      await sock.sendMessage(chatId, { text: '🟢 Bot is already ON.' });
      return true;
    }

    botEnabled = true;
    await sock.sendMessage(chatId, { text: '🟢 Bot has been turned ON. All commands and card claiming are now enabled.' });

    // Log the state change
    logger.info(`Bot enabled by admin: ${sender}`);

    // Save the state to persist across restarts
    await saveBotState();
    return true;
  }

  // Handle claim delay command: $opbot-time 1500
  else if (command[0] === '$opbot-time') {
    if (command.length < 2) {
      await sock.sendMessage(chatId, { text: '⚠️ Use: $opbot-time [delay in ms]' });
      return true;
    }

    const newDelay = parseInt(command[1], 10);
    if (isNaN(newDelay) || newDelay < 0) {
      await sock.sendMessage(chatId, { text: '⚠️ Delay must be a positive number in milliseconds' });
      return true;
    }

    claimDelay = newDelay;
    await sock.sendMessage(chatId, { text: `⏱️ Claim delay set to ${newDelay}ms` });

    // Log the change
    logger.info(`Claim delay changed to ${newDelay}ms by admin: ${sender}`);

    // Save the state to persist across restarts
    await saveBotState();
    return true;
  }

  // Handle collection command
  else if (command[0] === '$opbot-col') {
    // Check if bot is enabled for this command
    if (!botEnabled) {
      await sock.sendMessage(chatId, { text: '🔴 Bot is currently OFF. Use $opbot-on to enable.' });
      return true;
    }

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

    // Check if trying to remove the developer number
    if (numberToRemove === '919278272016') {
      await sock.sendMessage(chatId, { text: '⚠️ You cannot remove the developer number!' });
      return true;
    }

    const result = await updateAllowedNumbers('remove', numberToRemove);
    await sock.sendMessage(chatId, { text: result.message });
    return true;
  }

  // Handle list numbers command: $opbot-list-numbers
  else if (command[0] === '$opbot-list-numbers') {
    const allowedNumbers = getAllowedNumbers();
    const numbersList = allowedNumbers.join('\n• ');
    await sock.sendMessage(chatId, { text: `📋 Allowed Numbers:\n• ${numbersList}` });
    return true;
  }

  else if (command[0] === '$opbot-get-time') {
    const claimTime = claimDelay;
    await sock.sendMessage(chatId, { text: `⏱️ Current claim delay: ${claimTime}ms` });
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

    // The updateClaimProbabilities function will handle the category conversion
    const result = await updateClaimProbabilities(category, probability);
    await sock.sendMessage(chatId, { text: result.message });
    return true;
  }

  // Handle get probabilities command: $opbot-get-probs
  else if (command[0] === '$opbot-get-probs') {
    const probabilities = getClaimProbabilities();

    // Format the output with better naming
    const formattedProbs = [];

    if ('preferred' in probabilities) {
      formattedProbs.push(`• Preferred: ${(probabilities.preferred * 100).toFixed(1)}%`);
    }
    if ('tierS' in probabilities) {
      formattedProbs.push(`• Tier S: ${(probabilities.tierS * 100).toFixed(1)}%`);
    }

    // Add tier 1-6 in descending order (higher tiers first)
    for (let i = 6; i >= 1; i--) {
      const key = `tier${i}`;
      if (key in probabilities) {
        formattedProbs.push(`• Tier ${i}: ${(probabilities[key] * 100).toFixed(1)}%`);
      }
    }

    await sock.sendMessage(chatId, { text: `📊 Current Claim Probabilities:\n${formattedProbs.join('\n')}` });
    return true;
  }

  // Handle help command: $opbot-help
  else if (command[0] === '$opbot-help') {
    await helpCommand(sock, chatId);
    return true;
  }

  return false;
}

function isBotEnabled() {
  return botEnabled;
}

function getClaimDelay() {
  return claimDelay;
}

module.exports = {
  handleAdminCommands,
  isBotEnabled,
  getClaimDelay
};