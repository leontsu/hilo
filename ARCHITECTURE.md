# 🏗️ Hilo Architecture

Technical architecture and design decisions for the Hilo Chrome Extension.

---

## 🎯 Overview

Hilo is built as a Manifest V3 Chrome Extension using vanilla JavaScript (no frameworks) to minimize complexity and maximize performance. It leverages Chrome's experimental Built-in AI APIs for on-device text processing.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
├─────────────┬──────────────────────┬────────────────────────┤
│   Popup     │   Content Script     │   Options Page         │
│   (UI)      │   (Page Injection)   │   (Settings)           │
└──────┬──────┴──────────┬───────────┴──────────┬─────────────┘
       │                 │                      │
       └─────────────────┼──────────────────────┘
                         │
                    ┌────▼────┐
                    │ Background│
                    │  Service  │
                    │  Worker   │
                    └────┬─────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
   ┌───▼───┐      ┌──────▼──────┐   ┌────▼─────┐
   │ Storage│      │   AI APIs   │   │ Scripts  │
   │ Service│      │   Service   │   │  Utils   │
   └────────┘      └─────────────┘   └──────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
         ┌──────▼──────┐     ┌─────▼──────┐
         │ Chrome AI   │     │  Prompts   │
         │   APIs      │     │ Templates  │
         └─────────────┘     └────────────┘
```

---

## 🔧 Component Breakdown

### 1. Popup (`popup/`)

**Purpose**: Main user interface for quick actions

**Files**:
- `popup.html` - UI structure
- `popup.css` - Styling
- `popup.js` - Logic and event handling

**Responsibilities**:
- Display current CEFR level
- Trigger simplification, quiz generation, translation
- Show processing status and results
- Link to options page

**Key Functions**:
- `init()` - Initialize popup state
- `getSelectedText()` - Fetch selected text from active tab
- `handleSimplify()` - Process simplification request
- `handleQuiz()` - Process quiz generation request
- `handleTranslate()` - Process translation request

---

### 2. Content Script (`content/`)

**Purpose**: Injected into web pages to interact with page content

**Files**:
- `content.js` - Page interaction logic
- `content.css` - Injected styles (overlays, highlights)

**Responsibilities**:
- Detect text selection
- Highlight simplified text
- Display overlay with results
- YouTube caption detection
- Handle messages from popup/background

**Key Functions**:
- `isYouTubePage()` - Detect YouTube
- `getYouTubeCaptions()` - Extract captions
- `highlightSelectedText()` - Visual feedback
- `showOverlay()` - Display results modal

**Injection Pattern**:
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle different action types
  if (request.action === 'getSelectedText') {
    sendResponse({ text: window.getSelection().toString() });
  }
});
```

---

### 3. Background Service Worker (`background/`)

**Purpose**: Persistent background process for extension

**Files**:
- `background.js` - Service worker logic

**Responsibilities**:
- Manage extension lifecycle
- Create context menus
- Handle context menu clicks
- Route messages between components
- Initialize AI APIs

**Key Functions**:
- `createContextMenus()` - Setup right-click menu
- `handleContextMenuAction()` - Process context menu clicks
- `checkAIAPIs()` - Verify AI availability
- `initializeAIAPIs()` - Setup AI sessions

**Service Worker Pattern**:
```javascript
chrome.runtime.onInstalled.addListener(async (details) => {
  // Initialize on install
  await setDefaultSettings();
  createContextMenus();
});
```

---

### 4. Options Page (`options/`)

**Purpose**: Full settings and configuration interface

**Files**:
- `options.html` - Settings UI
- `options.css` - Settings styling
- `options.js` - Settings logic

**Responsibilities**:
- CEFR level selection
- Target language configuration
- Feature toggles
- Settings persistence

**Settings Structure**:
```javascript
{
  level: 'B1',                  // Current CEFR level
  targetLanguage: 'Spanish',    // Translation target
  enableContextMenu: true,      // Right-click menu
  autoDetectYouTube: true,     // Auto YouTube detection
  highlightText: false         // Highlight on simplify
}
```

---

### 5. AI Service (`scripts/aiService.js`)

**Purpose**: Wrapper and abstraction layer for Chrome AI APIs

**Key Functions**:

#### `simplifyText(level, text, contentType)`
- Creates language model session
- Builds simplification prompt
- Processes text through AI
- Returns simplified text with vocabulary

#### `generateQuiz(text, level)`
- Creates session for quiz generation
- Uses quiz prompt template
- Returns formatted questions with answers

#### `translateText(targetLang, text)`
- Attempts Chrome Translator API first
- Falls back to Prompt API
- Returns translated text

#### `checkAIAvailability()`
- Checks which AI APIs are available
- Returns capability object

**Error Handling**:
```javascript
try {
  const result = await session.prompt(promptText);
  return result;
} catch (error) {
  // Fallback for development
  return getFallbackResponse();
}
```

---

### 6. Storage Service (`scripts/storage.js`)

**Purpose**: Abstraction layer for Chrome storage APIs

**Storage Types**:
- `chrome.storage.sync` - Settings (synced across devices)
- `chrome.storage.local` - History (local only)

**Key Functions**:
- `getStoredSettings()` / `setStoredSettings()`
- `getStoredLevel()` / `setStoredLevel()`
- `saveToHistory()` / `getHistory()`
- `getSetting()` / `setSetting()`

**Data Flow**:
```
User Action → Options Page → storage.js → chrome.storage.sync
                                              ↓
                                         Synced across devices
                                              ↓
                                        Read by popup.js
```

---

### 7. Utilities (`scripts/utils.js`)

**Purpose**: Shared helper functions

**Categories**:

**Validation**:
- `isValidLevel(level)` - Validate CEFR level
- `getLevelDescription(level)` - Get level name

**Text Processing**:
- `truncateText(text, maxLength)` - Shorten text
- `countWords(text)` - Word count
- `sanitizeText(text)` - Clean HTML/whitespace
- `splitIntoSentences(text)` - Sentence splitting

**Analysis**:
- `calculateComplexity(text)` - Estimate text difficulty
- `suggestLevel(text)` - Suggest appropriate CEFR level
- `estimateReadingTime(text)` - Calculate reading time

**URL Helpers**:
- `isYouTubeURL(url)` - Check if YouTube
- `extractYouTubeVideoId(url)` - Get video ID

---

### 8. Prompt Templates (`prompts.js`)

**Purpose**: AI prompt engineering

**Template Structure**:
```javascript
export const buildXPrompt = (params...) => `
System Role: You are a language learning assistant...

TASK:
- Clear instructions
- Formatting requirements
- Output structure

FORMAT:
[Expected output format]

INPUT:
${userContent}
`;
```

**Available Templates**:
1. `buildSimplificationPrompt(level, text)`
2. `buildQuizPrompt(text, level)`
3. `buildTranslationPrompt(targetLang, text)`
4. `buildContextualSimplificationPrompt(level, text, contentType)`
5. `buildSummaryPrompt(level, text, maxSentences)`

**Design Principles**:
- Clear system role definition
- Explicit task instructions
- Structured output format
- Consistent variable naming
- Human-readable prompts

---

## 🔄 Data Flow

### Simplification Flow

```
1. User selects text on webpage
2. User clicks "Simplify" in popup
   ↓
3. popup.js calls getSelectedText()
   ↓
4. chrome.scripting.executeScript() runs on active tab
   ↓
5. Returns selected text to popup
   ↓
6. popup.js calls aiService.simplifyText(level, text)
   ↓
7. aiService builds prompt using prompts.buildSimplificationPrompt()
   ↓
8. Creates Chrome AI session and sends prompt
   ↓
9. Receives AI response
   ↓
10. Returns simplified text to popup
   ↓
11. popup.js displays result
   ↓
12. (Optional) Save to history via storage.js
```

### Context Menu Flow

```
1. User right-clicks selected text
2. Sees "Hilo - Simplify Text" menu
   ↓
3. Clicks menu item
   ↓
4. background.js receives chrome.contextMenus.onClicked event
   ↓
5. Extracts selected text from info.selectionText
   ↓
6. Processes through AI (same as above)
   ↓
7. Sends result to content script via chrome.tabs.sendMessage()
   ↓
8. content.js receives message
   ↓
9. Shows overlay with result
```

---

## 🎨 Design Patterns

### 1. Module Pattern
All scripts use ES6 modules for clean imports/exports:
```javascript
// aiService.js
export async function simplifyText(level, text) { ... }

// popup.js
import { simplifyText } from '../scripts/aiService.js';
```

### 2. Service Layer Pattern
AI and Storage logic abstracted into service layers:
- `aiService.js` - AI operations
- `storage.js` - Data persistence
- `utils.js` - Helper functions

### 3. Message Passing
Communication between components via Chrome messaging API:
```javascript
// Send from popup
chrome.tabs.sendMessage(tabId, { action: 'showOverlay', content: result });

// Receive in content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showOverlay') {
    showOverlay(request.content);
  }
});
```

### 4. Fallback Pattern
Graceful degradation when AI APIs unavailable:
```javascript
try {
  return await ai.process(text);
} catch (error) {
  return getFallbackResponse(text);
}
```

---

## 🔐 Security Considerations

### Content Security Policy
- No inline scripts (all external .js files)
- No `eval()` or similar
- Strict CSP in manifest

### Permissions
Minimal permissions requested:
- `storage` - Settings only
- `activeTab` - Current tab access only
- `scripting` - Controlled injection
- `aiLanguageModelOriginTrial` - AI access

### Data Privacy
- No external API calls (on-device AI)
- No user data collection
- No analytics or tracking
- Storage limited to user preferences

---

## 🚀 Performance

### Optimization Strategies

1. **Lazy Loading**: AI sessions created on-demand
2. **Session Cleanup**: Destroy AI sessions after use
3. **Storage Efficiency**: Limit history to 50 entries
4. **Minimal DOM**: Lightweight UI components
5. **CSS Variables**: Reusable styling with CSS custom properties

### Resource Usage
- **Memory**: ~10-20MB (typical extension)
- **AI Model**: Downloaded by Chrome (managed automatically)
- **Network**: Zero (after initial model download)

---

## 🧪 Testing Strategy

### Manual Testing
1. Load extension in Chrome Canary
2. Test each feature on various websites
3. Verify AI responses quality
4. Check error handling

### Test Checklist
- [ ] Popup functionality
- [ ] Content script injection
- [ ] Background worker stability
- [ ] Context menu integration
- [ ] Settings persistence
- [ ] AI API calls
- [ ] Error handling
- [ ] YouTube compatibility

### Debugging Tools
- Chrome DevTools (F12)
- Extension service worker inspector
- `chrome://extensions` error console
- Network tab (for model downloads)

---

## 📦 Build & Deploy

### Current State
No build process required - pure JavaScript, no compilation.

### Future Enhancements
Consider adding:
- ESLint for code quality
- Prettier for formatting
- Rollup/Webpack for bundling
- TypeScript for type safety
- Jest for unit testing

### Deployment
1. Test thoroughly
2. Create icons
3. Update version in manifest.json
4. Zip extension directory
5. Submit to Chrome Web Store

---

## 🔮 Future Architecture

### Potential Improvements

1. **State Management**: Consider lightweight state lib (e.g., Zustand)
2. **Build Pipeline**: Add bundler for optimization
3. **TypeScript**: Add type safety
4. **Testing**: Unit tests for core functions
5. **Caching**: Cache AI responses for repeated text
6. **Offline Mode**: Pre-cache common simplifications
7. **Web Workers**: Offload heavy processing

### Scalability
Current architecture scales well to:
- Multiple AI models
- Additional languages
- More features (flashcards, progress tracking)
- Platform expansion (Firefox, Edge)

---

## 📚 Key Technologies

- **Chrome Manifest V3**: Latest extension format
- **ES6+ Modules**: Modern JavaScript
- **Chrome Built-in AI**: Gemini Nano on-device
- **Chrome Storage API**: Synced preferences
- **Chrome Scripting API**: Dynamic injection
- **Web Components**: (Future) Reusable UI

---

This architecture provides a solid foundation for a production-ready language learning Chrome extension! 🚀

