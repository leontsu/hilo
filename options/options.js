import { 
  getStoredSettings, 
  setStoredSettings 
} from '../scripts/storage.js';
import { createLogger } from '../scripts/logger.js';

// Create logger for options page
const logger = createLogger('Options');

// DOM Elements
const levelRadios = document.querySelectorAll('input[name="level"]');
const targetLanguageSelect = document.getElementById('target-language');
const enableContextMenuCheckbox = document.getElementById('enable-context-menu');
const autoDetectYouTubeCheckbox = document.getElementById('auto-detect-youtube');
const highlightTextCheckbox = document.getElementById('highlight-text');
const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');

// Initialize options page
async function init() {
  const initLogger = logger.createTryCatchLogger('Options Initialization');
  
  await initLogger.tryAsync(async () => {
    logger.info('Initializing options page');
    
    await loadSettings();
    
    // Add save button listener
    saveBtn.addEventListener('click', saveSettings);
    
    logger.debug('Save button listener attached');
    logger.info('Options page initialization completed');
  }, 'Options page initialization failed');
}

// Load saved settings
async function loadSettings() {
  const loadLogger = logger.createTryCatchLogger('Load Settings');
  
  await loadLogger.tryAsync(async () => {
    logger.debug('Loading saved settings');
    
    const settings = await getStoredSettings();
    logger.info('Settings loaded from storage', settings);
    
    // Set level radio
    if (settings.level) {
      const levelRadio = document.querySelector(`input[name="level"][value="${settings.level}"]`);
      if (levelRadio) {
        levelRadio.checked = true;
        logger.debug('Level radio set', { level: settings.level });
      }
    }
    
    // Set target language
    if (settings.targetLanguage) {
      targetLanguageSelect.value = settings.targetLanguage;
      logger.debug('Target language set', { language: settings.targetLanguage });
    }
    
    // Set checkboxes
    if (settings.enableContextMenu !== undefined) {
      enableContextMenuCheckbox.checked = settings.enableContextMenu;
      logger.debug('Context menu checkbox set', { enabled: settings.enableContextMenu });
    }
    
    if (settings.autoDetectYouTube !== undefined) {
      autoDetectYouTubeCheckbox.checked = settings.autoDetectYouTube;
      logger.debug('YouTube auto-detect checkbox set', { enabled: settings.autoDetectYouTube });
    }
    
    if (settings.highlightText !== undefined) {
      highlightTextCheckbox.checked = settings.highlightText;
      logger.debug('Highlight text checkbox set', { enabled: settings.highlightText });
    }
    
    logger.info('All settings UI updated successfully');
    
  }, 'Failed to load settings');
}

// Save settings
async function saveSettings() {
  const saveLogger = logger.createTryCatchLogger('Save Settings');
  
  await saveLogger.tryAsync(async () => {
    logger.info('Starting settings save');
    
    // Get selected level
    const selectedLevel = document.querySelector('input[name="level"]:checked');
    const level = selectedLevel ? selectedLevel.value : 'B1';
    
    // Build settings object
    const settings = {
      level,
      targetLanguage: targetLanguageSelect.value,
      enableContextMenu: enableContextMenuCheckbox.checked,
      autoDetectYouTube: autoDetectYouTubeCheckbox.checked,
      highlightText: highlightTextCheckbox.checked
    };
    
    logger.debug('Settings to save', settings);
    
    // Save to storage
    await setStoredSettings(settings);
    logger.info('Settings saved to storage successfully');
    
    // Show success message
    showStatus('Settings saved successfully!', 'success');
    
    // Notify background script to update context menus
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'updateContextMenus',
        enabled: settings.enableContextMenu
      });
      logger.debug('Context menu update response', response);
    } catch (error) {
      logger.warn('Failed to notify background script about context menu update', error);
      // Don't fail the entire save operation for this
    }
    
    logger.info('Settings save completed successfully');
    
  }, 'Failed to save settings');
}

// Show status message
function showStatus(message, type = 'success') {
  logger?.debug('Showing status message', { message, type });
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 3000);
}

// Initialize when page loads
logger.info('Options script loaded, starting initialization');
init().catch(error => {
  logger.error('Options page initialization failed', error);
  showStatus('Initialization failed', 'error');
});

