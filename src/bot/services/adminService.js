const { fileManager } = require('../utils/fileManager');
const path = require('path');
const config = require('../../../config');
const logger = require('../utils/logger');

// Local copy of allowed numbers
let allowedNumbers = [...config.allowedNumbers];

function isAllowedNumber(number) {
  return allowedNumbers.includes(number);
}

function getAllowedNumbers() {
  return [...allowedNumbers];
}

async function updateAllowedNumbers(action, number) {
  if (action === 'add') {
    if (!allowedNumbers.includes(number)) {
      allowedNumbers.push(number);
      
      try {
        await fileManager.writeJsModule(
          path.join(__dirname, '../../../config/allowedNumbers.js'),
          allowedNumbers
        );
        
        return {
          success: true,
          message: `✅ Added ${number} to allowed list`
        };
      } catch (error) {
        logger.error('Error saving allowed numbers:', error);
        // Revert the change in memory
        allowedNumbers = allowedNumbers.filter(num => num !== number);
        
        return {
          success: false,
          message: '⚠️ Error saving allowed numbers'
        };
      }
    } else {
      return {
        success: false,
        message: `⚠️ ${number} already in allowed list`
      };
    }
  } else if (action === 'remove') {
    if (allowedNumbers.includes(number)) {
      allowedNumbers = allowedNumbers.filter(num => num !== number);
      
      try {
        await fileManager.writeJsModule(
          path.join(__dirname, '../../../config/allowedNumbers.js'),
          allowedNumbers
        );
        
        return {
          success: true,
          message: `✅ Removed ${number} from allowed list`
        };
      } catch (error) {
        logger.error('Error saving allowed numbers:', error);
        // Revert the change in memory
        allowedNumbers.push(number);
        
        return {
          success: false,
          message: '⚠️ Error saving allowed numbers'
        };
      }
    } else {
      return {
        success: false,
        message: `⚠️ ${number} not in allowed list`
      };
    }
  }
  
  return {
    success: false,
    message: '⚠️ Invalid action'
  };
}

module.exports = {
  isAllowedNumber,
  getAllowedNumbers,
  updateAllowedNumbers
};