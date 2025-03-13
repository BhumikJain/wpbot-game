const { connectToWhatsApp } = require('./services/whatsapp');
const { setupConnectionHandler } = require('./events/connectionHandler');
const { setupMessageHandler } = require('./events/messageHandler');
const logger = require('./utils/logger');

const whatsappBot = {
  start: async () => {
    try {
      logger.info('Initializing WhatsApp connection...');
      const sock = await connectToWhatsApp();
      
      // Set up event handlers
      setupConnectionHandler(sock);
      setupMessageHandler(sock);
      
      return sock;
    } catch (error) {
      logger.error('Failed to start WhatsApp bot:', error);
      throw error;
    }
  }
};

module.exports = { whatsappBot };