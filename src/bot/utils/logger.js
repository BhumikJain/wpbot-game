const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'bot.log');

function formatLogMessage(level, message, extra = '') {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${extra}\n`;
}

function writeToLogFile(message) {
  fs.appendFileSync(logFilePath, message);
}

const logger = {
  debug: (message, extra = '') => {
    const logMessage = formatLogMessage('debug', message, extra);
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(`\x1b[34m${logMessage}\x1b[0m`); // Blue text
    }
    writeToLogFile(logMessage);
  },
  
  info: (message, extra = '') => {
    const logMessage = formatLogMessage('info', message, extra);
    console.log(`\x1b[32m${logMessage}\x1b[0m`); // Green text
    writeToLogFile(logMessage);
  },
  
  warn: (message, extra = '') => {
    const logMessage = formatLogMessage('warn', message, extra);
    console.warn(`\x1b[33m${logMessage}\x1b[0m`); // Yellow text
    writeToLogFile(logMessage);
  },
  
  error: (message, error = '') => {
    const errorDetails = error instanceof Error ? error.stack : String(error);
    const logMessage = formatLogMessage('error', message, errorDetails);
    console.error(`\x1b[31m${logMessage}\x1b[0m`); // Red text
    writeToLogFile(logMessage);
  }
};

module.exports = logger;