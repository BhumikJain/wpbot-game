const { fileManager } = require('../utils/fileManager');
const path = require('path');
const config = require('../../../config');
const logger = require('../utils/logger');

// Initialize with default probabilities from config
// We'll expand this to have individual tier probabilities
let claimProbabilities = {
  preferred: config.claimProbabilities.preferred || 0.95,
  tierS: config.claimProbabilities.tierS || 0.9,
  tier6: config.claimProbabilities.tier6 || 0.8,
  tier5: config.claimProbabilities.tier5 || 0.7,
  tier4: config.claimProbabilities.tier4 || 0.6,
  tier3: config.claimProbabilities.tier3 || 0.5,
  tier2: config.claimProbabilities.tier2 || 0.3,
  tier1: config.claimProbabilities.tier1 || 0.2
};

// If the config has the old format, convert it to the new format
if (config.claimProbabilities.tier4to6 !== undefined && 
    config.claimProbabilities.tier1to3 !== undefined) {
  // Migrate old grouped probabilities to individual tiers
  if (claimProbabilities.tier6 === undefined) 
    claimProbabilities.tier6 = config.claimProbabilities.tier4to6;
  if (claimProbabilities.tier5 === undefined) 
    claimProbabilities.tier5 = config.claimProbabilities.tier4to6;
  if (claimProbabilities.tier4 === undefined) 
    claimProbabilities.tier4 = config.claimProbabilities.tier4to6;
  if (claimProbabilities.tier3 === undefined) 
    claimProbabilities.tier3 = config.claimProbabilities.tier1to3;
  if (claimProbabilities.tier2 === undefined) 
    claimProbabilities.tier2 = config.claimProbabilities.tier1to3;
  if (claimProbabilities.tier1 === undefined) 
    claimProbabilities.tier1 = config.claimProbabilities.tier1to3;
}

function getClaimProbabilities() {
  return { ...claimProbabilities };
}

async function updateClaimProbabilities(category, newProbability) {
  // Map number-only input to tier format
  const tierNumber = parseInt(category, 10);
  if (!isNaN(tierNumber) && tierNumber >= 1 && tierNumber <= 6) {
    category = `tier${tierNumber}`;
  }
  
  // Validate category
  const validCategories = ['preferred', 'tierS', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6'];
  
  if (!validCategories.includes(category)) {
    return {
      success: false,
      message: '⚠️ Invalid category. Use: preferred, tierS, or numbers 1-6'
    };
  }

  // Update the probability
  claimProbabilities[category] = newProbability;
  
  try {
    // Save the updated probabilities to file
    await fileManager.writeJsonFile(
      path.join(__dirname, '../../../config/claimProbabilities.json'),
      claimProbabilities
    );
    
    // Get display name (remove "tier" prefix for numbered tiers)
    let displayName = category;
    if (category.startsWith('tier') && category !== 'tierS') {
      displayName = category.replace('tier', 'Tier ');
    } else if (category === 'tierS') {
      displayName = 'Tier S';
    }
    
    return {
      success: true,
      message: `✅ Set ${displayName} claim probability to ${(newProbability * 100).toFixed(1)}%`
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
      reason: `Preferred card with ${(claimProbabilities.preferred * 100).toFixed(1)}% claim chance` 
    };
  } 
  
  // Decision logic based on specific tier
  if (tier === 'S') {
    const shouldClaim = Math.random() < claimProbabilities.tierS;
    return { 
      shouldClaim, 
      reason: `Tier S card with ${(claimProbabilities.tierS * 100).toFixed(1)}% claim chance` 
    };
  } else {
    const tierNumber = parseInt(tier, 10);
    if (tierNumber >= 1 && tierNumber <= 6) {
      const probabilityKey = `tier${tierNumber}`;
      const probability = claimProbabilities[probabilityKey];
      const shouldClaim = Math.random() < probability;
      return { 
        shouldClaim, 
        reason: `Tier ${tier} card with ${(probability * 100).toFixed(1)}% claim chance` 
      };
    }
  }
  
  // Default: don't claim if tier is unknown
  return { shouldClaim: false, reason: 'Unknown tier' };
}

module.exports = {
  getClaimProbabilities,
  updateClaimProbabilities,
  shouldClaimCard
};