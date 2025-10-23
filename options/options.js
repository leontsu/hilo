import { 
  getStoredSettings, 
  setStoredSettings 
} from '../scripts/storage.js';

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
  await loadSettings();
  
  // Add save button listener
  saveBtn.addEventListener('click', saveSettings);
}

// Load saved settings
async function loadSettings() {
  try {
    const settings = await getStoredSettings();
    
    // Set level radio
    if (settings.level) {
      const levelRadio = document.querySelector(`input[name="level"][value="${settings.level}"]`);
      if (levelRadio) {
        levelRadio.checked = true;
      }
    }
    
    // Set target language
    if (settings.targetLanguage) {
      targetLanguageSelect.value = settings.targetLanguage;
    }
    
    // Set checkboxes
    if (settings.enableContextMenu !== undefined) {
      enableContextMenuCheckbox.checked = settings.enableContextMenu;
    }
    
    if (settings.autoDetectYouTube !== undefined) {
      autoDetectYouTubeCheckbox.checked = settings.autoDetectYouTube;
    }
    
    if (settings.highlightText !== undefined) {
      highlightTextCheckbox.checked = settings.highlightText;
    }
    
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

// Save settings
async function saveSettings() {
  try {
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
    
    // Save to storage
    await setStoredSettings(settings);
    
    // Show success message
    showStatus('Settings saved successfully!', 'success');
    
    // Notify background script to update context menus
    chrome.runtime.sendMessage({ 
      action: 'updateContextMenus',
      enabled: settings.enableContextMenu
    });
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

// Show status message
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 3000);
}

// Initialize when page loads
init();

