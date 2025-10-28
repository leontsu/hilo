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
  private aiCapabilities: AICapabilities = { languageModel: false, summarizer: false, writer: false }
  private currentToolbarState: ToolbarState | null = null

  constructor() {
    this.init()
  }

  private async init() {
    // Don't initialize on YouTube (handled by separate script)
    if (window.location.hostname.includes('youtube.com')) {
      return
    }

    // Load settings and check AI capabilities
    await this.loadSettings()
    await this.checkAICapabilities()
    
    // Create shadow DOM container
    this.createShadowContainer()
    
    // Setup event listeners
    this.setupEventListeners()
    
    console.log('Hilo content script initialized with AI capabilities:', this.aiCapabilities)
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
    // Show loading indicator
    this.showLoadingIndicator(x, y, 'Adjusting level...')
    
    try {
      // Send adjustment request to background
      const response = await chrome.runtime.sendMessage({
        type: 'SIMPLIFY_TEXT',
        text: selectedText,
        settings: this.settings
      })

      this.hideLoadingIndicator()

      if (response.success) {
        this.showSimplificationOverlay(response.data, x, y)
      } else {
        console.error('Level adjustment failed:', response.error)
        this.showErrorNotification(
          'Adjustment Failed',
          response.error || 'Unable to adjust the selected text. Please try again.'
        )
      }
    } catch (error) {
      this.hideLoadingIndicator()
      console.error('Error during level adjustment:', error)
      this.showErrorNotification(
        'Connection Error',
        'Could not connect to the adjustment service. Please check your connection and try again.'
      )
    }
    
    this.hideToolbar()
  }

  private async handleQuiz(selectedText: string, x: number, y: number) {
    // Show loading indicator
    this.showLoadingIndicator(x, y, 'Generating quiz...')
    
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
      } else {
        console.error('Quiz generation failed:', response.error)
        this.showErrorNotification(
          'Quiz Generation Failed',
          response.error || 'Unable to generate quiz questions. Please try again.'
        )
      }
    } catch (error) {
      this.hideLoadingIndicator()
      console.error('Error during quiz generation:', error)
      this.showErrorNotification(
        'Connection Error',
        'Could not connect to the quiz service. Please check your connection and try again.'
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
        this.showErrorNotification(
          'Adjustment Failed',
          'Could not adjust any text on this page. Please try again or check your connection.'
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
      this.showErrorNotification(
        'Adjustment Error',
        error instanceof Error ? error.message : 'An unexpected error occurred during page adjustment.'
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

  private showLoadingIndicator(x: number, y: number, message: string) {
    const loader = document.createElement('div')
    loader.id = 'levellens-loading-indicator'
    loader.style.cssText = `
      position: fixed;
      left: ${Math.min(x, window.innerWidth - 200)}px;
      top: ${Math.min(y + 60, window.innerHeight - 100)}px;
      background: rgba(255, 255, 255, 0.98);
      border: 2px solid #007bff;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 4px 20px rgba(0, 123, 255, 0.2);
      z-index: 2147483646;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      backdrop-filter: blur(10px);
    `
    
    loader.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <div style="font-weight: 500; color: #333;">${message}</div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `
    
    document.body.appendChild(loader)
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