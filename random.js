// Import required dependencies
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

// Import configuration files
// Create these files with your specific content
const ALLOWED_NUMBERS = require('./allowedNumbers');
const RANDOM_TEXTS = require('./randomTexts');
const RANDOM_STICKERS = require('./randomStickers');

// Storage for pending claims
const pendingClaims = new Map();

// Function to create and manage the WhatsApp connection
async function connectToWhatsApp() {
  // Create authentication state
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  // Create WhatsApp connection
  const sock = makeWASocket({
    printQRInTerminal: false,  // We'll use qrcode-terminal instead
    auth: state,
    defaultQueryTimeoutMs: 60000  // Increase timeout for slow connections
  });
  
  // Save credentials whenever they're updated
  sock.ev.on('creds.update', saveCreds);
  
  // Handle connection updates (when QR code is scanned, etc.)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    // If connected successfully
    if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!');
      console.log(`WhatsApp Bot is ready! Listening only to ${ALLOWED_NUMBERS.join(', ')} in group chats`);
    }
    
    // If disconnected
    if (connection === 'close') {
      // Check if we should reconnect
      const shouldReconnect = (lastDisconnect?.error instanceof Boom && 
                               lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut);
      
      if (shouldReconnect) {
        console.log('Connection closed due to error, reconnecting...');
        connectToWhatsApp();
      } else {
        console.log('Connection closed. You may need to scan the QR code again.');
      }
    }
    
    // Display QR code using qrcode-terminal (like in the second file)
    if (qr) {
      console.log('Scan the QR code below to log in:');
      qrcode.generate(qr, { small: true });
    }
  });
  
  // Listen for incoming messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const message of messages) {
      try {
        // Skip status messages and messages without content
        if (message.key.remoteJid === 'status@broadcast' || !message.message) continue;
        
        // Get the chat ID
        const chatId = message.key.remoteJid;
        
        // Check if this is a group chat (group IDs end with "@g.us")
        const isGroupChat = chatId.endsWith('@g.us');
        
        // Skip if not a group chat
        if (!isGroupChat) {
          console.log('Ignoring message from DM:', chatId);
          continue;
        }
        
        // Get the message text
        const messageText = message.message.conversation || 
                            message.message.extendedTextMessage?.text || 
                            message.message.imageMessage?.caption || '';
        
        // Get sender ID (similar to second file format)
        const author = message.key.participant || message.key.remoteJid;
        const sender = author.split('@')[0];
        
        // Check if sender is in allowed numbers
        if (!ALLOWED_NUMBERS.includes(sender)) continue;
        
        // Check for collection command
        if (messageText.trim() === '$opbot-col') {
            try {
                // Delete the command message
                await sock.sendMessage(chatId, {
                    delete: message.key
                });
                console.log(`Deleted $opbot-col command from ${sender} in group ${chatId}`);
                
                // Simulate typing
                await sock.sendPresenceUpdate('composing', chatId);
                const typingDuration = 500 + Math.floor(Math.random() * 500);
                await new Promise(resolve => setTimeout(resolve, typingDuration));
                
                // Send collection command
                await sock.sendMessage(chatId, { text: '.col' });
                console.log(`Sent collection command in response to ${sender} in group ${chatId}`);
            } catch (error) {
                console.error('Error processing collection command:', error);
            }
            continue; // Skip further processing for this message
        }
        
        // Define regex patterns (same as second file)
        const claimPattern = /\.claim\s+([\w\d]+)/;
        const tierPattern = /⭐\s*\*Tier\*:\s*(\w+)/;
        
        // Check for tier and claim patterns
        const tierMatch = messageText.match(tierPattern);
        const claimMatch = messageText.match(claimPattern);
        
        // Process card appearance with tier information
        if (tierMatch) {
          const tier = tierMatch[1];
          
          // If no claim ID found in the card message, skip processing
          if (!claimMatch) continue;
          
          const claimId = claimMatch[1];
          let shouldClaim = false;
          
          // Decision logic based on tier (same as second file)
          if (tier === 'S' || parseInt(tier, 10) >= 4) {
            // 80% chance to claim for tier 4-6 or S
            shouldClaim = Math.random() < 0.8;
          } else if (parseInt(tier, 10) >= 1 && parseInt(tier, 10) <= 3) {
            // 45% chance to claim for tier 1-3
            shouldClaim = Math.random() < 0.45;
          }
          
          if (shouldClaim) {
            // Send after 1.5 second delay (same as second file)
            setTimeout(async () => {
              try {
                // Simulate typing (equivalent to chat.sendStateTyping())
                await sock.sendPresenceUpdate('composing', chatId);
                const typingDuration = 500 + Math.floor(Math.random() * 500);
                await new Promise(resolve => setTimeout(resolve, typingDuration));
                
                // Send claim message
                await sock.sendMessage(chatId, { text: `.claim ${claimId}` });
                
                // 80% chance to send follow-up message
                if (Math.random() < 0.8) {
                  // Random delay between 3 and 8 seconds
                  const randomDelay = 3000 + Math.floor(Math.random() * 5000);
                  console.log(`Will send follow-up message after ${randomDelay}ms`);
                  
                  setTimeout(async () => {
                    await sendRandomResponse(sock, chatId);
                  }, randomDelay);
                } else {
                  console.log('Skipping follow-up message (20% chance)');
                }
              } catch (error) {
                console.error('Error during message processing:', error);
              }
            }, 1500);
          } else {
            // Store in pending claims to monitor if someone else claims it
            pendingClaims.set(claimId, { chatId });
            
            // Set a timeout to remove this from pending after 5 minutes
            setTimeout(() => {
              if (pendingClaims.has(claimId)) {
                pendingClaims.delete(claimId);
              }
            }, 5 * 60 * 1000);
          }
        }
        // If this is a claim message from someone else (not the bot)
        else if (claimMatch && !message.key.fromMe) {
          const claimedId = claimMatch[1];
          
          if (pendingClaims.has(claimedId)) {
            const { chatId } = pendingClaims.get(claimedId);
            
            // Check again if chatId is a group chat before responding
            if (chatId.endsWith('@g.us')) {
              // 35% chance to send "Fuck u" after someone else claims
              if (Math.random() < 0.35) {
                try {
                  await sock.sendPresenceUpdate('composing', chatId);
                  const typingDuration = 500 + Math.floor(Math.random() * 500);
                  await new Promise(resolve => setTimeout(resolve, typingDuration));
                  await sock.sendMessage(chatId, { text: "Fuck u" });
                } catch (error) {
                  console.error('Error sending "Fuck u" response:', error);
                }
              }
            }
            
            pendingClaims.delete(claimedId);
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });
  
  return sock;
}

// Function to send random text message or sticker
async function sendRandomResponse(sock, chatId) {
  try {
    // Verify this is a group chat before responding
    if (!chatId.endsWith('@g.us')) {
      console.log('Skipping random response in DM:', chatId);
      return;
    }
    
    // Simulate typing
    await sock.sendPresenceUpdate('composing', chatId);
    const typingDuration = 500 + Math.floor(Math.random() * 1500);
    await new Promise(resolve => setTimeout(resolve, typingDuration));
    
    const isSticker = Math.random() < 0.5;
    
    if (isSticker && RANDOM_STICKERS.length > 0) {
      // Get random sticker path
      const randomStickerPath = RANDOM_STICKERS[Math.floor(Math.random() * RANDOM_STICKERS.length)];
      const stickerBuffer = fs.readFileSync(randomStickerPath);
      
      // Send as sticker
      await sock.sendMessage(chatId, { 
        sticker: stickerBuffer 
      });
    } else {
      // Send random text
      const randomText = RANDOM_TEXTS[Math.floor(Math.random() * RANDOM_TEXTS.length)];
      await sock.sendMessage(chatId, { text: randomText });
    }
  } catch (error) {
    console.error('Error during random response:', error);
  }
}

console.log('Starting WhatsApp connection...');
connectToWhatsApp().catch(err => console.log('Error in connection: ', err));  