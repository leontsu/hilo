/**
 * Background Service Worker
 * Handles Chrome AI API initialization, context menus, and message routing
 */

import { CEFR_LEVELS } from '../prompts.js';
import { simplifyText, generateQuiz, translateText, checkAIAvailability } from '../scripts/aiService.js';
import { createLogger } from '../scripts/logger.js';

// Create logger for background script
const logger = createLogger('Background');

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  const installLogger = logger.createTryCatchLogger('Extension Installation');
  
  await installLogger.tryAsync(async () => {
    logger.info('Hilo extension installed', { reason: details.reason });

    // Set default settings
    if (details.reason === 'install') {
      await chrome.storage.sync.set({
        level: 'B1',
        targetLanguage: 'Spanish',
        autoDetectYouTube: true,
        enableContextMenu: true
      });
      logger.info('Default settings initialized');
    }

    // Create context menu items
    createContextMenus();
    logger.info('Extension initialization completed successfully');
  }, 'Failed to initialize extension');
});

// Create right-click context menus
function createContextMenus() {
  const menuLogger = logger.createTryCatchLogger('Context Menu Creation');
  
  menuLogger.trySync(() => {
    logger.debug('Removing existing context menus');
    chrome.contextMenus.removeAll(() => {
      logger.debug('Creating new context menus');
      
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
      
      logger.info('Context menus created successfully');
    });
  }, 'Failed to create context menus');
}

// Update context menus based on settings
async function updateContextMenusFromSettings() {
  const updateLogger = logger.createTryCatchLogger('Context Menu Update');
  
  return await updateLogger.tryAsync(async () => {
    const settings = await chrome.storage.sync.get(['enableContextMenu']);
    const enableContextMenu = settings.enableContextMenu !== false; // Default to true
    
    logger.debug('Updating context menus', { enableContextMenu });
    
    if (enableContextMenu) {
      createContextMenus();
    } else {
      chrome.contextMenus.removeAll();
      logger.info('Context menus disabled by settings');
    }
    
    return { success: true };
  }, 'Failed to update context menus from settings');
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const clickLogger = logger.createTryCatchLogger('Context Menu Click');
  
  await clickLogger.tryAsync(async () => {
    const selectedText = info.selectionText;
    
    logger.debug('Context menu clicked', { 
      menuItemId: info.menuItemId, 
      textLength: selectedText?.length,
      tabId: tab.id 
    });

    if (!selectedText) {
      logger.warn('No text selected for context menu action');
      return;
    }

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
      default:
        logger.warn('Unknown context menu item clicked', { menuItemId: info.menuItemId });
    }
  }, 'Context menu click handling failed');
});

// Handle context menu actions
async function handleContextMenuAction(tabId, action, text) {
  const actionLogger = logger.createTryCatchLogger(`Context Menu Action: ${action}`);
  
  await actionLogger.tryAsync(async () => {
    logger.info('Processing context menu action', { 
      action, 
      textLength: text.length, 
      tabId 
    });
    
    // Get user settings
    const settings = await chrome.storage.sync.get(['level', 'targetLanguage']);
    const level = settings.level || 'B1';
    const targetLanguage = settings.targetLanguage || 'Spanish';
    
    logger.debug('User settings retrieved', { level, targetLanguage });

    // Send message to content script to show loading
    chrome.tabs.sendMessage(tabId, {
      action: 'showStatus',
      message: 'Processing...'
    });
    
    logger.debug('Loading status sent to content script');

    // Process based on action type
    let result;
    const startTime = Date.now();
    
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
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    const processingTime = Date.now() - startTime;
    logger.info('AI processing completed', { 
      action, 
      processingTime, 
      resultLength: result?.length 
    });

    // Show result in content script overlay
    chrome.tabs.sendMessage(tabId, {
      action: 'showSimplifiedOverlay',
      content: result,
      type: action
    });
    
    logger.debug('Result sent to content script');

  }, `Context menu action ${action} failed`);
}

// AI processing functions using aiService
async function processSimplification(level, text) {
  const simplifyLogger = logger.createTryCatchLogger('Text Simplification');
  return await simplifyLogger.tryAsync(async () => {
    logger.debug('Starting text simplification', { level, textLength: text.length });
    const result = await simplifyText(level, text);
    logger.info('Text simplification completed successfully');
    return result;
  }, 'Text simplification failed');
}

async function processQuiz(text, level) {
  const quizLogger = logger.createTryCatchLogger('Quiz Generation');
  return await quizLogger.tryAsync(async () => {
    logger.debug('Starting quiz generation', { level, textLength: text.length });
    const result = await generateQuiz(text, level);
    logger.info('Quiz generation completed successfully');
    return result;
  }, 'Quiz generation failed');
}

async function processTranslation(targetLang, text) {
  const translateLogger = logger.createTryCatchLogger('Translation');
  return await translateLogger.tryAsync(async () => {
    logger.debug('Starting translation', { targetLang, textLength: text.length });
    const result = await translateText(targetLang, text);
    logger.info('Translation completed successfully');
    return result;
  }, 'Translation failed');
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const messageLogger = logger.createTryCatchLogger('Runtime Message');
  
  messageLogger.trySync(() => {
    logger.debug('Received runtime message', { action: request.action });
    
    if (request.action === 'checkAIAvailability') {
      checkAIAvailability()
        .then(result => {
          logger.debug('AI availability check completed', result);
          sendResponse(result);
        })
        .catch(error => {
          logger.error('AI availability check failed', error);
          sendResponse({ available: false, error: error.message });
        });
      return true; // Keep channel open
    }

    if (request.action === 'initializeAI') {
      initializeAIAPIs()
        .then(result => {
          logger.debug('AI initialization completed', result);
          sendResponse(result);
        })
        .catch(error => {
          logger.error('AI initialization failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    if (request.action === 'updateContextMenus') {
      updateContextMenusFromSettings()
        .then(result => {
          logger.debug('Context menus update completed', result);
          sendResponse(result);
        })
        .catch(error => {
          logger.error('Context menus update failed', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
    
    logger.warn('Unknown runtime message action', { action: request.action });
    sendResponse({ error: 'Unknown action' });
  }, 'Runtime message handling failed');
});


// Initialize AI APIs
async function initializeAIAPIs() {
  const initLogger = logger.createTryCatchLogger('AI API Initialization');
  
  return await initLogger.tryAsync(async () => {
    logger.info('Initializing Chrome AI APIs...');
    
    // Check AI availability first
    const availability = await checkAIAvailability();
    logger.info('AI API availability checked', availability);
    
    // This will be expanded when Chrome AI APIs are finalized
    logger.debug('AI API initialization completed (placeholder)');
    return { success: true, availability };
  }, 'AI API initialization failed');
}

logger.info('Hilo background service worker loaded', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent
});

