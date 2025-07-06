const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

// Custom format for file output (JSON format)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  format.json()
);

// Create the logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'business-snapshots' },
  transports: [
    // Console transport (colorized)
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
      handleExceptions: true
    }),
    
    // Daily rotating file transport (errors)
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/error-%DATE%.log'),
      level: 'error',
      format: fileFormat,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      handleExceptions: true
    }),
    
    // Daily rotating file transport (all logs)
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
      format: fileFormat,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ],
  exitOnError: false
});

// Add a stream for morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Add cron job specific methods
logger.cron = {
  jobStart: (jobName) => {
    logger.info(`🚀 Starting cron job: ${jobName}`);
  },
  jobSuccess: (jobName, metadata = {}) => {
    logger.info(`✅ Cron job completed: ${jobName}`, { ...metadata, event: 'cron_success' });
  },
  jobRetry: (jobName, attempt, maxAttempts, error) => {
    logger.warn(`🔄 Retrying cron job: ${jobName} (attempt ${attempt}/${maxAttempts})`, { 
      error: error.message, 
      stack: error.stack,
      event: 'cron_retry'
    });
  },
  jobFailure: (jobName, error, metadata = {}) => {
    logger.error(`❌ Cron job failed: ${jobName}`, { 
      error: error.message, 
      stack: error.stack,
      ...metadata,
      event: 'cron_failure' 
    });
  },
  coldStart: (delay) => {
    logger.warn(`❄️  Cold start detected. Waiting ${delay}ms before proceeding...`, {
      event: 'cold_start'
    });
  }
};

module.exports = logger;