/**
 * Centralized Logging System for Hilo Extension
 * Provides structured logging with different levels and context
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Configuration - can be changed based on environment
const LOG_CONFIG = {
  level: LOG_LEVELS.DEBUG, // Show all logs in development
  enableStorage: true, // Store logs in chrome.storage for debugging
  maxStoredLogs: 100, // Maximum number of logs to store
  enableConsole: true // Output to console
};

/**
 * Logger class with context and structured logging
 */
class Logger {
  constructor(context = 'Unknown') {
    this.context = context;
  }

  /**
   * Log an error with full context
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or additional data
   * @param {Object} metadata - Additional metadata
   */
  error(message, error = null, metadata = {}) {
    this._log(LOG_LEVELS.ERROR, message, error, metadata);
  }

  /**
   * Log a warning
   * @param {string} message - Warning message
   * @param {Object} data - Additional data
   * @param {Object} metadata - Additional metadata
   */
  warn(message, data = null, metadata = {}) {
    this._log(LOG_LEVELS.WARN, message, data, metadata);
  }

  /**
   * Log information
   * @param {string} message - Info message
   * @param {Object} data - Additional data
   * @param {Object} metadata - Additional metadata
   */
  info(message, data = null, metadata = {}) {
    this._log(LOG_LEVELS.INFO, message, data, metadata);
  }

  /**
   * Log debug information
   * @param {string} message - Debug message
   * @param {Object} data - Additional data
   * @param {Object} metadata - Additional metadata
   */
  debug(message, data = null, metadata = {}) {
    this._log(LOG_LEVELS.DEBUG, message, data, metadata);
  }

  /**
   * Internal logging method
   * @private
   */
  _log(level, message, data, metadata) {
    if (level > LOG_CONFIG.level) return;

    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LOG_LEVELS)[level];
    
    const logEntry = {
      timestamp,
      level: levelName,
      context: this.context,
      message,
      data: this._sanitizeData(data),
      metadata,
      userAgent: navigator.userAgent,
      url: typeof window !== 'undefined' ? window.location?.href : 'background'
    };

    // Console output
    if (LOG_CONFIG.enableConsole) {
      this._consoleOutput(level, logEntry);
    }

    // Storage (async, don't wait)
    if (LOG_CONFIG.enableStorage) {
      this._storeLog(logEntry).catch(err => {
        console.error('Failed to store log:', err);
      });
    }
  }

  /**
   * Output to console with appropriate styling
   * @private
   */
  _consoleOutput(level, logEntry) {
    const { timestamp, level: levelName, context, message, data } = logEntry;
    const timeStr = timestamp.split('T')[1].split('.')[0];
    const prefix = `[${timeStr}] [${levelName}] [${context}]`;

    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(`%c${prefix} ${message}`, 'color: #ff4444; font-weight: bold;', data);
        break;
      case LOG_LEVELS.WARN:
        console.warn(`%c${prefix} ${message}`, 'color: #ffaa00; font-weight: bold;', data);
        break;
      case LOG_LEVELS.INFO:
        console.info(`%c${prefix} ${message}`, 'color: #4444ff; font-weight: bold;', data);
        break;
      case LOG_LEVELS.DEBUG:
        console.log(`%c${prefix} ${message}`, 'color: #888888;', data);
        break;
    }
  }

  /**
   * Store log entry in chrome.storage for debugging
   * @private
   */
  async _storeLog(logEntry) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) return;

      const { logs = [] } = await chrome.storage.local.get(['logs']);
      
      // Add new log and maintain size limit
      logs.push(logEntry);
      if (logs.length > LOG_CONFIG.maxStoredLogs) {
        logs.splice(0, logs.length - LOG_CONFIG.maxStoredLogs);
      }

      await chrome.storage.local.set({ logs });
    } catch (error) {
      // Silent fail for storage issues
    }
  }

  /**
   * Sanitize data to prevent circular references and sensitive info
   * @private
   */
  _sanitizeData(data) {
    if (!data) return null;

    try {
      // Handle Error objects
      if (data instanceof Error) {
        return {
          name: data.name,
          message: data.message,
          stack: data.stack,
          cause: data.cause
        };
      }

      // Deep clone and sanitize
      const sanitized = JSON.parse(JSON.stringify(data, (key, value) => {
        // Remove potential sensitive keys
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
          return '[REDACTED]';
        }
        return value;
      }));

      return sanitized;
    } catch (error) {
      return { error: 'Failed to sanitize data', original: String(data) };
    }
  }

  /**
   * Create a logger for try-catch blocks with automatic error logging
   * @param {string} operation - Operation name being performed
   * @returns {Object} Object with tryAsync and trySync methods
   */
  createTryCatchLogger(operation) {
    return {
      /**
       * Wrapper for async operations with automatic error logging
       * @param {Function} asyncFn - Async function to execute
       * @param {string} fallbackMessage - Message to show on error
       * @returns {Promise} Result or throws with logged error
       */
      tryAsync: async (asyncFn, fallbackMessage = 'Operation failed') => {
        try {
          this.debug(`Starting ${operation}`);
          const result = await asyncFn();
          this.debug(`Completed ${operation} successfully`);
          return result;
        } catch (error) {
          this.error(`${operation} failed`, error, { operation, fallbackMessage });
          throw error;
        }
      },

      /**
       * Wrapper for sync operations with automatic error logging
       * @param {Function} syncFn - Sync function to execute
       * @param {string} fallbackMessage - Message to show on error
       * @returns {*} Result or throws with logged error
       */
      trySync: (syncFn, fallbackMessage = 'Operation failed') => {
        try {
          this.debug(`Starting ${operation}`);
          const result = syncFn();
          this.debug(`Completed ${operation} successfully`);
          return result;
        } catch (error) {
          this.error(`${operation} failed`, error, { operation, fallbackMessage });
          throw error;
        }
      }
    };
  }
}

/**
 * Utility functions for log management
 */
export const LogUtils = {
  /**
   * Get all stored logs
   * @returns {Promise<Array>} Array of log entries
   */
  async getLogs() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) return [];
      const { logs = [] } = await chrome.storage.local.get(['logs']);
      return logs;
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  },

  /**
   * Clear all stored logs
   * @returns {Promise<boolean>} Success status
   */
  async clearLogs() {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) return false;
      await chrome.storage.local.remove(['logs']);
      return true;
    } catch (error) {
      console.error('Failed to clear logs:', error);
      return false;
    }
  },

  /**
   * Export logs as JSON string
   * @returns {Promise<string>} JSON string of logs
   */
  async exportLogs() {
    try {
      const logs = await this.getLogs();
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Failed to export logs:', error);
      return '[]';
    }
  },

  /**
   * Get logs filtered by level and context
   * @param {string} level - Log level to filter by
   * @param {string} context - Context to filter by
   * @returns {Promise<Array>} Filtered logs
   */
  async getFilteredLogs(level = null, context = null) {
    try {
      const logs = await this.getLogs();
      return logs.filter(log => {
        if (level && log.level !== level) return false;
        if (context && log.context !== context) return false;
        return true;
      });
    } catch (error) {
      console.error('Failed to get filtered logs:', error);
      return [];
    }
  }
};

/**
 * Create a logger instance
 * @param {string} context - Context name (e.g., 'Background', 'Content', 'Popup')
 * @returns {Logger} Logger instance
 */
export function createLogger(context) {
  return new Logger(context);
}

/**
 * Set global log level
 * @param {string} level - Log level ('ERROR', 'WARN', 'INFO', 'DEBUG')
 */
export function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    LOG_CONFIG.level = LOG_LEVELS[level];
  }
}

/**
 * Enable/disable log storage
 * @param {boolean} enabled - Whether to store logs
 */
export function setLogStorage(enabled) {
  LOG_CONFIG.enableStorage = enabled;
}

// Export default logger for backward compatibility
export const logger = createLogger('Global');

// Export log levels for external use
export { LOG_LEVELS };