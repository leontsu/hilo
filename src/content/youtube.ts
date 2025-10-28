import type { UserSettings, CaptionLine, SimplifiedCaptionLine } from '../types'

class YouTubeHilo {
  private settings: UserSettings = { level: 'B1', outputLanguage: 'en', enabled: true }
  private observer: MutationObserver | null = null
  private captionContainer: HTMLElement | null = null
  private overlayContainer: HTMLElement | null = null
  private currentCaptions: SimplifiedCaptionLine[] = []
  private isEnabled = false

  constructor() {
    this.init()
  }

  private async init() {
    console.log('YouTube Hilo initializing...')
    
    // Load settings
    await this.loadSettings()
    
    if (!this.settings.enabled) {
      return
    }

    // Wait for YouTube to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupYouTube())
    } else {
      setTimeout(() => this.setupYouTube(), 1000)
    }

    // Listen for settings changes
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SETTINGS_CHANGED') {
        this.loadSettings()
      }
    })
  }

  private async loadSettings() {
    try {
      // Settings are loaded from background script
      // For now use defaults, will be synced via message passing
      this.settings = { level: 'B1', outputLanguage: 'en', enabled: true }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  private setupYouTube() {
    console.log('Setting up YouTube caption monitoring...')
    
    // Create overlay container
    this.createOverlayContainer()
    
    // Monitor for caption container
    this.observer = new MutationObserver(() => {
      this.findCaptionContainer()
    })
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    // Try to find existing caption container
    this.findCaptionContainer()
  }

  private createOverlayContainer() {
    // Remove existing overlay if present
    const existing = document.getElementById('levellens-youtube-overlay')
    if (existing) {
      existing.remove()
    }

    this.overlayContainer = document.createElement('div')
    this.overlayContainer.id = 'levellens-youtube-overlay'
    this.overlayContainer.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 16px;
      line-height: 1.4;
      max-width: 80%;
      text-align: center;
      display: none;
      backdrop-filter: blur(4px);
    `

    // Add toggle button
    const toggleButton = document.createElement('button')
    toggleButton.textContent = 'EASY'
    toggleButton.style.cssText = `
      position: fixed;
      bottom: 120px;
      right: 20px;
      z-index: 2147483647;
      background: ${this.isEnabled ? '#007bff' : '#6c757d'};
      color: white;
      border: none;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `

    toggleButton.addEventListener('click', () => {
      this.isEnabled = !this.isEnabled
      toggleButton.style.background = this.isEnabled ? '#007bff' : '#6c757d'
      
      if (this.isEnabled) {
        this.overlayContainer!.style.display = 'block'
      } else {
        this.overlayContainer!.style.display = 'none'
      }
    })

    document.body.appendChild(this.overlayContainer)
    document.body.appendChild(toggleButton)
  }

  private findCaptionContainer() {
    // Look for YouTube caption container
    const captionSelectors = [
      '.caption-window',
      '.ytp-caption-window-container',
      '.ytp-caption-segment',
      '[data-layer="4"]'
    ]

    for (const selector of captionSelectors) {
      const container = document.querySelector(selector) as HTMLElement
      if (container && container !== this.captionContainer) {
        this.captionContainer = container
        this.setupCaptionMonitoring()
        console.log('Found caption container:', selector)
        break
      }
    }
  }

  private setupCaptionMonitoring() {
    if (!this.captionContainer) return

    // Monitor caption changes
    const captionObserver = new MutationObserver(() => {
      this.processCaptions()
    })

    captionObserver.observe(this.captionContainer, {
      childList: true,
      subtree: true,
      characterData: true
    })
  }

  private async processCaptions() {
    if (!this.captionContainer || !this.isEnabled) return

    try {
      // Extract current caption text
      const captionElements = this.captionContainer.querySelectorAll('.ytp-caption-segment, .caption-visual-line')
      const captionLines: CaptionLine[] = []

      captionElements.forEach((element, index) => {
        const text = element.textContent?.trim()
        if (text && text.length > 0) {
          captionLines.push({
            tStart: Date.now() + index * 1000, // Approximate timing
            tEnd: Date.now() + (index + 1) * 1000,
            text
          })
        }
      })

      if (captionLines.length === 0) {
        this.hideOverlay()
        return
      }

      // Send to background for simplification
      const response = await chrome.runtime.sendMessage({
        type: 'SIMPLIFY_CAPTIONS',
        lines: captionLines,
        settings: this.settings
      })

      if (response.success && response.data.lines.length > 0) {
        this.currentCaptions = response.data.lines
        this.showSimplifiedCaptions()
      } else {
        this.hideOverlay()
      }
    } catch (error) {
      console.error('Error processing captions:', error)
    }
  }

  private showSimplifiedCaptions() {
    if (!this.overlayContainer || this.currentCaptions.length === 0) return

    // Show the most recent caption
    const latestCaption = this.currentCaptions[this.currentCaptions.length - 1]
    
    this.overlayContainer.innerHTML = `
      <div style="margin-bottom: 4px; font-size: 12px; opacity: 0.8;">
        Hilo (${this.settings.level})
      </div>
      <div>${latestCaption.simplified}</div>
    `
    
    this.overlayContainer.style.display = 'block'
  }

  private hideOverlay() {
    if (this.overlayContainer) {
      this.overlayContainer.style.display = 'none'
    }
  }
}

// Initialize YouTube script
if (window.location.hostname.includes('youtube.com')) {
  // Wait for page to stabilize
  setTimeout(() => {
    new YouTubeHilo()
  }, 2000)
}