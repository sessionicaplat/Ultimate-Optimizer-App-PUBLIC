/**
 * Structured logging utility with configurable log levels
 * 
 * Log Levels:
 * 0 = ERROR   - Only errors
 * 1 = WARN    - Errors + warnings
 * 2 = INFO    - Errors + warnings + info (production default)
 * 3 = DEBUG   - Errors + warnings + info + debug (development default)
 * 4 = TRACE   - Everything (verbose debugging)
 * 
 * Usage:
 * - Production: LOG_LEVEL=2 (INFO)
 * - Development: LOG_LEVEL=3 (DEBUG)
 * - Debugging: LOG_LEVEL=4 (TRACE)
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// Determine current log level from environment
const getCurrentLevel = (): LogLevel => {
  // Check explicit LOG_LEVEL environment variable
  if (process.env.LOG_LEVEL) {
    const level = parseInt(process.env.LOG_LEVEL, 10);
    if (!isNaN(level) && level >= 0 && level <= 4) {
      return level;
    }
  }
  
  // Default based on NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return LogLevel.INFO; // Production: INFO level (clean logs)
  } else if (process.env.NODE_ENV === 'test') {
    return LogLevel.ERROR; // Test: ERROR only
  } else {
    return LogLevel.DEBUG; // Development: DEBUG level
  }
};

const currentLevel = getCurrentLevel();

/**
 * Structured logger with level-based filtering
 */
export const logger = {
  /**
   * ERROR: Critical errors that need immediate attention
   * Always logged in all environments
   */
  error: (...args: any[]) => {
    if (currentLevel >= LogLevel.ERROR) {
      console.error(...args);
    }
  },

  /**
   * WARN: Warning messages for potential issues
   * Logged in WARN level and above
   */
  warn: (...args: any[]) => {
    if (currentLevel >= LogLevel.WARN) {
      console.warn(...args);
    }
  },

  /**
   * INFO: Important informational messages
   * Logged in INFO level and above (production default)
   */
  info: (...args: any[]) => {
    if (currentLevel >= LogLevel.INFO) {
      console.log(...args);
    }
  },

  /**
   * DEBUG: Detailed debugging information
   * Logged in DEBUG level and above (development default)
   */
  debug: (...args: any[]) => {
    if (currentLevel >= LogLevel.DEBUG) {
      console.log(...args);
    }
  },

  /**
   * TRACE: Very detailed trace information
   * Only logged in TRACE level (verbose debugging)
   */
  trace: (...args: any[]) => {
    if (currentLevel >= LogLevel.TRACE) {
      console.log(...args);
    }
  },

  /**
   * Get current log level
   */
  getLevel: (): LogLevel => currentLevel,

  /**
   * Get log level name
   */
  getLevelName: (): string => {
    return LogLevel[currentLevel];
  }
};

// Log the current log level on startup
if (currentLevel >= LogLevel.INFO) {
  console.log(`[Logger] Log level: ${logger.getLevelName()} (${currentLevel})`);
}

export default logger;
