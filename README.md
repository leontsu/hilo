# Hilo - Adaptive Translator for the Real Web

![Hilo Logo](https://img.shields.io/badge/Hilo-Adaptive%20Translator-blue)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![MIT License](https://img.shields.io/badge/License-MIT-yellow)

**Hilo** is a Chrome extension that adapts web content and YouTube captions to your language learning level (CEFR A1-C1), making the internet more accessible for language learners.

Hilo prioritizes privacy with local processing and provides seamless integration with Chrome's native AI capabilities for enhanced learning experiences.

## 🌟 Features

### Core Functionality
- **Text Simplification**: Select any text on web pages (8+ characters) to get simplified versions
- **YouTube Caption Adaptation**: Real-time caption simplification with easy toggle
- **CEFR Level Support**: Choose from A1 (Beginner) to C1 (Advanced) complexity levels
- **Multi-language Output**: English and Japanese language support
- **Privacy-First**: Local processing with optional AI enhancement

### User Experience
- **Shadow DOM Integration**: No interference with existing page styles
- **Instant Feedback**: Real-time simplification with summary tooltips
- **Keyboard Accessible**: Full keyboard navigation support
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Automatic theme adaptation

## 🚀 Quick Start

### Prerequisites
- Google Chrome (version 88+)
- Node.js (version 16+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/levellens-react.git
   cd levellens-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load into Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from your project

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
4. **Clear Overlays**: Use the "Clear" button to remove all simplifications

### YouTube
1. **Visit YouTube**: Navigate to any YouTube video
2. **Enable EASY Mode**: Click the "EASY" button that appears on the video
3. **Simplified Captions**: Captions will be automatically simplified and displayed at the bottom

### Settings
- **Access Settings**: Click the Hilo icon in Chrome's toolbar
- **Choose Level**: Select your CEFR level (A1-C1)
- **Set Language**: Choose English or Japanese output
- **Advanced Options**: Click "Advanced Settings" for detailed configuration

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
levellens-react/
├── src/
│   ├── manifest.ts          # Chrome extension manifest
│   ├── background/
│   │   └── index.ts         # Service worker for message handling
│   ├── content/
│   │   ├── index.tsx        # Main content script with React
│   │   ├── youtube.ts       # YouTube-specific functionality
│   │   └── styles.css       # Content script styles
│   ├── ui/
│   │   ├── popup.tsx        # Extension popup interface
│   │   ├── options.tsx      # Settings page
│   │   ├── ui.css          # UI component styles
│   │   ├── popup.html      # Popup HTML template
│   │   └── options.html    # Options HTML template
│   ├── lib/
│   │   ├── ai.ts           # Simplification logic (stub + AI)
│   │   └── storage.ts      # Chrome storage utilities
│   └── types.d.ts          # TypeScript type definitions
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
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

Hilo is designed to seamlessly integrate with Chrome's Built-in AI APIs. The current implementation uses local simplification stubs that can be easily replaced.

### AI Replacement Guide

1. **Update `src/lib/ai.ts`**:
   Replace the stub functions with Chrome AI calls:

   ```typescript
   // Replace simplifyText function
   export async function simplifyTextAI(text: string, settings: UserSettings): Promise<SimplificationResponse> {
     const session = await chrome.aiOriginTrial.languageModel.create({
       systemPrompt: `Simplify text to CEFR ${settings.level} level...`
     });
     
     const result = await session.prompt(`Simplify: ${text}`);
     return {
       simplified: result,
       summary: result.substring(0, 60) + '...',
       originalText: text
     };
   }
   ```

2. **Update function calls**:
   Replace `simplifyText` calls with `simplifyTextAI` in `src/background/index.ts`

3. **Add AI permissions**:
   Update `src/manifest.ts` to include AI origin trial permissions

### AI Features Roadmap
- Real-time translation
- Context-aware simplification
- Personalized difficulty adjustment
- Learning progress tracking

## 🧪 Testing

### Manual Testing Checklist
1. **Text Selection**: Verify toolbar appears for 8+ character selections
2. **Simplification**: Confirm text is simplified according to CEFR level
3. **YouTube Integration**: Test caption simplification with EASY toggle
4. **Settings Persistence**: Verify settings save and sync across browser sessions
5. **Responsive Design**: Test on different screen sizes and zoom levels

### Browser Compatibility
- Chrome 88+ (Manifest V3 support required)
- Edge 88+ (Chromium-based)

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

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Basic text simplification
- [x] YouTube caption support
- [x] CEFR level configuration
- [x] Chrome storage integration

### Phase 2 (Planned)
- [ ] Chrome Built-in AI integration
- [ ] Advanced context awareness
- [ ] Learning progress tracking
- [ ] Custom vocabulary lists

### Phase 3 (Future)
- [ ] Multi-language translation
- [ ] Audio pronunciation
- [ ] Learning analytics
- [ ] Social features

## 💡 Inspiration

Hilo was inspired by the need to make web content accessible to language learners at all levels. By leveraging Chrome's Built-in AI capabilities, we aim to provide privacy-respecting, real-time language adaptation that helps users gradually improve their language skills while consuming authentic web content.

## 📞 Support

- **Issues**: Report bugs and feature requests on [GitHub Issues](https://github.com/your-username/levellens-react/issues)
- **Documentation**: Check our [Wiki](https://github.com/your-username/levellens-react/wiki) for detailed guides
- **Community**: Join discussions in [GitHub Discussions](https://github.com/your-username/levellens-react/discussions)

