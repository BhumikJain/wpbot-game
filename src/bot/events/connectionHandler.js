const { DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const { qrCodeGenerator } = require('../utils/qrcodeHelper');
const logger = require('../utils/logger');
const { connectToWhatsApp } = require('../services/whatsapp');

function setupConnectionHandler(sock) {
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // If connected successfully
    if (connection === 'open') {
      logger.info('✅ Connected to WhatsApp!');
    }

    // If disconnected
    if (connection === 'close') {
      // Check if we should reconnect
      const shouldReconnect = (lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut);

      if (shouldReconnect) {
        logger.warn('Connection closed due to error, reconnecting...');
        connectToWhatsApp();
      } else {
        logger.error('Connection closed. You may need to scan the QR code again.');
      }
    }

    // Display QR code using qrcode-terminal
    if (qr) {
      logger.info('Scan the QR code below to log in:');
      qrCodeGenerator(qr);
    }
  });
}

module.exports = { setupConnectionHandler };