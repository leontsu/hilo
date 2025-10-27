/**
 * Content Script - Injected into web pages
 * Handles text selection, YouTube caption detection, and in-page UI
 */

// Import logger (note: ES modules not supported in content scripts, using dynamic import)
let logger;
(async () => {
  try {
    const { createLogger } = await import(chrome.runtime.getURL('scripts/logger.js'));
    logger = createLogger('Content');
    logger.info('Content script logger initialized');
  } catch (error) {
    console.error('Failed to initialize logger in content script:', error);
    // Fallback logger
    logger = {
      info: (msg, data) => console.log(`[Content] ${msg}`, data || ''),
      debug: (msg, data) => console.debug(`[Content] ${msg}`, data || ''),
      warn: (msg, data) => console.warn(`[Content] ${msg}`, data || ''),
      error: (msg, error) => console.error(`[Content] ${msg}`, error || ''),
      createTryCatchLogger: (operation) => ({
        trySync: (fn) => {
          try {
            return fn();
          } catch (error) {
            console.error(`[Content] ${operation} failed:`, error);
            throw error;
          }
        },
        tryAsync: async (fn) => {
          try {
            return await fn();
          } catch (error) {
            console.error(`[Content] ${operation} failed:`, error);
            throw error;
          }
        }
      })
    };
  }
})();

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const messageLogger = logger?.createTryCatchLogger('Runtime Message') || {
    trySync: (fn) => fn()
  };
  
  messageLogger.trySync(() => {
    logger?.debug('Received runtime message', { action: request.action });
    
    if (request.action === 'getSelectedText') {
      const selectedText = window.getSelection().toString();
      logger?.info('Selected text retrieved', { textLength: selectedText.length });
      sendResponse({ text: selectedText });
      return;
    }
    
    if (request.action === 'highlightText') {
      highlightSelectedText();
      sendResponse({ success: true });
      return;
    }

    if (request.action === 'showSimplifiedOverlay') {
      showOverlay(request.content, request.type);
      sendResponse({ success: true });
      return;
    }

    if (request.action === 'showStatus') {
      showStatusMessage(request.message);
      sendResponse({ success: true });
      return;
    }

    if (request.action === 'showError') {
      showErrorMessage(request.message);
      sendResponse({ success: true });
      return;
    }
    
    logger?.warn('Unknown runtime message action', { action: request.action });
    sendResponse({ error: 'Unknown action' });
  });

  return true; // Keep message channel open for async response
});

// Detect if we're on YouTube
function isYouTubePage() {
  const isYT = window.location.hostname.includes('youtube.com');
  logger?.debug('YouTube page detection', { isYouTube: isYT, hostname: window.location.hostname });
  return isYT;
}

// Get YouTube captions if available
function getYouTubeCaptions() {
  const captionLogger = logger?.createTryCatchLogger('YouTube Caption Extraction') || {
    trySync: (fn) => fn()
  };
  
  return captionLogger.trySync(() => {
    logger?.debug('Extracting YouTube captions');
    
    // YouTube caption extraction logic
    const captionElements = document.querySelectorAll('.ytp-caption-segment');
    logger?.debug('Caption elements found', { count: captionElements.length });
    
    if (captionElements.length > 0) {
      const captions = Array.from(captionElements)
        .map(el => el.textContent)
        .join(' ');
      logger?.info('YouTube captions extracted', { captionLength: captions.length });
      return captions;
    }
    
    logger?.debug('No YouTube captions found');
    return null;
  });
}

// Highlight selected text
function highlightSelectedText() {
  const highlightLogger = logger?.createTryCatchLogger('Text Highlighting') || {
    trySync: (fn) => fn()
  };
  
  highlightLogger.trySync(() => {
    const selection = window.getSelection();
    logger?.debug('Highlighting selected text', { rangeCount: selection.rangeCount });
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'hilo-highlight';
      span.style.backgroundColor = '#fef08a';
      span.style.padding = '2px 4px';
      span.style.borderRadius = '2px';
      
      try {
        range.surroundContents(span);
        logger?.info('Text highlighted successfully');
      } catch (e) {
        logger?.warn('Could not highlight selection', e);
      }
    } else {
      logger?.warn('No text range selected for highlighting');
    }
  });
}

// Show overlay with simplified content
function showOverlay(content, type = 'simplified') {
  const overlayLogger = logger?.createTryCatchLogger('Overlay Display') || {
    trySync: (fn) => fn()
  };
  
  overlayLogger.trySync(() => {
    logger?.info('Showing overlay', { type, contentLength: content?.length });
    
    // Remove existing overlay if present
    removeOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'hilo-overlay';
    overlay.className = 'hilo-overlay';
    
    overlay.innerHTML = `
      <div class="hilo-overlay-content">
        <div class="hilo-overlay-header">
          <h3>${type === 'quiz' ? '📝 Quiz' : type === 'translation' ? '🌐 Translation' : '✨ Simplified Text'}</h3>
          <button class="hilo-close-btn" onclick="this.closest('.hilo-overlay').remove()">✕</button>
        </div>
        <div class="hilo-overlay-body">
          <pre>${content}</pre>
        </div>
        <div class="hilo-overlay-footer">
          <button class="hilo-copy-btn">Copy</button>
          <button class="hilo-close-btn-secondary">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    logger?.debug('Overlay element added to DOM');

    // Add event listeners
    overlay.querySelector('.hilo-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(content)
        .then(() => {
          logger?.debug('Content copied to clipboard');
          alert('Copied to clipboard!');
        })
        .catch(error => {
          logger?.error('Failed to copy to clipboard', error);
          alert('Failed to copy to clipboard');
        });
    });

    overlay.querySelectorAll('.hilo-close-btn, .hilo-close-btn-secondary').forEach(btn => {
      btn.addEventListener('click', () => {
        logger?.debug('Overlay close button clicked');
        removeOverlay();
      });
    });

    // Close on outside click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        logger?.debug('Overlay background clicked, closing');
        removeOverlay();
      }
    });
    
    logger?.info('Overlay displayed successfully');
  });
}

function removeOverlay() {
  const removeLogger = logger?.createTryCatchLogger('Overlay Removal') || {
    trySync: (fn) => fn()
  };
  
  removeLogger.trySync(() => {
    const existing = document.getElementById('hilo-overlay');
    if (existing) {
      existing.remove();
      logger?.debug('Overlay removed from DOM');
    } else {
      logger?.debug('No overlay found to remove');
    }
  });
}

// Show status message
function showStatusMessage(message) {
  logger?.debug('Showing status message', { message });
  // Simple implementation - could be enhanced with a toast notification
  const existingStatus = document.getElementById('hilo-status');
  if (existingStatus) existingStatus.remove();
  
  const statusDiv = document.createElement('div');
  statusDiv.id = 'hilo-status';
  statusDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #007acc; color: white; padding: 10px; border-radius: 5px; z-index: 10000; font-size: 14px;';
  statusDiv.textContent = message;
  document.body.appendChild(statusDiv);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (statusDiv.parentNode) {
      statusDiv.remove();
    }
  }, 3000);
}

// Show error message
function showErrorMessage(message) {
  logger?.error('Showing error message', { message });
  // Simple implementation - could be enhanced with better styling
  const existingError = document.getElementById('hilo-error');
  if (existingError) existingError.remove();
  
  const errorDiv = document.createElement('div');
  errorDiv.id = 'hilo-error';
  errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #dc2626; color: white; padding: 10px; border-radius: 5px; z-index: 10000; font-size: 14px; cursor: pointer;';
  errorDiv.textContent = `Error: ${message}`;
  errorDiv.addEventListener('click', () => errorDiv.remove());
  document.body.appendChild(errorDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

// Context menu handler (right-click on selected text)
document.addEventListener('mouseup', (e) => {
  const selectionLogger = logger?.createTryCatchLogger('Text Selection') || {
    trySync: (fn) => fn()
  };
  
  selectionLogger.trySync(() => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
      logger?.debug('Text selected', { textLength: selectedText.length });
      // Could show a floating button near selection
      // For now, users will use the popup
    }
  });
});

// YouTube-specific initialization
if (isYouTubePage()) {
  logger?.info('YouTube page detected, initializing YouTube features');
  // Add YouTube-specific features here
  // e.g., button to simplify captions
}

// Log when content script is fully loaded
setTimeout(() => {
  logger?.info('Hilo content script fully loaded', {
    url: window.location.href,
    isYouTube: isYouTubePage(),
    timestamp: new Date().toISOString()
  });
}, 100);

