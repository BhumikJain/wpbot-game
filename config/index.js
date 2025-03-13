const allowedNumbers = require('./allowedNumbers');
const randomTexts = require('./randomTexts');
const randomStickers = require('./randomStickers');
const preferredCardNames = require('./preferredCardNames');
const fs = require('fs');
const path = require('path');

// Load probabilities from file
let claimProbabilities;
try {
  const probabilitiesPath = path.join(__dirname, 'claimProbabilities.json');
  if (fs.existsSync(probabilitiesPath)) {
    claimProbabilities = JSON.parse(fs.readFileSync(probabilitiesPath, 'utf8'));
  } else {
    claimProbabilities = {
      preferred: 1.0,
      tierS: 0.8,
      tier4to6: 0.8,
      tier1to3: 0.45
    };
    // Create default file
    fs.writeFileSync(probabilitiesPath, JSON.stringify(claimProbabilities, null, 2));
  }
} catch (error) {
  console.error('Error loading probabilities, using defaults:', error);
  claimProbabilities = {
    preferred: 1.0,
    tierS: 0.8,
    tier4to6: 0.8,
    tier1to3: 0.45
  };
}

module.exports = {
  allowedNumbers,
  randomTexts,
  randomStickers,
  preferredCardNames,
  claimProbabilities
};