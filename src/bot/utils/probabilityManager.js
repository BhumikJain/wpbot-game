const { claimProbabilities } = require('../../../config');

function calculateClaimProbability(tier, isPreferred) {
  if (isPreferred) {
    return claimProbabilities.preferred;
  }
  
  if (tier === 'S') {
    return claimProbabilities.tierS;
  }
  
  const tierNum = parseInt(tier, 10);
  if (tierNum >= 4 && tierNum <= 6) {
    return claimProbabilities.tier4to6;
  }
  
  if (tierNum >= 1 && tierNum <= 3) {
    return claimProbabilities.tier1to3;
  }
  
  return 0; // Default - don't claim unknown tiers
}

function shouldClaimBasedOnProbability(probability) {
  return Math.random() < probability;
}

module.exports = {
  calculateClaimProbability,
  shouldClaimBasedOnProbability
};