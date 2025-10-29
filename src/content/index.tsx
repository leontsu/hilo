import React from 'react'
import { createRoot } from 'react-dom/client'
import type { UserSettings, SimplificationResponse, QuizResponse, AICapabilities } from '../types'

// Minimum text length to show simplification toolbar
const MIN_TEXT_LENGTH = 8

interface ToolbarState {
  visible: boolean
  x: number
  y: number
  selectedText: string
}

interface SimplificationOverlay {
  id: string
  element: HTMLElement
  originalText: string
  simplified: string
  summary: string
  quiz?: QuizResponse
}

class HiloContentScript {
  private shadowRoot: ShadowRoot | null = null
  private toolbarRoot: any = null
  private activeOverlays: Map<string, SimplificationOverlay> = new Map()
  private settings: UserSettings = { level: 'B1', enabled: true }
  private aiCapabilities: AICapabilities = { languageModel: false, summarizer: false, translator: false, writer: false }
  private currentToolbarState: ToolbarState | null = null

  constructor() {
    this.init()
  }

  private async init() {
    console.log('Hilo: Starting content script initialization...')

    // Load settings and check AI capabilities
    await this.loadSettings()
    console.log('Hilo: Settings loaded:', this.settings)
    
    await this.checkAICapabilities()
    console.log('Hilo: AI capabilities checked:', this.aiCapabilities)
    
    // Create shadow DOM container
    this.createShadowContainer()
    console.log('Hilo: Shadow DOM container created')
    
    // Setup event listeners
    this.setupEventListeners()
    console.log('Hilo: Event listeners setup completed')
    
    console.log('Hilo content script initialized successfully!')
  }

  private async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
      if (response.success) {
        this.settings = response.data
        console.log('Hilo: Settings updated to:', this.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  private async checkAICapabilities() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_AI_CAPABILITIES' })
      if (response.success) {
        this.aiCapabilities = response.data.capabilities
      }
    } catch (error) {
      console.error('Error checking AI capabilities:', error)
    }
  }

  private createShadowContainer() {
    // Create container for Shadow DOM
    const container = document.createElement('div')
    container.id = 'levellens-container'
    container.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 2147483647; pointer-events: none;'
    
    // Create Shadow DOM
    this.shadowRoot = container.attachShadow({ mode: 'open' })
    
    // Add styles to Shadow DOM
    const style = document.createElement('style')
    style.textContent = `
      .ll-toolbar {
        position: absolute;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 8px;
        display: flex;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        z-index: 10000;
        pointer-events: auto;
      }
      
      .ll-toolbar button {
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
      }
      
      .ll-toolbar button:hover {
        background: #0056b3;
      }
      
      .ll-toolbar button.secondary {
        background: #6c757d;
      }
      
      .ll-toolbar button.secondary:hover {
        background: #545b62;
      }
      
      .ll-overlay {
        position: absolute;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 12px;
        max-width: 400px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        line-height: 1.4;
        z-index: 9999;
        pointer-events: auto;
      }
      
      .ll-overlay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;
        color: #666;
      }
      
      .ll-overlay-close {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .ll-overlay-content {
        color: #333;
        margin-bottom: 8px;
      }
      
      .ll-overlay-summary {
        font-size: 12px;
        color: #666;
        font-style: italic;
        border-top: 1px solid #eee;
        padding-top: 8px;
      }
      
      @keyframes slideInRight {
        0% {
          opacity: 0;
          transform: translateX(100%);
        }
        100% {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `
    this.shadowRoot.appendChild(style)
    
    // Create toolbar container
    const toolbarContainer = document.createElement('div')
    this.shadowRoot.appendChild(toolbarContainer)
    
    // Create React root for toolbar
    this.toolbarRoot = createRoot(toolbarContainer)
    
    // Append to document
    document.body.appendChild(container)
  }

  private setupEventListeners() {
    // Text selection handler
    document.addEventListener('mouseup', this.handleTextSelection.bind(this))
    document.addEventListener('keyup', this.handleTextSelection.bind(this))
    
    // Hide toolbar on clicks outside
    document.addEventListener('mousedown', (e) => {
      if (!this.shadowRoot?.contains(e.target as Node)) {
        this.hideToolbar()
      }
    })
    
    // Listen for settings changes and page adjustment requests
    chrome.runtime.onMessage.addListener(async (message) => {
      if (message.type === 'SETTINGS_CHANGED') {
        console.log('Hilo: Received SETTINGS_CHANGED message')
        await this.loadSettings()
        // Re-render toolbar if it's currently visible
        if (this.currentToolbarState && this.currentToolbarState.visible) {
          console.log('Hilo: Re-rendering toolbar with new settings')
          this.showToolbar(this.currentToolbarState)
        }
      } else if (message.type === 'ADJUST_PAGE') {
        this.adjustEntirePage(message.settings || this.settings)
      }
    })
  }

  private handleTextSelection() {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      this.hideToolbar()
      return
    }

    const selectedText = selection.toString().trim()
    if (selectedText.length < MIN_TEXT_LENGTH) {
      this.hideToolbar()
      return
    }

    // Get selection position
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    this.showToolbar({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 50,
      selectedText
    })
  }

  private showToolbar(state: ToolbarState) {
    if (!this.toolbarRoot || !this.settings.enabled) return

    // Store current toolbar state so we can re-render when settings change
    this.currentToolbarState = state

    console.log('Hilo: Rendering toolbar with level:', this.settings.level)

    this.toolbarRoot.render(
      <Toolbar
        state={state}
        aiCapabilities={this.aiCapabilities}
        settings={this.settings}
        onSimplify={this.handleSimplify.bind(this)}
        onQuiz={this.handleQuiz.bind(this)}
        onClear={this.handleClear.bind(this)}
        onClose={this.hideToolbar.bind(this)}
      />
    )
  }

  private hideToolbar() {
    if (!this.toolbarRoot) return
    
    // Clear current toolbar state
    this.currentToolbarState = null
    
    this.toolbarRoot.render(
      <Toolbar
        state={{ visible: false, x: 0, y: 0, selectedText: '' }}
        aiCapabilities={this.aiCapabilities}
        settings={this.settings}
        onSimplify={() => {}}
        onQuiz={() => {}}
        onClear={() => {}}
        onClose={() => {}}
      />
    )
  }

  private async handleSimplify(selectedText: string, x: number, y: number) {
    console.log('Hilo: handleSimplify called with:', { selectedText, x, y, settings: this.settings })
    
    // Check AI capabilities first
    if (!this.aiCapabilities.languageModel) {
      console.log('Hilo: AI Language Model not available, showing enhanced error')
      this.showEnhancedErrorNotification(
        'AI Language Model Required',
        'Chrome\'s built-in AI Language Model is required for text adjustment.',
        'api-unavailable'
      )
      return
    }
    
    // Show loading indicator with animation
    this.showEnhancedLoadingIndicator(x, y, 'Adjusting text level...', 'AI is processing your text')
    
    try {
      console.log('Hilo: Sending SIMPLIFY_TEXT message to background...')
      
      // Send adjustment request to background
      const response = await chrome.runtime.sendMessage({
        type: 'SIMPLIFY_TEXT',
        text: selectedText,
        settings: this.settings
      })
      
      console.log('Hilo: Received response from background:', response)

      this.hideLoadingIndicator()

      if (response.success) {
        this.showSimplificationOverlay(response.data, x, y)
        // Show quick success feedback
        this.showQuickSuccessIndicator(x, y)
      } else {
        console.error('Level adjustment failed:', response.error)
        // Use enhanced error display for better user guidance
        this.showEnhancedErrorNotification(
          'Text Adjustment Failed',
          response.error || 'Unable to adjust the selected text. Please try again.',
          this.detectErrorType(response.error)
        )
      }
    } catch (error) {
      this.hideLoadingIndicator()
      console.error('Error during level adjustment:', error)
      this.showEnhancedErrorNotification(
        'Connection Error',
        'Could not connect to the AI service. Please check your connection and try again.',
        'connection-error'
      )
    }
    
    this.hideToolbar()
  }

  private async handleQuiz(selectedText: string, x: number, y: number) {
    // Check AI capabilities first
    if (!this.aiCapabilities.writer) {
      console.log('Hilo: AI Writer not available, showing enhanced error')
      this.showEnhancedErrorNotification(
        'AI Writer Required',
        'Chrome\'s built-in AI Writer is required for quiz generation.',
        'api-unavailable'
      )
      return
    }
    
    // Show enhanced loading indicator
    this.showEnhancedLoadingIndicator(x, y, 'Generating quiz questions...', 'AI is analyzing your text to create questions')
    
    try {
      // Send quiz generation request to background
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_QUIZ',
        text: selectedText,
        settings: this.settings
      })

      this.hideLoadingIndicator()

      if (response.success) {
        this.showQuizOverlay(response.data, selectedText, x, y)
        // Show quick success feedback
        this.showQuickSuccessIndicator(x, y)
      } else {
        console.error('Quiz generation failed:', response.error)
        this.showEnhancedErrorNotification(
          'Quiz Generation Failed',
          response.error || 'Unable to generate quiz questions. Please try again.',
          this.detectErrorType(response.error)
        )
      }
    } catch (error) {
      this.hideLoadingIndicator()
      console.error('Error during quiz generation:', error)
      this.showEnhancedErrorNotification(
        'Connection Error',
        'Could not connect to the AI service. Please check your connection and try again.',
        'connection-error'
      )
    }
    
    this.hideToolbar()
  }

  private handleClear() {
    this.activeOverlays.forEach((overlay) => {
      overlay.element.remove()
    })
    this.activeOverlays.clear()
    this.hideToolbar()
  }

  private showSimplificationOverlay(data: SimplificationResponse, x: number, y: number) {
    const overlay = document.createElement('div')
    overlay.className = 'll-overlay'
    overlay.style.cssText = `
      position: fixed;
      left: ${Math.min(x, window.innerWidth - 420)}px;
      top: ${Math.min(y + 60, window.innerHeight - 200)}px;
      z-index: 2147483646;
    `
    
    const overlayId = Date.now().toString()
    
    const hasQuiz = data.quiz && data.quiz.length > 0
    
    overlay.innerHTML = `
      <div class="ll-overlay-header">
        <span>Hilo (${this.settings.level}) ${this.aiCapabilities.languageModel ? '🤖' : '📚'}</span>
        <button class="ll-overlay-close" data-overlay-id="${overlayId}">×</button>
      </div>
      <div class="ll-overlay-content">${data.simplified}</div>
      ${data.summary ? `<div class="ll-overlay-summary">${data.summary}</div>` : ''}
      ${hasQuiz ? `
        <div class="ll-overlay-section">
          <div class="ll-overlay-section-title">Quick Quiz:</div>
          <div class="ll-overlay-quiz">
            ${data.quiz?.map((q, i) => `
              <div class="quiz-question" data-question-id="${q.id}">
                <div class="question-text">${i + 1}. ${q.question}</div>
                <div class="question-options">
                  ${q.options.map((option, optIndex) => `
                    <div class="option" data-option="${optIndex}">
                      ${String.fromCharCode(65 + optIndex)}) ${option}
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `
    
    // Add close button listener
    overlay.querySelector('.ll-overlay-close')?.addEventListener('click', () => {
      this.removeOverlay(overlayId)
    })
    
    document.body.appendChild(overlay)
    
    this.activeOverlays.set(overlayId, {
      id: overlayId,
      element: overlay,
      originalText: data.originalText,
      simplified: data.simplified,
      summary: data.summary || '',
      quiz: data.quiz ? { questions: data.quiz, originalText: data.originalText } : undefined
    })
  }

  private showQuizOverlay(quizData: QuizResponse, originalText: string, x: number, y: number) {
    const overlay = document.createElement('div')
    overlay.className = 'll-overlay ll-quiz-overlay'
    overlay.style.cssText = `
      position: fixed;
      left: ${Math.min(x, window.innerWidth - 420)}px;
      top: ${Math.min(y + 60, window.innerHeight - 300)}px;
      z-index: 2147483646;
      max-width: 500px;
    `
    
    const overlayId = Date.now().toString()
    
    overlay.innerHTML = `
      <div class="ll-overlay-header">
        <span>Hilo Quiz (${this.settings.level}) ${this.aiCapabilities.writer ? '🤖' : '📝'}</span>
        <button class="ll-overlay-close" data-overlay-id="${overlayId}">×</button>
      </div>
      <div class="ll-overlay-content">
        <div class="quiz-intro">Test your understanding of the text:</div>
        <div class="ll-overlay-quiz">
          ${quizData.questions.map((q, i) => `
            <div class="quiz-question" data-question-id="${q.id}" data-correct="${q.correctAnswer}">
              <div class="question-text">${i + 1}. ${q.question}</div>
              <div class="question-options">
                ${q.options.map((option, optIndex) => `
                  <button class="option-button" data-option="${optIndex}">
                    ${String.fromCharCode(65 + optIndex)}) ${option}
                  </button>
                `).join('')}
              </div>
              <div class="question-feedback" style="display: none;">
                <div class="correct-answer">Correct answer: ${String.fromCharCode(65 + q.correctAnswer)}</div>
                ${q.explanation ? `<div class="explanation">${q.explanation}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
    
    // Add quiz interaction handlers
    overlay.querySelectorAll('.option-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const questionDiv = target.closest('.quiz-question') as HTMLElement
        const selectedOption = parseInt(target.dataset.option || '0')
        const correctAnswer = parseInt(questionDiv.dataset.correct || '0')
        
        // Remove previous selections
        questionDiv.querySelectorAll('.option-button').forEach(btn => {
          btn.classList.remove('selected', 'correct', 'incorrect')
        })
        
        // Mark the selected option
        target.classList.add('selected')
        if (selectedOption === correctAnswer) {
          target.classList.add('correct')
        } else {
          target.classList.add('incorrect')
          // Also highlight the correct answer
          const correctButton = questionDiv.querySelector(`[data-option="${correctAnswer}"]`)
          correctButton?.classList.add('correct')
        }
        
        // Show feedback
        const feedback = questionDiv.querySelector('.question-feedback') as HTMLElement
        feedback.style.display = 'block'
      })
    })
    
    // Add close button listener
    overlay.querySelector('.ll-overlay-close')?.addEventListener('click', () => {
      this.removeOverlay(overlayId)
    })
    
    document.body.appendChild(overlay)
    
    this.activeOverlays.set(overlayId, {
      id: overlayId,
      element: overlay,
      originalText: originalText,
      simplified: '',
      summary: '',
      quiz: quizData
    })
  }

  private removeOverlay(overlayId: string) {
    const overlay = this.activeOverlays.get(overlayId)
    if (overlay) {
      overlay.element.remove()
      this.activeOverlays.delete(overlayId)
    }
  }

  private async adjustEntirePage(settings: UserSettings) {
    let successCount = 0
    let failCount = 0
    
    try {
      console.log('Starting page level adjustment...')
      console.log('DEBUG: This is the modified version with AI capability check!')
      
      // Check AI capabilities first
      console.log('Hilo: Checking AI capabilities before page adjustment:', this.aiCapabilities)
      if (!this.aiCapabilities.languageModel) {
        console.log('Hilo: AI Language Model not available, stopping page adjustment')
        this.showEnhancedErrorNotification(
          'AI Language Model Required',
          'Chrome\'s built-in AI Language Model is required for page adjustment.',
          'api-unavailable'
        )
        return
      }
      console.log('Hilo: AI capabilities OK, proceeding with page adjustment')
      
      // Clear any existing overlays
      this.handleClear()
      
      // Extract all text nodes from the page
      const textNodes = this.extractPageTextNodes()
      
      if (textNodes.length === 0) {
        console.log('No text content found on page')
        this.showErrorNotification(
          'No Text Found',
          'Could not find any text content to adjust on this page.'
        )
        return
      }

      console.log(`Found ${textNodes.length} text nodes to adjust`)

      // Create a progress indicator
      this.showPageAdjustmentProgress(0, textNodes.length, 'Starting...')

      // Process text nodes in batches to avoid overwhelming the API
      let processed = 0
      for (const node of textNodes) {
        try {
          const originalText = node.textContent?.trim() || ''
          
          // Skip if text is too short or is just whitespace/punctuation
          if (originalText.length < MIN_TEXT_LENGTH || /^[\[\](){}.,!?;:\s\-_]*$/.test(originalText)) {
            processed++
            continue
          }

          // Send adjustment request
          const response = await chrome.runtime.sendMessage({
            type: 'SIMPLIFY_TEXT',
            text: originalText,
            settings: settings
          })

          if (response.success && response.data) {
            // Apply adjustment to the text node
            this.applyAdjustmentToNode(node, originalText, response.data.simplified)
            successCount++
          } else {
            failCount++
            console.warn('Failed to adjust node:', response.error)
          }

          processed++
          this.showPageAdjustmentProgress(
            processed, 
            textNodes.length, 
            `Processing ${processed}/${textNodes.length}...`
          )

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          console.error('Error adjusting text node:', error)
          failCount++
          processed++
        }
      }

      // Remove progress indicator
      this.hidePageAdjustmentProgress()
      
      console.log(`Page adjustment complete! Success: ${successCount}, Failed: ${failCount}`)
      
      // Show appropriate notification based on results
      if (successCount === 0) {
        this.showEnhancedErrorNotification(
          'Page Adjustment Failed',
          'Could not adjust any text on this page. Please try again or check your connection.',
          'connection-error'
        )
      } else if (failCount > 0) {
        this.showWarningNotification(
          'Partially Complete',
          `Adjusted ${successCount} sections successfully. ${failCount} sections could not be processed.`
        )
      } else {
        this.showCompletionNotification(successCount)
      }
    } catch (error) {
      console.error('Error during page adjustment:', error)
      this.hidePageAdjustmentProgress()
      this.showEnhancedErrorNotification(
        'Page Adjustment Error',
        error instanceof Error ? error.message : 'An unexpected error occurred during page adjustment.',
        this.detectErrorType(error instanceof Error ? error.message : '')
      )
    }
  }

  private extractPageTextNodes(): Text[] {
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script, style, and hidden elements
          const parent = node.parentElement
          if (!parent) return NodeFilter.FILTER_REJECT
          
          const tagName = parent.tagName.toLowerCase()
          if (['script', 'style', 'noscript', 'iframe', 'svg', 'canvas'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT
          }

          // Skip if parent is hidden
          const style = window.getComputedStyle(parent)
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT
          }

          // Skip our own elements
          if (parent.closest('#levellens-container')) {
            return NodeFilter.FILTER_REJECT
          }

          // Only accept text nodes with meaningful content
          const text = node.textContent?.trim() || ''
          if (text.length >= MIN_TEXT_LENGTH) {
            return NodeFilter.FILTER_ACCEPT
          }

          return NodeFilter.FILTER_REJECT
        }
      }
    )

    let node: Node | null
    while (node = walker.nextNode()) {
      textNodes.push(node as Text)
    }

    return textNodes
  }

  private applyAdjustmentToNode(node: Text, originalText: string, adjustedText: string) {
    // Don't modify if texts are the same
    if (originalText === adjustedText) {
      return
    }

    const parent = node.parentElement
    if (!parent) return

    // Create a wrapper span with the adjusted text
    const wrapper = document.createElement('span')
    wrapper.className = 'levellens-adjusted'
    wrapper.style.cssText = `
      background-color: rgba(135, 206, 250, 0.2);
      border-bottom: 2px dotted #007bff;
      cursor: help;
      position: relative;
    `
    wrapper.textContent = adjustedText
    wrapper.title = `Original: ${originalText}`

    // Add click handler to toggle between original and adjusted
    let isAdjusted = true
    wrapper.addEventListener('click', (e) => {
      e.stopPropagation()
      isAdjusted = !isAdjusted
      wrapper.textContent = isAdjusted ? adjustedText : originalText
      wrapper.style.backgroundColor = isAdjusted ? 'rgba(135, 206, 250, 0.2)' : 'rgba(255, 255, 200, 0.3)'
    })

    // Replace the text node with our wrapper
    parent.replaceChild(wrapper, node)
  }

  private showPageAdjustmentProgress(current: number, total: number, message: string = '') {
    let progressBar = document.getElementById('levellens-progress-bar')
    
    if (!progressBar) {
      progressBar = document.createElement('div')
      progressBar.id = 'levellens-progress-bar'
      progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 2147483647;
        padding: 12px 20px;
        backdrop-filter: blur(10px);
      `
      
      const container = document.createElement('div')
      container.style.cssText = `
        max-width: 600px;
        margin: 0 auto;
      `
      
      const header = document.createElement('div')
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      `
      
      const title = document.createElement('div')
      title.id = 'levellens-progress-title'
      title.style.cssText = `
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: #333;
      `
      title.textContent = '✨ Adjusting Page Level...'
      
      const status = document.createElement('div')
      status.id = 'levellens-progress-status'
      status.style.cssText = `
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
        color: #666;
      `
      
      header.appendChild(title)
      header.appendChild(status)
      
      const progressTrack = document.createElement('div')
      progressTrack.style.cssText = `
        height: 4px;
        background: rgba(0, 123, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
      `
      
      const progress = document.createElement('div')
      progress.id = 'levellens-progress-fill'
      progress.style.cssText = `
        height: 100%;
        background: linear-gradient(90deg, #007bff, #00d4ff);
        width: 0%;
        transition: width 0.3s ease;
        border-radius: 4px;
      `
      
      progressTrack.appendChild(progress)
      container.appendChild(header)
      container.appendChild(progressTrack)
      progressBar.appendChild(container)
      document.body.appendChild(progressBar)
    }

    const progressFill = document.getElementById('levellens-progress-fill')
    const statusElement = document.getElementById('levellens-progress-status')
    
    if (progressFill) {
      const percentage = (current / total) * 100
      progressFill.style.width = `${percentage}%`
    }
    
    if (statusElement) {
      statusElement.textContent = message || `${current}/${total}`
    }
  }

  private hidePageAdjustmentProgress() {
    const progressBar = document.getElementById('levellens-progress-bar')
    if (progressBar) {
      setTimeout(() => {
        progressBar.remove()
      }, 500)
    }
  }

  private showCompletionNotification(count?: number) {
    const notification = document.createElement('div')
    notification.className = 'levellens-notification'
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: 2px solid #059669;
      border-radius: 12px;
      padding: 16px 24px;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      animation: slideInRight 0.3s ease;
      color: white;
    `
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 24px;">✅</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">Success!</div>
          <div style="font-size: 12px; opacity: 0.95;">${count ? `Adjusted ${count} sections. ` : ''}Click highlighted text to toggle</div>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    this.autoRemoveNotification(notification, 5000)
  }

  private showErrorNotification(title: string, message: string) {
    const notification = document.createElement('div')
    notification.className = 'levellens-notification'
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: 2px solid #dc2626;
      border-radius: 12px;
      padding: 16px 24px;
      max-width: 360px;
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      animation: slideInRight 0.3s ease;
      color: white;
    `
    
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 24px; flex-shrink: 0;">❌</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
          <div style="font-size: 12px; opacity: 0.95; line-height: 1.4;">${message}</div>
        </div>
        <button 
          onclick="this.closest('.levellens-notification').remove()" 
          style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 0; line-height: 1;"
        >×</button>
      </div>
    `
    
    document.body.appendChild(notification)
    this.autoRemoveNotification(notification, 8000)
  }

  private showWarningNotification(title: string, message: string) {
    const notification = document.createElement('div')
    notification.className = 'levellens-notification'
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border: 2px solid #d97706;
      border-radius: 12px;
      padding: 16px 24px;
      max-width: 360px;
      box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      animation: slideInRight 0.3s ease;
      color: white;
    `
    
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 24px; flex-shrink: 0;">⚠️</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
          <div style="font-size: 12px; opacity: 0.95; line-height: 1.4;">${message}</div>
        </div>
        <button 
          onclick="this.closest('.levellens-notification').remove()" 
          style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 0; line-height: 1;"
        >×</button>
      </div>
    `
    
    document.body.appendChild(notification)
    this.autoRemoveNotification(notification, 7000)
  }


  private showEnhancedLoadingIndicator(x: number, y: number, title: string, subtitle: string) {
    const loader = document.createElement('div')
    loader.id = 'levellens-loading-indicator'
    loader.style.cssText = `
      position: fixed;
      left: ${Math.min(x, window.innerWidth - 280)}px;
      top: ${Math.min(y + 60, window.innerHeight - 120)}px;
      background: rgba(255, 255, 255, 0.98);
      border: 2px solid #007bff;
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: 0 8px 32px rgba(0, 123, 255, 0.15);
      z-index: 2147483646;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      backdrop-filter: blur(20px);
      animation: fadeInScale 0.3s ease;
    `
    
    loader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <div>
          <div style="font-weight: 600; color: #333; font-size: 14px; margin-bottom: 2px;">${title}</div>
          <div style="font-size: 12px; color: #666; opacity: 0.8;">${subtitle}</div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      </style>
    `
    
    document.body.appendChild(loader)
  }

  private showQuickSuccessIndicator(x: number, y: number) {
    const indicator = document.createElement('div')
    indicator.style.cssText = `
      position: fixed;
      left: ${Math.min(x, window.innerWidth - 60)}px;
      top: ${Math.min(y + 40, window.innerHeight - 60)}px;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      font-size: 24px;
      color: white;
      animation: successPop 0.6s ease;
      pointer-events: none;
    `
    
    indicator.innerHTML = `
      ✅
      <style>
        @keyframes successPop {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1); }
        }
      </style>
    `
    
    document.body.appendChild(indicator)
    setTimeout(() => indicator.remove(), 600)
  }

  private detectErrorType(errorMessage?: string): string {
    if (!errorMessage) return 'unknown'
    
    const message = errorMessage.toLowerCase()
    if (message.includes('user activation') || message.includes('interaction')) {
      return 'activation-required'
    } else if (message.includes('download') || message.includes('model')) {
      return 'download-required'
    } else if (message.includes('version') || message.includes('chrome')) {
      return 'version-outdated'
    } else if (message.includes('flag') || message.includes('enable')) {
      return 'flags-disabled'
    } else if (message.includes('setup instructions')) {
      return 'api-unavailable'
    } else if (message.includes('connection') || message.includes('network')) {
      return 'connection-error'
    }
    return 'unknown'
  }

  private getSetupInstructions(): string[] {
    return [
      '1. Use Chrome Canary (not regular Chrome)',
      '2. Go to chrome://flags/#optimization-guide-on-device-model',
      '3. Set to "Enabled BypassPerfRequirement"',
      '4. Go to chrome://flags/#prompt-api-for-gemini-nano',
      '5. Set to "Enabled"',
      '6. Restart Chrome Canary',
      '7. Visit chrome://components/ and update "Optimization Guide On Device Model"'
    ]
  }

  private showEnhancedErrorNotification(title: string, message: string, errorType: string) {
    const notification = document.createElement('div')
    notification.className = 'levellens-notification'
    
    const showInstructions = errorType === 'api-unavailable' || errorType === 'flags-disabled'
    const instructions = showInstructions ? this.getSetupInstructions() : []
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: 2px solid #dc2626;
      border-radius: 16px;
      padding: 20px 24px;
      max-width: ${showInstructions ? '480px' : '360px'};
      box-shadow: 0 8px 32px rgba(239, 68, 68, 0.2);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      animation: slideInRight 0.4s ease;
      color: white;
      backdrop-filter: blur(10px);
    `
    
    const instructionsList = showInstructions ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2);">
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">Setup Instructions:</div>
        <div style="font-size: 12px; line-height: 1.5;">
          ${instructions.map(instruction => `<div style="margin-bottom: 4px;">• ${instruction}</div>`).join('')}
        </div>
      </div>
    ` : ''
    
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 24px; flex-shrink: 0;">❌</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 6px;">${title}</div>
          <div style="font-size: 13px; opacity: 0.95; line-height: 1.4; margin-bottom: 4px;">${message}</div>
          ${instructionsList}
        </div>
        <button 
          onclick="this.closest('.levellens-notification').remove()" 
          style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 4px; line-height: 1; border-radius: 4px; opacity: 0.8; transition: opacity 0.2s;"
          onmouseover="this.style.opacity='1'"
          onmouseout="this.style.opacity='0.8'"
        >×</button>
      </div>
    `
    
    document.body.appendChild(notification)
    this.autoRemoveNotification(notification, showInstructions ? 15000 : 8000)
  }

  private hideLoadingIndicator() {
    const loader = document.getElementById('levellens-loading-indicator')
    if (loader) {
      loader.style.opacity = '0'
      loader.style.transition = 'opacity 0.2s ease'
      setTimeout(() => loader.remove(), 200)
    }
  }

  private autoRemoveNotification(notification: HTMLElement, delay: number) {
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transition = 'opacity 0.3s ease'
      setTimeout(() => notification.remove(), 300)
    }, delay)
  }
}

// Toolbar component
interface ToolbarProps {
  state: ToolbarState
  aiCapabilities: AICapabilities
  settings: UserSettings
  onSimplify: (text: string, x: number, y: number) => void
  onQuiz: (text: string, x: number, y: number) => void
  onClear: () => void
  onClose: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  state, 
  aiCapabilities, 
  settings, 
  onSimplify, 
  onQuiz, 
  onClear, 
  onClose: _onClose 
}) => {
  if (!state.visible) return null

  const showQuiz = aiCapabilities.writer || state.selectedText.length > 50

  console.log('Hilo Toolbar: Rendering with settings.level =', settings.level)

  return (
    <div 
      className="ll-toolbar"
      style={{
        left: state.x - (showQuiz ? 125 : 90),
        top: state.y
      }}
    >
      <button 
        onClick={() => onSimplify(state.selectedText, state.x, state.y)}
        title={`Adjust text to ${settings.level} level ${aiCapabilities.languageModel ? '(AI)' : '(Local)'}`}
      >
        {aiCapabilities.languageModel ? '🤖' : '📚'} Adjust to {settings.level}
      </button>
      
      {showQuiz && (
        <button 
          className="secondary" 
          onClick={() => onQuiz(state.selectedText, state.x, state.y)}
          title={`Generate quiz ${aiCapabilities.writer ? '(AI Writer)' : '(Local)'}`}
        >
          {aiCapabilities.writer ? '🤖' : '📝'} Quiz
        </button>
      )}
      
      <button className="secondary" onClick={onClear} title="Clear all overlays">
        Clear
      </button>
    </div>
  )
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new HiloContentScript()
  })
} else {
  new HiloContentScript()
}