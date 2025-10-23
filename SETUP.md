# 🛠️ Hilo Setup Guide

Complete setup instructions for developers and users.

---

## 📋 Prerequisites

### 1. Chrome Browser
You need Chrome Canary or Chrome Dev Channel (version 120 or higher):

- **Download Chrome Canary**: https://www.google.com/chrome/canary/
- **Download Chrome Dev**: https://www.google.com/chrome/dev/

Standard Chrome (Stable) does not yet support the Built-in AI APIs.

### 2. Enable Chrome AI Flags

Navigate to `chrome://flags` and enable the following:

| Flag | Setting |
|------|---------|
| `#optimization-guide-on-device-model` | **Enabled** |
| `#prompt-api-for-gemini-nano` | **Enabled** |
| `#summarization-api-for-gemini-nano` | **Enabled** |
| `#translation-api` | **Enabled** |

**Important**: After enabling flags, restart Chrome.

### 3. Download AI Models

Chrome will automatically download the required AI models when first using the APIs. This may take a few minutes and requires an internet connection.

---

## 🚀 Installation Steps

### Option 1: Load Unpacked Extension (Development)

1. **Clone or download this repository**:
   ```bash
   git clone https://github.com/yourusername/hilo.git
   cd hilo
   ```

2. **Open Chrome Extensions page**:
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the switch in the top-right corner

4. **Load the extension**:
   - Click "Load unpacked"
   - Select the `hilo` folder (the one containing `manifest.json`)

5. **Verify installation**:
   - You should see "Hilo" in your extensions list
   - The Hilo icon should appear in your toolbar

### Option 2: Install from .crx File (Coming Soon)

Will be available when published to Chrome Web Store.

---

## ✅ Verification

### Test AI Availability

1. Click the Hilo icon in the toolbar
2. The popup should open without errors
3. Select a CEFR level (A1-C1)
4. Go to any website and select some text
5. Click "Simplify Selection"

If you see an error about Chrome AI not being available:
- Double-check that all flags are enabled
- Restart Chrome completely
- Wait for AI models to download

### Check Console

Open DevTools (F12) and check for any errors:

```javascript
// In the console, type:
console.log(window.ai)

// Should return an object with:
// - languageModel
// - summarizer
// - writer
```

---

## 🎨 Adding Icons (Required)

The extension currently has placeholder icon references. You need to create actual icon files:

### Quick Solution: Use Placeholder Images

Create simple colored squares for testing:

1. Create a simple 128x128 blue square in any image editor
2. Save as `icons/icon128.png`
3. Resize and save as `icon48.png`, `icon32.png`, `icon16.png`

### Professional Solution: Design Icons

Use design tools like:
- Figma (free, web-based)
- Adobe Illustrator
- Sketch
- Canva

**Icon specs**:
- 16x16, 32x32, 48x48, 128x128 pixels
- PNG format with transparent background
- Simple, recognizable design
- Visible at small sizes

**Icon ideas**:
- Mountain peaks (high-low = Hilo)
- Book with simplification arrows
- Letter "H" with learning theme
- Language/education symbols

---

## 🔧 Development Setup

### File Structure Overview

```
hilo/
├── manifest.json         ← Extension config (start here)
├── prompts.js           ← AI prompt templates
├── popup/               ← Main UI
├── content/             ← Page injection scripts
├── background/          ← Service worker
├── options/             ← Settings page
├── scripts/             ← Shared code
├── styles/              ← Shared CSS
└── icons/               ← Extension icons
```

### Making Changes

1. **Edit files** in your code editor
2. **Reload extension**:
   - Go to `chrome://extensions`
   - Click refresh icon on Hilo
3. **Test changes** on a webpage
4. **Check console** for errors (F12)

### Hot Reload Tip

Install an extension reloader for faster development:
- [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid)

---

## 🐛 Troubleshooting

### "Chrome AI not available" Error

**Solutions**:
1. Verify all flags are enabled at `chrome://flags`
2. Restart Chrome completely (quit and relaunch)
3. Check you're using Chrome Canary/Dev, not Stable
4. Wait 5-10 minutes for AI models to download
5. Check internet connection (models download on first use)

### Extension Not Loading

**Solutions**:
1. Check that you selected the correct folder (containing `manifest.json`)
2. Look for errors on `chrome://extensions` page
3. Verify all required files are present
4. Check browser console for errors

### Icons Not Showing

**Solutions**:
1. Create placeholder icon files (see above)
2. Verify icon file names match `manifest.json`
3. Ensure icons are in the `icons/` directory
4. Reload the extension

### Content Script Not Injecting

**Solutions**:
1. Some sites block extension scripts (CSP policies)
2. Try on a simple website (e.g., Wikipedia)
3. Check content script errors in page DevTools
4. Verify permissions in `manifest.json`

### Context Menu Not Appearing

**Solutions**:
1. Check that "Context Menu" is enabled in Settings
2. Make sure text is actually selected
3. Try reloading the extension
4. Check background service worker console for errors

---

## 📊 Testing Checklist

Before considering the extension complete, test:

- [ ] Popup opens without errors
- [ ] Level selection persists
- [ ] Text simplification works
- [ ] Quiz generation works
- [ ] Translation works (if API available)
- [ ] Context menu appears on text selection
- [ ] Options page loads and saves settings
- [ ] Works on different websites
- [ ] Works on YouTube (captions)
- [ ] Icons display correctly
- [ ] No console errors
- [ ] Handles long text (1000+ words)
- [ ] Handles special characters
- [ ] Graceful error handling

---

## 🚢 Publishing (Future)

When ready to publish to Chrome Web Store:

1. **Create high-quality icons**
2. **Add screenshots and promotional images**
3. **Write store description**
4. **Test on multiple websites**
5. **Create privacy policy**
6. **Register Chrome Web Store developer account** ($5 fee)
7. **Submit for review**

Detailed publishing guide: https://developer.chrome.com/docs/webstore/publish/

---

## 📞 Getting Help

If you encounter issues:

1. Check the console (F12) for error messages
2. Review the Chrome AI documentation
3. Open an issue on GitHub
4. Check Chrome AI API status

---

## 🎓 Learning Resources

- **Chrome Extension Development**: https://developer.chrome.com/docs/extensions/
- **Chrome AI APIs**: https://developer.chrome.com/docs/ai
- **JavaScript ES6 Modules**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- **Manifest V3 Migration**: https://developer.chrome.com/docs/extensions/mv3/intro/




