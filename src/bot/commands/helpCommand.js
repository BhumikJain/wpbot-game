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
  
  *BOT CONTROL* 
  - *$opbot-on* - 🟢 Enable bot and all commands
  - *$opbot-off* - 🔴 Disable bot and all commands
  - *$opbot-time* [ms] - ⏱️ Set claim delay in milliseconds
  - *$opbot-get-time* - ⏱️ Show current claim delay time

  *Formats:* 
  - $opbot-set-prob 5 0.75 → Sets 75% claim chance for tier 5 cards
  - $opbot-set-prob preferred 0.9 → Sets 90% claim chance for preferred cards`;

  await sock.sendMessage(chatId, { text: helpText });
  return true;
}

module.exports = { helpCommand };