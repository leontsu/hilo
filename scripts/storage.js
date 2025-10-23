/**
 * Storage Service - Wrapper for chrome.storage API
 * Handles all extension settings and user preferences
 */

// Default settings
const DEFAULT_SETTINGS = {
  level: 'B1',
  targetLanguage: 'Spanish',
  enableContextMenu: true,
  autoDetectYouTube: true,
  highlightText: false
};

/**
 * Get all stored settings
 * @returns {Promise<Object>} Settings object
 */
export async function getStoredSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return result;
  } catch (error) {
    console.error('Error getting stored settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Set all settings
 * @param {Object} settings - Settings object to save
 * @returns {Promise<void>}
 */
export async function setStoredSettings(settings) {
  try {
    await chrome.storage.sync.set(settings);
  } catch (error) {
    console.error('Error setting stored settings:', error);
    throw error;
  }
}

/**
 * Get stored CEFR level
 * @returns {Promise<string>} CEFR level (A1, A2, B1, B2, C1)
 */
export async function getStoredLevel() {
  try {
    const result = await chrome.storage.sync.get('level');
    return result.level || DEFAULT_SETTINGS.level;
  } catch (error) {
    console.error('Error getting stored level:', error);
    return DEFAULT_SETTINGS.level;
  }
}

/**
 * Set CEFR level
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1)
 * @returns {Promise<void>}
 */
export async function setStoredLevel(level) {
  try {
    await chrome.storage.sync.set({ level });
  } catch (error) {
    console.error('Error setting stored level:', error);
    throw error;
  }
}

/**
 * Get stored target language
 * @returns {Promise<string>} Target language name
 */
export async function getStoredTargetLanguage() {
  try {
    const result = await chrome.storage.sync.get('targetLanguage');
    return result.targetLanguage || DEFAULT_SETTINGS.targetLanguage;
  } catch (error) {
    console.error('Error getting stored target language:', error);
    return DEFAULT_SETTINGS.targetLanguage;
  }
}

/**
 * Set target language
 * @param {string} language - Target language name
 * @returns {Promise<void>}
 */
export async function setStoredTargetLanguage(language) {
  try {
    await chrome.storage.sync.set({ targetLanguage: language });
  } catch (error) {
    console.error('Error setting stored target language:', error);
    throw error;
  }
}

/**
 * Get specific setting
 * @param {string} key - Setting key
 * @param {*} defaultValue - Default value if not found
 * @returns {Promise<*>} Setting value
 */
export async function getSetting(key, defaultValue = null) {
  try {
    const result = await chrome.storage.sync.get(key);
    return result[key] !== undefined ? result[key] : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Set specific setting
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}

/**
 * Clear all stored settings (reset to defaults)
 * @returns {Promise<void>}
 */
export async function clearAllSettings() {
  try {
    await chrome.storage.sync.clear();
  } catch (error) {
    console.error('Error clearing settings:', error);
    throw error;
  }
}

/**
 * Listen for storage changes
 * @param {Function} callback - Callback function (changes, areaName)
 */
export function onStorageChanged(callback) {
  chrome.storage.onChanged.addListener(callback);
}

/**
 * Save simplified text to history (local storage)
 * @param {Object} entry - History entry { original, simplified, level, timestamp }
 * @returns {Promise<void>}
 */
export async function saveToHistory(entry) {
  try {
    const result = await chrome.storage.local.get('history');
    const history = result.history || [];
    
    // Add timestamp if not present
    if (!entry.timestamp) {
      entry.timestamp = Date.now();
    }
    
    // Add to beginning of array
    history.unshift(entry);
    
    // Keep only last 50 entries
    const trimmedHistory = history.slice(0, 50);
    
    await chrome.storage.local.set({ history: trimmedHistory });
  } catch (error) {
    console.error('Error saving to history:', error);
    throw error;
  }
}

/**
 * Get simplification history
 * @param {number} limit - Maximum number of entries to return
 * @returns {Promise<Array>} Array of history entries
 */
export async function getHistory(limit = 50) {
  try {
    const result = await chrome.storage.local.get('history');
    const history = result.history || [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}

/**
 * Clear history
 * @returns {Promise<void>}
 */
export async function clearHistory() {
  try {
    await chrome.storage.local.remove('history');
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
}

