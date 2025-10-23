# 🎓 Hilo - Language Learning Chrome Extension

**Simplify. Learn. Grow.**

Hilo is a Chrome Extension that simplifies website text and YouTube captions based on your language learning level (A1–C1 CEFR scale), powered by Chrome's Built-in AI APIs.

---

## 📋 Features

- **Text Simplification** - Rewrite complex text to match your proficiency level
- **Quiz Generation** - Create comprehension exercises from any text
- **Translation** - Translate simplified text to your native language
- **YouTube Support** - Simplify YouTube captions on-the-fly
- **Context Menu Integration** - Right-click any selected text to simplify
- **CEFR Level Support** - A1 (Beginner) through C1 (Advanced)
- **Chrome AI Powered** - Uses Chrome's Built-in Prompt, Summarizer, Writer, and Translator APIs

---

## 🚀 Quick Start

### Prerequisites

1. **Chrome Canary or Dev Channel** (v120+)
2. **Enable Chrome AI flags** at `chrome://flags`:
   - `#optimization-guide-on-device-model` - Enabled
   - `#prompt-api-for-gemini-nano` - Enabled
   - `#summarization-api-for-gemini-nano` - Enabled
   - `#translation-api` - Enabled

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/hilo.git
   cd hilo
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked** and select the `hilo` directory

5. The Hilo extension should now appear in your extensions toolbar

---

## 📁 Project Structure

```
hilo/
├── manifest.json              # Extension configuration
├── prompts.js                 # AI prompt templates
├── README.md                  # This file
│
├── popup/                     # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
├── content/                   # Content scripts (injected into pages)
│   ├── content.js
│   └── content.css
│
├── background/                # Service worker
│   └── background.js
│
├── options/                   # Settings page
│   ├── options.html
│   ├── options.css
│   └── options.js
│
├── scripts/                   # Shared utilities
│   ├── aiService.js          # Chrome AI API wrapper
│   ├── storage.js            # chrome.storage wrapper
│   └── utils.js              # Helper functions
│
├── styles/                    # Shared styles
│   └── common.css
│
└── icons/                     # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## 🎯 Usage

### Basic Workflow

1. **Set Your Level**: Click the Hilo icon and select your CEFR level (A1-C1)

2. **Select Text**: Highlight any text on a webpage

3. **Simplify**:
   - Click the Hilo icon → "Simplify Selection"
   - OR right-click → "Hilo - Simplify Text"

4. **Generate Quiz**: After simplifying, click "Generate Quiz" to test comprehension

5. **Translate**: Click "Translate" to see the text in your native language

### YouTube Captions

1. Open any YouTube video with captions
2. Select caption text
3. Use Hilo to simplify at your level

### Settings

Access settings by clicking ⚙️ in the popup or via `chrome://extensions` → Hilo → Options

Configure:
- Default learning level
- Target translation language
- Context menu options
- YouTube auto-detection

---

## 🧪 Chrome AI APIs Used

### Prompt API
```javascript
const session = await ai.languageModel.create({
  systemPrompt: 'You are a language learning assistant...',
  temperature: 0.7
});
const result = await session.prompt(promptText);
```

### Summarizer API
```javascript
const summarizer = await ai.summarizer.create({
  type: 'tl;dr',
  format: 'plain-text',
  length: 'short'
});
const summary = await summarizer.summarize(text);
```

### Translator API
```javascript
const translator = await translation.createTranslator({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});
const result = await translator.translate(text);
```

---

## 🛠️ Development

### Tech Stack

- **Manifest V3** - Latest Chrome Extension format
- **Vanilla JavaScript** - No frameworks, pure ES6+ modules
- **CSS3** - Modern styling with CSS variables
- **Chrome Built-in AI** - On-device AI processing

### Key Files

#### `prompts.js`
Contains all AI prompt templates:
- `buildSimplificationPrompt(level, text)`
- `buildQuizPrompt(text, level)`
- `buildTranslationPrompt(targetLang, text)`
- `buildContextualSimplificationPrompt(level, text, contentType)`
- `buildSummaryPrompt(level, text, maxSentences)`

#### `scripts/aiService.js`
Wrapper for Chrome AI APIs:
- `simplifyText(level, text, contentType)`
- `generateQuiz(text, level)`
- `translateText(targetLang, text)`
- `summarizeText(level, text, maxSentences)`
- `checkAIAvailability()`

#### `scripts/storage.js`
Chrome storage management:
- `getStoredSettings()` / `setStoredSettings(settings)`
- `getStoredLevel()` / `setStoredLevel(level)`
- `saveToHistory(entry)` / `getHistory(limit)`

### Testing

1. Make changes to source files
2. Go to `chrome://extensions`
3. Click the refresh icon on Hilo extension
4. Test on various websites

### Debugging

- **Popup**: Right-click popup → Inspect
- **Content Script**: F12 on any webpage → Console
- **Background Script**: `chrome://extensions` → Hilo → Inspect views: service worker

---

## 🎨 CEFR Levels

| Level | Description | Text Characteristics |
|-------|-------------|---------------------|
| **A1** | Beginner | Very simple words, short sentences, present tense |
| **A2** | Elementary | Basic vocabulary, simple grammar, common topics |
| **B1** | Intermediate | Everyday vocabulary, clear structure, past/future tenses |
| **B2** | Upper Intermediate | Abstract concepts, complex sentences, varied vocabulary |
| **C1** | Advanced | Sophisticated language, nuanced meaning, idioms |

---

## 📝 Prompt Template Guide

### Simplification Prompt Structure

```javascript
export const buildSimplificationPrompt = (level, text) => `
You are a language learning assistant...

TASK:
- Rewrite for ${level} CEFR level
- Keep original meaning
- Simplify vocabulary and grammar

FORMAT:
[Simplified Text]

---
VOCABULARY:
• word (part of speech): definition
  Example: [example sentence]

ORIGINAL TEXT:
${text}
`;
```

### Customizing Prompts

Edit `prompts.js` to adjust:
- System prompts and instructions
- Output formatting
- Vocabulary list size
- Example sentence style

---

## 🔧 Configuration

### manifest.json

Key permissions:
- `storage` - Save user preferences
- `activeTab` - Access current tab content
- `scripting` - Inject content scripts
- `aiLanguageModelOriginTrial` - Chrome AI API access

### Storage Schema

```javascript
{
  level: 'B1',                    // CEFR level
  targetLanguage: 'Spanish',      // Translation target
  enableContextMenu: true,        // Right-click menu
  autoDetectYouTube: true,       // Auto-detect YT captions
  highlightText: false           // Highlight on simplify
}
```

---

## 🚧 Roadmap

- [ ] Add icon assets (16x16, 32x32, 48x48, 128x128)
- [ ] Implement vocabulary flashcard system
- [ ] Add progress tracking and statistics
- [ ] Support more content types (PDFs, ebooks)
- [ ] Multi-language UI support
- [ ] Export simplified text to notes
- [ ] Integration with popular language learning platforms
- [ ] Offline mode with cached AI models

---

## 🐛 Known Issues

- Chrome AI APIs are experimental and may change
- Some websites block content script injection (CSP policies)
- YouTube caption detection needs refinement
- AI responses may vary in quality

---

## 📚 Resources

- [Chrome AI API Documentation](https://developer.chrome.com/docs/ai)
- [CEFR Framework Overview](https://www.coe.int/en/web/common-european-framework-reference-languages)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Built-in AI Origin Trial](https://developer.chrome.com/origintrials/#/view_trial/2971021707933343745)

---

## 🤝 Contributing

Contributions welcome! Please feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use, modify, and distribute.

---

## 👤 Author

Built with ❤️ for language learners everywhere.

---

## 🙏 Acknowledgments

- Chrome AI Team for the incredible Built-in AI APIs
- Language learning community for inspiration
- All contributors and testers

---

**Happy Learning! 📚✨**
