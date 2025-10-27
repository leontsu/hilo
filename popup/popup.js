import { getStoredLevel, setStoredLevel } from '../scripts/storage.js';
import { simplifyText, generateQuiz, translateText } from '../scripts/aiService.js';
import { createLogger } from '../scripts/logger.js';

// Create logger for popup
const logger = createLogger('Popup');

// DOM Elements
const levelSelect = document.getElementById('level-select');
const simplifyBtn = document.getElementById('simplify-btn');
const quizBtn = document.getElementById('quiz-btn');
const translateBtn = document.getElementById('translate-btn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const optionsLink = document.getElementById('options-link');

// Initialize popup
async function init() {
  const initLogger = logger.createTryCatchLogger('Popup Initialization');
  
  await initLogger.tryAsync(async () => {
    logger.info('Initializing popup');
    
    // Load saved level
    const savedLevel = await getStoredLevel();
    if (savedLevel) {
      levelSelect.value = savedLevel;
      logger.debug('Saved level loaded', { level: savedLevel });
    }

    // Save level when changed
    levelSelect.addEventListener('change', async (e) => {
      const changeLogger = logger.createTryCatchLogger('Level Change');
      await changeLogger.tryAsync(async () => {
        await setStoredLevel(e.target.value);
        logger.info('Level saved', { newLevel: e.target.value });
        showStatus('Level saved!', 'success');
      }, 'Failed to save level');
    });

    // Button click handlers
    simplifyBtn.addEventListener('click', handleSimplify);
    quizBtn.addEventListener('click', handleQuiz);
    translateBtn.addEventListener('click', handleTranslate);
    optionsLink.addEventListener('click', openOptions);
    
    logger.debug('Event listeners attached');

    // Check if Chrome AI is available
    await checkAIAvailability();
    
    logger.info('Popup initialization completed');
  }, 'Popup initialization failed');
}

// Get selected text from active tab
async function getSelectedText() {
  const textLogger = logger.createTryCatchLogger('Get Selected Text');
  
  return await textLogger.tryAsync(async () => {
    logger.debug('Getting selected text from active tab');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    logger.debug('Active tab found', { tabId: tab.id, url: tab.url });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });

    const selectedText = results[0].result;
    logger.info('Selected text retrieved', { textLength: selectedText?.length || 0 });
    
    return selectedText;
  }, 'Failed to get selected text');
}

// Handle simplification
async function handleSimplify() {
  const simplifyLogger = logger.createTryCatchLogger('Handle Simplification');
  
  await simplifyLogger.tryAsync(async () => {
    logger.info('Starting text simplification from popup');
    
    showStatus('Getting selected text...', 'info');
    const selectedText = await getSelectedText();
    
    if (!selectedText || selectedText.trim() === '') {
      logger.warn('No text selected for simplification');
      showStatus('Please select some text on the page first!', 'error');
      return;
    }

    showStatus('Simplifying text...', 'info');
    setButtonsDisabled(true);
    
    logger.debug('Starting simplification', { textLength: selectedText.length });

    const level = levelSelect.value;
    const startTime = Date.now();
    const simplified = await simplifyText(level, selectedText);
    const processingTime = Date.now() - startTime;
    
    logger.info('Simplification completed', { processingTime, resultLength: simplified.length });
    
    showResults(simplified);
    showStatus('Text simplified successfully!', 'success');
  }, 'Text simplification failed').finally(() => {
    setButtonsDisabled(false);
  });
}

// Handle quiz generation
async function handleQuiz() {
  const quizLogger = logger.createTryCatchLogger('Handle Quiz Generation');
  
  await quizLogger.tryAsync(async () => {
    logger.info('Starting quiz generation from popup');
    
    showStatus('Getting selected text...', 'info');
    const selectedText = await getSelectedText();
    
    if (!selectedText || selectedText.trim() === '') {
      logger.warn('No text selected for quiz generation');
      showStatus('Please select some text on the page first!', 'error');
      return;
    }

    showStatus('Generating quiz...', 'info');
    setButtonsDisabled(true);
    
    logger.debug('Starting quiz generation', { textLength: selectedText.length });

    const level = levelSelect.value;
    const startTime = Date.now();
    const quiz = await generateQuiz(selectedText, level);
    const processingTime = Date.now() - startTime;
    
    logger.info('Quiz generation completed', { processingTime, resultLength: quiz.length });
    
    showResults(quiz);
    showStatus('Quiz generated successfully!', 'success');
  }, 'Quiz generation failed').finally(() => {
    setButtonsDisabled(false);
  });
}

// Handle translation
async function handleTranslate() {
  const translateLogger = logger.createTryCatchLogger('Handle Translation');
  
  await translateLogger.tryAsync(async () => {
    logger.info('Starting translation from popup');
    
    showStatus('Getting selected text...', 'info');
    const selectedText = await getSelectedText();
    
    if (!selectedText || selectedText.trim() === '') {
      logger.warn('No text selected for translation');
      showStatus('Please select some text on the page first!', 'error');
      return;
    }

    showStatus('Translating text...', 'info');
    setButtonsDisabled(true);
    
    logger.debug('Starting translation', { textLength: selectedText.length });

    // Get target language from settings (default to Spanish for now)
    const targetLang = 'Spanish'; // TODO: Get from storage
    logger.debug('Translation target', { targetLang });
    
    const startTime = Date.now();
    const translation = await translateText(targetLang, selectedText);
    const processingTime = Date.now() - startTime;
    
    logger.info('Translation completed', { processingTime, resultLength: translation.length });
    
    showResults(translation);
    showStatus('Text translated successfully!', 'success');
  }, 'Translation failed').finally(() => {
    setButtonsDisabled(false);
  });
}

// Open options page
function openOptions(e) {
  const optionsLogger = logger.createTryCatchLogger('Open Options');
  
  optionsLogger.trySync(() => {
    e.preventDefault();
    logger.debug('Opening options page');
    chrome.runtime.openOptionsPage();
  }, 'Failed to open options page');
}

// Check if Chrome AI APIs are available
async function checkAIAvailability() {
  const aiCheckLogger = logger.createTryCatchLogger('AI Availability Check');
  
  await aiCheckLogger.tryAsync(async () => {
    logger.debug('Checking AI availability in popup');
    
    // Send message to background script to check AI availability
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkAIAvailability' });
      logger.info('AI availability check response', response);
      
      if (!response.available) {
        logger.warn('Chrome AI not available');
        showStatus('Chrome AI not available. Please enable it in chrome://flags', 'error');
        setButtonsDisabled(true);
      } else {
        logger.info('Chrome AI is available', response.capabilities);
        showStatus('Chrome AI ready!', 'success');
      }
    } catch (error) {
      logger.error('Failed to check AI availability via background script', error);
      // Fallback to local check
      if (!window.ai) {
        showStatus('Chrome AI not available. Please enable it in chrome://flags', 'error');
        setButtonsDisabled(true);
      }
    }
  }, 'AI availability check failed');
}

// UI Helper functions
function showStatus(message, type = 'info') {
  logger?.debug('Showing status', { message, type });
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3000);
  }
}

function showResults(content) {
  logger?.debug('Showing results', { contentLength: content?.length });
  resultsDiv.textContent = content;
  resultsDiv.classList.remove('hidden');
}

function setButtonsDisabled(disabled) {
  logger?.debug('Setting buttons disabled state', { disabled });
  simplifyBtn.disabled = disabled;
  quizBtn.disabled = disabled;
  translateBtn.disabled = disabled;
}

// Initialize when popup opens
logger.info('Popup script loaded, starting initialization');
init().catch(error => {
  logger.error('Popup initialization failed', error);
  showStatus('Initialization failed', 'error');
});

