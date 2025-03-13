const { fileManager } = require('../utils/fileManager');
const path = require('path');
const config = require('../../../config');
const logger = require('../utils/logger');

let claimProbabilities = { ...config.claimProbabilities };

function getClaimProbabilities() {
  return { ...claimProbabilities };
}

async function updateClaimProbabilities(category, newProbability) {
  if (
    category !== 'preferred' &&
    category !== 'tierS' &&
    category !== 'tier4to6' &&
    category !== 'tier1to3'
  ) {
    return {
      success: false,
      message: '⚠️ Invalid category. Use: preferred, tierS, tier4to6, or tier1to3'
    };
  }

  claimProbabilities[category] = newProbability;
  
  try {
    await fileManager.writeJsonFile(
      path.join(__dirname, '../../../config/claimProbabilities.json'),
      claimProbabilities
    );
    
    return {
      success: true,
      message: `✅ Set ${category} claim probability to ${newProbability * 100}%`
    };
  } catch (error) {
    logger.error('Error saving probabilities:', error);
    return {
      success: false,
      message: '⚠️ Error saving probabilities'
    };
  }
}

function shouldClaimCard(tier, cardName) {
  // Check if card name is in preferred list
  if (cardName && config.preferredCardNames.some(preferredName =>
    cardName.toLowerCase().includes(preferredName.toLowerCase()))) {
    // Use configured probability for preferred cards
    const shouldClaim = Math.random() < claimProbabilities.preferred;
    return { 
      shouldClaim, 
      reason: `Preferred card with ${claimProbabilities.preferred * 100}% claim chance` 
    };
  } 
  
  // Decision logic based on tier using configured probabilities
  if (tier === 'S') {
    const shouldClaim = Math.random() < claimProbabilities.tierS;
    return { 
      shouldClaim, 
      reason: `Tier S card with ${claimProbabilities.tierS * 100}% claim chance` 
    };
  } else if (parseInt(tier, 10) >= 4 && parseInt(tier, 10) <= 6) {
    const shouldClaim = Math.random() < claimProbabilities.tier4to6;
    return { 
      shouldClaim, 
      reason: `Tier ${tier} card with ${claimProbabilities.tier4to6 * 100}% claim chance` 
    };
  } else if (parseInt(tier, 10) >= 1 && parseInt(tier, 10) <= 3) {
    const shouldClaim = Math.random() < claimProbabilities.tier1to3;
    return { 
      shouldClaim, 
      reason: `Tier ${tier} card with ${claimProbabilities.tier1to3 * 100}% claim chance` 
    };
  }
  
  // Default: don't claim
  return { shouldClaim: false, reason: 'Unknown tier' };
}

module.exports = {
  getClaimProbabilities,
  updateClaimProbabilities,
  shouldClaimCard
};