import { getStoredLevel, setStoredLevel } from '../scripts/storage.js';
import { simplifyText, generateQuiz, translateText } from '../scripts/aiService.js';

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
  // Load saved level
  const savedLevel = await getStoredLevel();
  if (savedLevel) {
    levelSelect.value = savedLevel;
  }

  // Save level when changed
  levelSelect.addEventListener('change', async (e) => {
    await setStoredLevel(e.target.value);
    showStatus('Level saved!', 'success');
  });

  // Button click handlers
  simplifyBtn.addEventListener('click', handleSimplify);
  quizBtn.addEventListener('click', handleQuiz);
  translateBtn.addEventListener('click', handleTranslate);
  optionsLink.addEventListener('click', openOptions);

  // Check if Chrome AI is available
  checkAIAvailability();
}

// Get selected text from active tab
async function getSelectedText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString()
  });

  return results[0].result;
}

// Handle simplification
async function handleSimplify() {
  try {
    showStatus('Getting selected text...', 'info');
    const selectedText = await getSelectedText();
    
    if (!selectedText || selectedText.trim() === '') {
      showStatus('Please select some text on the page first!', 'error');
      return;
    }

    showStatus('Simplifying text...', 'info');
    setButtonsDisabled(true);

    const level = levelSelect.value;
    const simplified = await simplifyText(level, selectedText);
    
    showResults(simplified);
    showStatus('Text simplified successfully!', 'success');
  } catch (error) {
    console.error('Simplification error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    setButtonsDisabled(false);
  }
}

// Handle quiz generation
async function handleQuiz() {
  try {
    showStatus('Getting selected text...', 'info');
    const selectedText = await getSelectedText();
    
    if (!selectedText || selectedText.trim() === '') {
      showStatus('Please select some text on the page first!', 'error');
      return;
    }

    showStatus('Generating quiz...', 'info');
    setButtonsDisabled(true);

    const level = levelSelect.value;
    const quiz = await generateQuiz(selectedText, level);
    
    showResults(quiz);
    showStatus('Quiz generated successfully!', 'success');
  } catch (error) {
    console.error('Quiz generation error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    setButtonsDisabled(false);
  }
}

// Handle translation
async function handleTranslate() {
  try {
    showStatus('Getting selected text...', 'info');
    const selectedText = await getSelectedText();
    
    if (!selectedText || selectedText.trim() === '') {
      showStatus('Please select some text on the page first!', 'error');
      return;
    }

    showStatus('Translating text...', 'info');
    setButtonsDisabled(true);

    // Get target language from settings (default to Spanish for now)
    const targetLang = 'Spanish'; // TODO: Get from storage
    const translation = await translateText(targetLang, selectedText);
    
    showResults(translation);
    showStatus('Text translated successfully!', 'success');
  } catch (error) {
    console.error('Translation error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    setButtonsDisabled(false);
  }
}

// Open options page
function openOptions(e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
}

// Check if Chrome AI APIs are available
async function checkAIAvailability() {
  try {
    if (!window.ai) {
      showStatus('Chrome AI not available. Please enable it in chrome://flags', 'error');
      setButtonsDisabled(true);
    }
  } catch (error) {
    console.error('AI availability check error:', error);
  }
}

// UI Helper functions
function showStatus(message, type = 'info') {
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
  resultsDiv.textContent = content;
  resultsDiv.classList.remove('hidden');
}

function setButtonsDisabled(disabled) {
  simplifyBtn.disabled = disabled;
  quizBtn.disabled = disabled;
  translateBtn.disabled = disabled;
}

// Initialize when popup opens
init();

