# Hilo - Adaptive Translator for the Real Web

![Hilo Logo](https://img.shields.io/badge/Hilo-Adaptive%20Translator-blue)
![Chrome Canary Required](https://img.shields.io/badge/Chrome%20Canary-Required-red)
![Built-in AI](https://img.shields.io/badge/Chrome%20Built--in%20AI-Required-orange)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![MIT License](https://img.shields.io/badge/License-MIT-yellow)

**Hilo** is a Chrome extension that adapts web content and YouTube captions to your language learning level (CEFR A1-C1), making the internet more accessible for language learners.

> **⚠️ IMPORTANT REQUIREMENTS**:
> 1. **Chrome Canary/Dev Required**: This extension requires Chrome's experimental Built-in AI APIs, only available in Chrome Canary or Chrome Dev
> 2. **AI Setup Required**: You must enable AI flags and download models before using Hilo (see [Chrome Built-in AI Setup](#-chrome-built-in-ai-integration))
> 3. **First-time Build**: After cloning, you MUST run `npm install` and `npm run build` before loading the extension

Hilo uses Chrome's on-device Built-in AI APIs for privacy-respecting, context-aware text simplification and comprehension quizzes. All processing happens locally on your device—no data is sent to external servers, making language learning both seamless and secure.

## 🌟 Features

### Core Functionality
- **Text Simplification**: Select any text on web pages (8+ characters) to get AI-powered simplified versions
- **YouTube Caption Adaptation**: Native caption integration with real-time simplification and caching
- **Interactive Quizzes**: Generate comprehension quizzes based on simplified text to test understanding
- **CEFR Level Support**: Choose from A1 (Beginner) to C1 (Advanced) complexity levels
- **Chrome Built-in AI Powered**: Leverages Chrome's on-device AI for context-aware, privacy-respecting simplification
- **Performance Optimized**: Smart caption caching prevents redundant processing

### User Experience
- **Shadow DOM Integration**: No interference with existing page styles
- **Instant Feedback**: Real-time simplification with summary tooltips
- **Keyboard Accessible**: Full keyboard navigation support
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Automatic theme adaptation

## 🚀 Quick Start

### Prerequisites
- **Chrome Canary or Chrome Dev** (version 127+) with Built-in AI enabled
  - Regular Chrome does not yet support the Built-in AI APIs required by Hilo
  - See [Chrome Built-in AI Setup](#-chrome-built-in-ai-integration) for detailed instructions
- Node.js (version 16+)
- npm or yarn

### Installation

> **🚨 First**: Make sure you have Chrome Canary or Chrome Dev installed and AI models downloaded. See [Chrome Built-in AI Setup](#-chrome-built-in-ai-integration) below.

1. **Clone the repository**
   ```bash
   git clone https://github.com/leontsu/hilo.git
   cd hilo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```
   This creates a `dist` folder with the compiled extension.

4. **Load into Chrome Canary/Dev**
   - Open Chrome Canary or Chrome Dev and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from your project

5. **Verify AI is Working**
   - Click the Hilo extension icon in your toolbar
   - Check the AI status indicator
   - If AI is not detected, refer to the [AI Setup guide](#-chrome-built-in-ai-integration)

### Development Mode

For active development with hot reload:

```bash
npm run dev
```

Then load the extension from the `dist` folder as described above. Changes will automatically reload.

## 📖 Usage Guide

### Web Pages
1. **Select Text**: Highlight any text on a webpage (minimum 8 characters)
2. **Click Simplify**: A toolbar will appear above your selection
3. **View Results**: The simplified text appears in an overlay with a summary
4. **Generate Quiz** (Optional): Test your comprehension with AI-generated quiz questions
5. **Clear Overlays**: Use the "Clear" button to remove all simplifications

### YouTube
1. **Visit YouTube**: Navigate to any YouTube video with captions
2. **Enable Hilo**: Click the toggle button that appears on the video player
3. **Native Caption Integration**: Hilo directly replaces YouTube's captions with simplified versions
4. **Smart Caching**: Previously simplified captions are cached for instant display
5. **Real-time Adaptation**: Captions adapt to your selected CEFR level on-the-fly

### Settings
- **Access Settings**: Click the Hilo icon in Chrome's toolbar
- **Choose Level**: Select your CEFR level (A1-C1)
- **Toggle Extension**: Enable or disable Hilo functionality
- **View Statistics**: See how many texts you've simplified (tracked in popup)
- **AI Status**: Check if Chrome Built-in AI is properly configured

## ⚙️ Configuration

### CEFR Levels
- **A1 (Beginner)**: Very simple words and phrases
- **A2 (Elementary)**: Common everyday expressions
- **B1 (Intermediate)**: Clear standard language
- **B2 (Upper Intermediate)**: Complex topics and ideas
- **C1 (Advanced)**: Flexible and effective language

### Storage
All settings are automatically synced across your Chrome browsers using `chrome.storage.sync`.

## 🔧 Development

### Project Structure
```
hilo/
├── src/
│   ├── manifest.ts          # Chrome extension manifest
│   ├── background/
│   │   └── index.ts         # Service worker for message handling
│   ├── content/
│   │   ├── index.tsx        # Main content script with React
│   │   ├── youtube.ts       # YouTube caption integration with caching
│   │   └── styles.css       # Content script styles
│   ├── ui/
│   │   ├── popup.tsx        # Extension popup with statistics
│   │   ├── options.tsx      # Settings page
│   │   ├── ui.css           # UI component styles
│   │   ├── popup.html       # Popup HTML template
│   │   └── options.html     # Options HTML template
│   ├── lib/
│   │   ├── ai.ts            # Chrome Built-in AI integration (LanguageModel, Summarizer, Writer)
│   │   ├── storage.ts       # Chrome storage utilities
│   │   ├── validation.ts    # Input validation
│   │   └── performance.ts   # Performance monitoring
│   └── types.d.ts           # TypeScript type definitions
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite with @crxjs/vite-plugin
- **Extension API**: Chrome Manifest V3
- **Styling**: Pure CSS with CSS custom properties
- **Architecture**: Content Scripts + Background Service Worker

## 🤖 Chrome Built-in AI Integration

**⚠️ REQUIRED:** Hilo requires Chrome's Built-in AI APIs to function. The extension will not work without them.

### Current AI Implementation Status

**✅ Implemented & Active:**
- **Language Model API** (`globalThis.LanguageModel`) - Powers text and caption simplification
- **Summarizer API** (`globalThis.Summarizer`) - Generates text summaries
- **Writer API** (`globalThis.Writer`) - Generates comprehension quizzes
- **Capability Detection** - Automatically checks which AI APIs are available
- **Error Handling** - Clear messages if AI is unavailable

**🔄 How It Works:**
1. On startup, Hilo checks if Chrome Built-in AI APIs are available
2. If available: All features work normally with AI-powered simplification
3. If unavailable: Clear error messages guide you to enable the required features
4. All processing happens on-device for privacy

**📋 Setting Up Chrome Built-in AI (REQUIRED):**
> **Note:** Chrome Built-in AI is currently experimental and only available in Chrome Canary/Dev

1. **Install Chrome Canary**
   - Download from [google.com/chrome/canary](https://www.google.com/chrome/canary/)

2. **Enable AI Flags**
   - Navigate to `chrome://flags/`
   - Enable these flags:
     - **"Prompt API for Gemini Nano"** → Enabled
     - **"Summarization API for Gemini Nano"** → Enabled
     - **"Writer API for Gemini Nano"** → Enabled
     - **"Optimization Guide On Device Model"** → Enabled BypassPerfRequirement

3. **Restart Chrome**
   - Close all Chrome windows and restart

4. **Download AI Models**
   - Open DevTools Console (F12)
   - Run these commands to download the models:
   ```javascript
   await LanguageModel.create()
   await Summarizer.create()
   await Writer.create()
   ```
   - Wait for models to download (this may take a few minutes)

5. **Load Hilo Extension**
   - Follow the [Installation](#installation) steps above

**🎯 Benefits of On-Device AI:**
- **Privacy-First**: All processing happens locally on your device
- **Context-Aware**: Real language simplification, not just word replacement
- **Grammar-Level**: Proper sentence restructuring and grammar adjustment
- **Meaning Preservation**: Maintains original meaning accurately
- **No Internet Required**: Works offline after initial model download
- **Interactive Learning**: AI-generated quizzes test your comprehension

**⚡ Performance:**
- YouTube caption caching reduces redundant API calls
- Smart session management and resource cleanup
- All settings automatically saved and synced via Chrome Storage

## 🧪 Testing

### Manual Testing Checklist
1. **AI Setup**: Verify Chrome Built-in AI is enabled and models are downloaded
2. **Text Selection**: Verify toolbar appears for 8+ character selections
3. **Simplification**: Confirm text is simplified according to CEFR level
4. **Quiz Generation**: Test comprehension quiz feature on simplified text
5. **YouTube Integration**: Test caption simplification with EASY toggle
6. **Settings Persistence**: Verify settings save and sync across browser sessions
7. **Responsive Design**: Test on different screen sizes and zoom levels

### Browser Compatibility
- **Chrome Canary** (version 127+) - Required for Built-in AI APIs
- **Chrome Dev** (version 127+) - Required for Built-in AI APIs
- **Regular Chrome** - Not yet supported (Built-in AI APIs not available)
- **Edge Canary/Dev** - May work but not officially tested

> **Note:** This extension requires experimental Chrome Built-in AI APIs that are currently only available in Chrome Canary and Chrome Dev channels.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow React functional component patterns
- Maintain accessibility (WCAG AA)
- Add JSDoc comments for public functions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Hilo Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
## 💡 Inspiration

Hilo was inspired by the need to make web content accessible to language learners at all levels. By requiring Chrome's Built-in AI capabilities, we provide truly privacy-respecting, context-aware language adaptation that runs entirely on your device. This approach helps users gradually improve their language skills while consuming authentic web content, without sending any data to external servers.

## 📞 Support

- **Issues**: Report bugs and feature requests on [GitHub Issues](https://github.com/leontsu/hilo/issues)
- **Documentation**: Check our documentation files for detailed guides:
  - [YOUTUBE_CAPTION_IMPROVEMENTS.md](YOUTUBE_CAPTION_IMPROVEMENTS.md) - YouTube feature details
  - [PERFORMANCE_ANALYSIS.md](PERFORMANCE_ANALYSIS.md) - Performance optimization guide
  - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- **Community**: Join discussions in [GitHub Discussions](https://github.com/leontsu/hilo/discussions)

