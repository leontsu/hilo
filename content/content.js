/**
 * Content Script - Injected into web pages
 * Handles text selection, YouTube caption detection, and in-page UI
 */

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString();
    sendResponse({ text: selectedText });
  }
  
  if (request.action === 'highlightText') {
    highlightSelectedText();
    sendResponse({ success: true });
  }

  if (request.action === 'showSimplifiedOverlay') {
    showOverlay(request.content, request.type);
    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

// Detect if we're on YouTube
function isYouTubePage() {
  return window.location.hostname.includes('youtube.com');
}

// Get YouTube captions if available
function getYouTubeCaptions() {
  // YouTube caption extraction logic
  const captionElements = document.querySelectorAll('.ytp-caption-segment');
  if (captionElements.length > 0) {
    return Array.from(captionElements)
      .map(el => el.textContent)
      .join(' ');
  }
  return null;
}

// Highlight selected text
function highlightSelectedText() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'hilo-highlight';
    span.style.backgroundColor = '#fef08a';
    span.style.padding = '2px 4px';
    span.style.borderRadius = '2px';
    
    try {
      range.surroundContents(span);
    } catch (e) {
      console.warn('Could not highlight selection:', e);
    }
  }
}

// Show overlay with simplified content
function showOverlay(content, type = 'simplified') {
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

  // Add event listeners
  overlay.querySelector('.hilo-copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(content);
    alert('Copied to clipboard!');
  });

  overlay.querySelectorAll('.hilo-close-btn, .hilo-close-btn-secondary').forEach(btn => {
    btn.addEventListener('click', () => removeOverlay());
  });

  // Close on outside click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      removeOverlay();
    }
  });
}

function removeOverlay() {
  const existing = document.getElementById('hilo-overlay');
  if (existing) {
    existing.remove();
  }
}

// Context menu handler (right-click on selected text)
document.addEventListener('mouseup', (e) => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 0) {
    // Could show a floating button near selection
    // For now, users will use the popup
  }
});

// YouTube-specific initialization
if (isYouTubePage()) {
  console.log('Hilo: YouTube page detected');
  // Add YouTube-specific features here
  // e.g., button to simplify captions
}

console.log('Hilo content script loaded');

