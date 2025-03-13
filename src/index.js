const { whatsappBot } = require('./bot/whatsappBot');

// Start the bot
console.log('Starting WhatsApp Bot...');
whatsappBot.start().catch(err => console.error('Error starting bot:', err));