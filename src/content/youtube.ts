import type { UserSettings, CaptionLine, SimplifiedCaptionLine } from '../types'

class YouTubeHilo {
  private settings: UserSettings = { level: 'B1', enabled: true }
  private observer: MutationObserver | null = null
  private captionContainer: HTMLElement | null = null
  private overlayContainer: HTMLElement | null = null
  private toggleButton: HTMLElement | null = null
  private isEnabled = false
  private captionCache = new Map<string, string>() // Cache adjusted captions
  private useNativeIntegration = true // Toggle between overlay and native integration

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
      const result = await chrome.storage.sync.get(['level', 'enabled'])
      this.settings = {
        level: result.level || 'B1',
        enabled: result.enabled !== false
      }
      console.log('YouTube Hilo settings loaded:', this.settings)
      
      // Clear caption cache when settings change
      this.captionCache.clear()
      
      // Update toggle button to show new level
      this.updateToggleButton()
    } catch (error) {
      console.error('Error loading settings:', error)
      this.settings = { level: 'B1', enabled: true }
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
    // Remove existing elements if present
    const existingOverlay = document.getElementById('levellens-youtube-overlay')
    const existingButton = document.getElementById('levellens-youtube-toggle')
    if (existingOverlay) existingOverlay.remove()
    if (existingButton) existingButton.remove()

    // Create overlay container (for fallback mode)
    this.overlayContainer = document.createElement('div')
    this.overlayContainer.id = 'levellens-youtube-overlay'
    this.overlayContainer.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 20px;
      line-height: 1.6;
      max-width: 90%;
      width: auto;
      text-align: center;
      display: none;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      word-wrap: break-word;
      white-space: pre-wrap;
    `

    // Add toggle button with level display
    this.toggleButton = document.createElement('button')
    this.toggleButton.id = 'levellens-youtube-toggle'
    this.updateToggleButton()
    this.toggleButton.style.cssText = `
      position: fixed;
      bottom: 120px;
      right: 20px;
      z-index: 2147483647;
      background: ${this.isEnabled ? '#3b82f6' : '#6b7280'};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 150ms ease;
    `

    this.toggleButton.addEventListener('click', () => {
      this.isEnabled = !this.isEnabled
      this.toggleButton!.style.background = this.isEnabled ? '#3b82f6' : '#6b7280'
      this.updateToggleButton()
      
      if (!this.isEnabled) {
        this.hideOverlay()
        this.restoreOriginalCaptions()
      } else {
        // Reprocess current captions
        this.processCaptions()
      }
    })

    this.toggleButton.addEventListener('mouseenter', () => {
      this.toggleButton!.style.transform = 'scale(1.05)'
    })

    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton!.style.transform = 'scale(1)'
    })

    document.body.appendChild(this.overlayContainer)
    document.body.appendChild(this.toggleButton)
  }

  private updateToggleButton() {
    if (this.toggleButton) {
      this.toggleButton.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 16px;">${this.isEnabled ? '🤖' : '📚'}</span>
          <span>Hilo ${this.settings.level}</span>
        </div>
      `
    }
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
      const originalTexts: string[] = []

      captionElements.forEach((element, index) => {
        const text = element.textContent?.trim()
        if (text && text.length > 0) {
          originalTexts.push(text)
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

      // Check cache first for all captions
      const allCached = originalTexts.every(text => this.captionCache.has(text))
      
      if (allCached) {
        // Use cached captions
        if (this.useNativeIntegration) {
          this.replaceNativeCaptions(captionElements, originalTexts)
        } else {
          const cachedCaptions = originalTexts.map(text => this.captionCache.get(text)!)
          this.showOverlayCaptions(cachedCaptions)
        }
        return
      }

      // Send to background for adjustment
      const response = await chrome.runtime.sendMessage({
        type: 'SIMPLIFY_CAPTIONS',
        lines: captionLines,
        settings: this.settings
      })

      if (response.success && response.data.lines.length > 0) {
        // Cache the results
        response.data.lines.forEach((line: SimplifiedCaptionLine, index: number) => {
          if (originalTexts[index]) {
            this.captionCache.set(originalTexts[index], line.simplified)
          }
        })
        
        // Display captions
        if (this.useNativeIntegration) {
          this.replaceNativeCaptions(captionElements, originalTexts)
        } else {
          const adjustedTexts = response.data.lines.map((line: SimplifiedCaptionLine) => line.simplified)
          this.showOverlayCaptions(adjustedTexts)
        }
      } else {
        this.hideOverlay()
      }
    } catch (error) {
      console.error('Error processing captions:', error)
      this.hideOverlay()
    }
  }

  private replaceNativeCaptions(captionElements: NodeListOf<Element>, originalTexts: string[]) {
    // Directly replace YouTube's native caption text
    captionElements.forEach((element, index) => {
      const originalText = originalTexts[index]
      if (originalText && this.captionCache.has(originalText)) {
        const adjustedText = this.captionCache.get(originalText)!
        
        // Store original text as data attribute if not already stored
        if (!element.hasAttribute('data-hilo-original')) {
          element.setAttribute('data-hilo-original', originalText)
        }
        
        // Replace the text content
        element.textContent = adjustedText
        
        // Add a subtle indicator
        element.setAttribute('data-hilo-adjusted', 'true')
      }
    })
  }

  private restoreOriginalCaptions() {
    if (!this.captionContainer) return
    
    // Find all adjusted caption elements and restore them
    const adjustedElements = this.captionContainer.querySelectorAll('[data-hilo-adjusted="true"]')
    adjustedElements.forEach(element => {
      const originalText = element.getAttribute('data-hilo-original')
      if (originalText) {
        element.textContent = originalText
        element.removeAttribute('data-hilo-adjusted')
        element.removeAttribute('data-hilo-original')
      }
    })
  }

  private showOverlayCaptions(captions: string[]) {
    if (!this.overlayContainer || captions.length === 0) return

    // Show all captions joined together
    const allCaptions = captions.join(' ')
    
    this.overlayContainer.innerHTML = `
      <div style="margin-bottom: 6px; font-size: 13px; opacity: 0.8; font-weight: 600;">
        Hilo (${this.settings.level})
      </div>
      <div style="font-size: 20px; line-height: 1.6;">${allCaptions}</div>
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