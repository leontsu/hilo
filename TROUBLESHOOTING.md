# Troubleshooting Guide

## Popup Not Showing / Showing Old Version After Build

If the popup shows as a tiny box or displays an old version even after running `npm run build`, this is a Chrome extension caching issue.

### MIME Type Error

If you see an error like:
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"
```

**This was fixed in the latest commit** (added `base: './'` to vite.config.ts). 

Solution:
1. Pull the latest code: `git pull`
2. Rebuild: `npm run build`
3. Completely remove and reload the extension (see Method 1 below)

### Solution: Hard Reload the Extension

**Method 1: Remove and Reload (Recommended)**

1. Go to `chrome://extensions/`
2. Find "Hilo - Adaptive Translator"
3. Click **"Remove"** (don't worry, settings are preserved in Chrome storage)
4. Click **"Load unpacked"**
5. Select the `dist` folder again
6. The popup should now show correctly

**Method 2: Reload Multiple Times**

1. Go to `chrome://extensions/`
2. Find "Hilo - Adaptive Translator"
3. Click the **reload icon** (🔄)
4. Close any open popups
5. Wait 2-3 seconds
6. Click the reload icon **again**
7. Try opening the popup

**Method 3: Clear Extension Data**

1. Go to `chrome://extensions/`
2. Find "Hilo - Adaptive Translator"
3. Right-click the extension and select "Inspect popup"
4. In DevTools, go to Application tab → Storage
5. Click "Clear site data"
6. Close DevTools
7. Go back to `chrome://extensions/` and reload the extension

**Method 4: Chrome Cache Clear**

1. Open Chrome DevTools (F12)
2. Right-click the reload button in DevTools
3. Select "Empty Cache and Hard Reload"
4. Then go to `chrome://extensions/` and reload the extension

### Verification Steps

After reloading, verify the extension is working:

1. Click the Hilo icon in the toolbar
2. You should see:
   - Blue header with "Hilo" text
   - Enable toggle at the top
   - "Adjust Entire Page" button
   - CEFR Level dropdown
   - System Status section
   - Usage statistics grid
   - How to Use guide
   - Advanced Settings link at bottom

3. Open DevTools on the popup (right-click popup → Inspect)
4. Check the Console for errors
5. Look for the version in the manifest: should be 1.0.0

### If Still Not Working

Check these:

**1. Verify Build Output**
```bash
# Check that dist folder has recent files
ls -la dist/
ls -la dist/assets/
ls -la dist/src/ui/
```

The `popup.html` and asset files should have recent timestamps.

**2. Check Console Errors**

Right-click the popup → Inspect, then check the Console tab for:
- React errors
- Module loading errors
- Missing file errors

**3. Verify Manifest**
```bash
cat dist/manifest.json
```

Should show version 1.0.0 and have correct paths like:
- `"default_popup": "src/ui/popup.html"`
- Asset references with hashed filenames

**4. Clean Build**
```bash
# Remove old build artifacts
rm -rf dist/

# Rebuild from scratch
npm run build

# Then reload the extension completely (Method 1 above)
```

### Development Mode

For development, use:
```bash
npm run dev
```

This enables hot reload, so changes apply immediately without manual reloading.

### Common Mistakes

❌ **Loading from wrong folder**: Make sure you're loading from `dist/` not the root project folder

❌ **Not reloading after build**: Always reload the extension after `npm run build`

❌ **Chrome caching**: Chrome aggressively caches extension files. When in doubt, remove and re-add

❌ **Multiple copies loaded**: Check you don't have multiple versions of Hilo loaded in `chrome://extensions/`

### Platform-Specific Issues

**macOS**: Sometimes need to fully quit Chrome (Cmd+Q) and restart

**Windows**: May need to disable/re-enable the extension in addition to reloading

**Linux**: Check file permissions on the `dist/` folder

---

## Other Common Issues

### Content Script Not Working

If text selection/highlighting doesn't work:

1. Refresh the webpage after loading the extension
2. Content scripts only inject on page load or refresh
3. Won't work on `chrome://` or `chrome-extension://` pages
4. Check Console on the page (F12) for errors

### Options Page Not Opening

If Advanced Settings doesn't open:

1. Right-click Hilo icon → Options
2. Or go to `chrome://extensions/` → Hilo → Details → Extension options

### AI Features Not Available

If "System Status" shows all features as inactive (○):

1. Make sure you're on Chrome Canary or Dev (not Stable)
2. Enable flags at `chrome://flags`:
   - `#optimization-guide-on-device-model`
   - `#prompt-api-for-gemini-nano`
3. Restart Chrome completely
4. Wait for AI models to download (5-10 minutes, internet required)

---

## Getting Help

If none of the above works:

1. Check the Console (DevTools) for specific error messages
2. Share the error messages with the team
3. Try on a different Chrome profile to rule out corruption
4. Check if a fresh clone works: `git clone [repo] [new-folder]`

