/**
 * Background Service Worker
 * Handles Chrome AI API initialization, context menus, and message routing
 */

import { CEFR_LEVELS } from '../prompts.js';
import { simplifyText, generateQuiz, translateText, checkAIAvailability } from '../scripts/aiService.js';

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Hilo extension installed:', details.reason);

  // Set default settings
  if (details.reason === 'install') {
    await chrome.storage.sync.set({
      level: 'B1',
      targetLanguage: 'Spanish',
      autoDetectYouTube: true,
      enableContextMenu: true
    });
  }

  // Create context menu items
  createContextMenus();
});

// Create right-click context menus
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    // Main menu
    chrome.contextMenus.create({
      id: 'hilo-main',
      title: 'Hilo - Simplify Text',
      contexts: ['selection']
    });

    // Simplify submenu
    chrome.contextMenus.create({
      id: 'hilo-simplify',
      parentId: 'hilo-main',
      title: 'Simplify for my level',
      contexts: ['selection']
    });

    // Quiz submenu
    chrome.contextMenus.create({
      id: 'hilo-quiz',
      parentId: 'hilo-main',
      title: 'Generate quiz',
      contexts: ['selection']
    });

    // Translate submenu
    chrome.contextMenus.create({
      id: 'hilo-translate',
      parentId: 'hilo-main',
      title: 'Translate',
      contexts: ['selection']
    });
  });
}

// Update context menus based on settings
async function updateContextMenusFromSettings() {
  try {
    const settings = await chrome.storage.sync.get(['enableContextMenu']);
    const enableContextMenu = settings.enableContextMenu !== false; // Default to true
    
    if (enableContextMenu) {
      createContextMenus();
    } else {
      chrome.contextMenus.removeAll();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update context menus:', error);
    return { success: false, error: error.message };
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText;

  if (!selectedText) return;

  switch (info.menuItemId) {
    case 'hilo-simplify':
      await handleContextMenuAction(tab.id, 'simplify', selectedText);
      break;
    case 'hilo-quiz':
      await handleContextMenuAction(tab.id, 'quiz', selectedText);
      break;
    case 'hilo-translate':
      await handleContextMenuAction(tab.id, 'translate', selectedText);
      break;
  }
});

// Handle context menu actions
async function handleContextMenuAction(tabId, action, text) {
  try {
    // Get user settings
    const settings = await chrome.storage.sync.get(['level', 'targetLanguage']);
    const level = settings.level || 'B1';
    const targetLanguage = settings.targetLanguage || 'Spanish';

    // Send message to content script to show loading
    chrome.tabs.sendMessage(tabId, {
      action: 'showStatus',
      message: 'Processing...'
    });

    // Process based on action type
    let result;
    switch (action) {
      case 'simplify':
        result = await processSimplification(level, text);
        break;
      case 'quiz':
        result = await processQuiz(text, level);
        break;
      case 'translate':
        result = await processTranslation(targetLanguage, text);
        break;
    }

    // Show result in content script overlay
    chrome.tabs.sendMessage(tabId, {
      action: 'showSimplifiedOverlay',
      content: result,
      type: action
    });

  } catch (error) {
    console.error('Context menu action error:', error);
    chrome.tabs.sendMessage(tabId, {
      action: 'showError',
      message: error.message
    });
  }
}

// AI processing functions using aiService
async function processSimplification(level, text) {
  return await simplifyText(level, text);
}

async function processQuiz(text, level) {
  return await generateQuiz(text, level);
}

async function processTranslation(targetLang, text) {
  return await translateText(targetLang, text);
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'checkAIAvailability') {
    checkAIAvailability().then(sendResponse);
    return true; // Keep channel open
  }

  if (request.action === 'initializeAI') {
    initializeAIAPIs().then(sendResponse);
    return true;
  }

  if (request.action === 'updateContextMenus') {
    updateContextMenusFromSettings().then(sendResponse);
    return true;
  }
});


// Initialize AI APIs
async function initializeAIAPIs() {
  try {
    // This will be implemented when Chrome AI APIs are finalized
    console.log('Initializing Chrome AI APIs...');
    return { success: true };
  } catch (error) {
    console.error('AI initialization failed:', error);
    return { success: false, error: error.message };
  }
}

console.log('Hilo background service worker loaded');

