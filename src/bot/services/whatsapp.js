const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const path = require('path');

// Function to create and manage the WhatsApp connection
async function connectToWhatsApp() {
  // Create authentication state
  const authPath = path.join(process.cwd(), 'auth_info_baileys');
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  // Create WhatsApp connection with Android configuration
  const sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    defaultQueryTimeoutMs: 60000,
    browser: ['Card Bot', 'Chrome', '10.0'],
    syncFullHistory: false,
    userAgent: { // Explicit Android user agent
      platform: 'ANDROID',
      appVersion: {
        primary: 10,
        secondary: 0,
        tertiary: 0
      },
      device: 'Card Bot',
      osVersion: '10.0',
      manufacturer: 'Samsung',
      buildVersion: '10.0'
    }
  });

  // Save credentials whenever they're updated
  sock.ev.on('creds.update', saveCreds);

  return sock;
}

module.exports = { connectToWhatsApp };