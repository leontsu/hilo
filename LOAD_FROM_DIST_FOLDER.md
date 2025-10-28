# ⚠️ IMPORTANT: Load Extension from dist/ Folder

## Common Mistake

When loading the Hilo extension in Chrome, you **MUST** select the `dist/` folder, not the root project folder.

## Why?

The project has **two manifest files**:

```
hilo/
├── manifest.json          ❌ OLD manifest (points to old files)
├── src/                   (Source code - TypeScript/React)
├── dist/                  ✅ BUILD OUTPUT - Load this!
│   ├── manifest.json      ← Correct manifest
│   ├── assets/            (Compiled JavaScript)
│   └── src/               (Processed HTML/CSS)
```

The `dist/` folder contains the **compiled and bundled** version of the extension that Chrome can actually run.

## Error If You Load Wrong Folder

If you load from the root folder, you'll see errors like:

```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "application/octet-stream"
```

Or:

```
popup.tsx:1 Failed to load module script...
```

This happens because Chrome tries to load `.tsx` source files instead of compiled `.js` files.

## Correct Loading Steps

### 1. Build the Extension
```bash
npm install
npm run build
```

### 2. Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to your project folder
5. **Open the `dist` folder** (double-click to enter it)
6. Click "Select Folder" or "Select"

### 3. Verify It's Correct
In `chrome://extensions/`, check:
- **Name**: "Hilo - Adaptive Translator" (not just "Hilo")
- **Version**: 1.0.0
- **Description**: "Adaptive Translator for the Real Web..."

If it says just "Hilo", you loaded the wrong folder!

## After Every Build

After running `npm run build`, you need to:

1. Go to `chrome://extensions/`
2. Find "Hilo - Adaptive Translator"
3. Click the reload button (🔄)

Or for a complete refresh:
1. Remove the extension
2. Load unpacked from `dist/` again

## Development Mode

For active development with hot reload:

```bash
npm run dev
```

Then load from `dist/` (Vite will automatically update the files in dist/).

---

**Remember**: Always load from `dist/`, never from the root project folder! 🎯

