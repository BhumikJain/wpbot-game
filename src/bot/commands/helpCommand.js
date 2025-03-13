async function helpCommand(sock, chatId) {
    const helpText = `*📚 BOT COMMANDS GUIDE 📚*
  
  *ADMINISTRATION*
  - *$opbot-add-number* [number] - 📱 Add number to allowed list
  - *$opbot-remove-number* [number] - 🚫 Remove number from list
  - *$opbot-list-numbers* - 📋 List all authorized numbers
  
  *PROBABILITIES*
  - *$opbot-set-prob* [category] [0-1] - ⚙️ Configure claim chances
  - *$opbot-get-probs* - 📊 Show current probability settings
  
  *GAME ACTIONS*
  - *$opbot-col* - 🔄 Send collection command
  - *$opbot-help* - ❓ Show this help menu
  
  *Formats:* 
  \`$opbot-set-prob tierS 0.8\`
  \`$opbot-add-number 123456789\``;
  
    await sock.sendMessage(chatId, { text: helpText });
    return true;
  }
  
  module.exports = { helpCommand };