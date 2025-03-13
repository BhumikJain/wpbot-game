const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const path = require('path');

// Function to create and manage the WhatsApp connection
async function connectToWhatsApp() {
  // Create authentication state
  const authPath = path.join(process.cwd(), 'auth_info_baileys');
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  // Create WhatsApp connection
  const sock = makeWASocket({
    printQRInTerminal: false,  // We'll use qrcode-terminal instead
    auth: state,
    defaultQueryTimeoutMs: 60000  // Increase timeout for slow connections
  });

  // Save credentials whenever they're updated
  sock.ev.on('creds.update', saveCreds);

  return sock;
}

module.exports = { connectToWhatsApp };