const fs = require('fs').promises;
const logger = require('./logger');

const fileManager = {
  readJsonFile: async (filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Error reading JSON file ${filePath}:`, error);
      throw error;
    }
  },
  
  writeJsonFile: async (filePath, data) => {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      logger.error(`Error writing JSON file ${filePath}:`, error);
      throw error;
    }
  },
  
  writeJsModule: async (filePath, data) => {
    try {
      await fs.writeFile(filePath, `module.exports = ${JSON.stringify(data, null, 2)};`, 'utf8');
      return true;
    } catch (error) {
      logger.error(`Error writing JS module ${filePath}:`, error);
      throw error;
    }
  }
};

module.exports = { fileManager };