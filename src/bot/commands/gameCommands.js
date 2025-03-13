async function handleGameCommands(sock, message, sender, chatId, messageText) {
    // You can add game-specific commands here
    // Currently no special game commands beyond the claim logic
    return false;
  }
  
  module.exports = { handleGameCommands };