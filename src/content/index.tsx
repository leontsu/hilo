import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { UserSettings, SimplificationResponse, QuizResponse, TranslationResponse, AICapabilities } from '../types'

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
  translation?: string
  quiz?: QuizResponse
}

class LevelLensContentScript {
  private shadowRoot: ShadowRoot | null = null
  private toolbarRoot: any = null
  private activeOverlays: Map<string, SimplificationOverlay> = new Map()
  private settings: UserSettings = { level: 'B1', outputLanguage: 'en', enabled: true }
  private aiCapabilities: AICapabilities = { languageModel: false, summarizer: false, translator: false, writer: false }

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
    
    console.log('LevelLens content script initialized with AI capabilities:', this.aiCapabilities)
  }

  private async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
      if (response.success) {
        this.settings = response.data
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
    
    // Listen for settings changes
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'SETTINGS_CHANGED') {
        this.loadSettings()
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

    this.toolbarRoot.render(
      <Toolbar
        state={state}
        aiCapabilities={this.aiCapabilities}
        settings={this.settings}
        onSimplify={this.handleSimplify.bind(this)}
        onQuiz={this.handleQuiz.bind(this)}
        onTranslate={this.handleTranslate.bind(this)}
        onClear={this.handleClear.bind(this)}
        onClose={this.hideToolbar.bind(this)}
      />
    )
  }

  private hideToolbar() {
    if (!this.toolbarRoot) return
    
    this.toolbarRoot.render(
      <Toolbar
        state={{ visible: false, x: 0, y: 0, selectedText: '' }}
        aiCapabilities={this.aiCapabilities}
        settings={this.settings}
        onSimplify={() => {}}
        onQuiz={() => {}}
        onTranslate={() => {}}
        onClear={() => {}}
        onClose={() => {}}
      />
    )
  }

  private async handleSimplify(selectedText: string, x: number, y: number) {
    try {
      // Send simplification request to background
      const response = await chrome.runtime.sendMessage({
        type: 'SIMPLIFY_TEXT',
        text: selectedText,
        settings: this.settings
      })

      if (response.success) {
        this.showSimplificationOverlay(response.data, x, y)
      } else {
        console.error('Simplification failed:', response.error)
      }
    } catch (error) {
      console.error('Error during simplification:', error)
    }
    
    this.hideToolbar()
  }

  private async handleQuiz(selectedText: string, x: number, y: number) {
    try {
      // Send quiz generation request to background
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_QUIZ',
        text: selectedText,
        settings: this.settings
      })

      if (response.success) {
        this.showQuizOverlay(response.data, selectedText, x, y)
      } else {
        console.error('Quiz generation failed:', response.error)
      }
    } catch (error) {
      console.error('Error during quiz generation:', error)
    }
    
    this.hideToolbar()
  }

  private async handleTranslate(selectedText: string, x: number, y: number) {
    try {
      // Send translation request to background
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        text: selectedText,
        settings: this.settings
      })

      if (response.success) {
        this.showTranslationOverlay(response.data, x, y)
      } else {
        console.error('Translation failed:', response.error)
      }
    } catch (error) {
      console.error('Error during translation:', error)
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
    
    const hasTranslation = data.translation && data.translation.length > 0
    const hasQuiz = data.quiz && data.quiz.length > 0
    
    overlay.innerHTML = `
      <div class="ll-overlay-header">
        <span>LevelLens (${this.settings.level}) ${this.aiCapabilities.languageModel ? '🤖' : '📚'}</span>
        <button class="ll-overlay-close" data-overlay-id="${overlayId}">×</button>
      </div>
      <div class="ll-overlay-content">${data.simplified}</div>
      ${data.summary ? `<div class="ll-overlay-summary">${data.summary}</div>` : ''}
      ${hasTranslation ? `
        <div class="ll-overlay-section">
          <div class="ll-overlay-section-title">Translation (${this.settings.outputLanguage.toUpperCase()}):</div>
          <div class="ll-overlay-translation">${data.translation}</div>
        </div>
      ` : ''}
      ${hasQuiz ? `
        <div class="ll-overlay-section">
          <div class="ll-overlay-section-title">Quick Quiz:</div>
          <div class="ll-overlay-quiz">
            ${data.quiz.map((q, i) => `
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
      translation: data.translation,
      quiz: data.quiz
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
        <span>LevelLens Quiz (${this.settings.level}) ${this.aiCapabilities.writer ? '🤖' : '📝'}</span>
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

  private showTranslationOverlay(translationData: TranslationResponse, x: number, y: number) {
    const overlay = document.createElement('div')
    overlay.className = 'll-overlay ll-translation-overlay'
    overlay.style.cssText = `
      position: fixed;
      left: ${Math.min(x, window.innerWidth - 420)}px;
      top: ${Math.min(y + 60, window.innerHeight - 200)}px;
      z-index: 2147483646;
    `
    
    const overlayId = Date.now().toString()
    
    overlay.innerHTML = `
      <div class="ll-overlay-header">
        <span>LevelLens Translation ${this.aiCapabilities.translator ? '🤖' : '🌐'}</span>
        <button class="ll-overlay-close" data-overlay-id="${overlayId}">×</button>
      </div>
      <div class="ll-overlay-content">
        <div class="translation-pair">
          <div class="source-text">
            <div class="language-label">${translationData.sourceLanguage.toUpperCase()}:</div>
            <div class="text-content">${translationData.originalText}</div>
          </div>
          <div class="target-text">
            <div class="language-label">${translationData.targetLanguage.toUpperCase()}:</div>
            <div class="text-content">${translationData.translatedText}</div>
          </div>
        </div>
      </div>
    `
    
    // Add close button listener
    overlay.querySelector('.ll-overlay-close')?.addEventListener('click', () => {
      this.removeOverlay(overlayId)
    })
    
    document.body.appendChild(overlay)
    
    this.activeOverlays.set(overlayId, {
      id: overlayId,
      element: overlay,
      originalText: translationData.originalText,
      simplified: '',
      summary: '',
      translation: translationData.translatedText
    })
  }

  private removeOverlay(overlayId: string) {
    const overlay = this.activeOverlays.get(overlayId)
    if (overlay) {
      overlay.element.remove()
      this.activeOverlays.delete(overlayId)
    }
  }
}

// Toolbar component
interface ToolbarProps {
  state: ToolbarState
  aiCapabilities: AICapabilities
  settings: UserSettings
  onSimplify: (text: string, x: number, y: number) => void
  onQuiz: (text: string, x: number, y: number) => void
  onTranslate: (text: string, x: number, y: number) => void
  onClear: () => void
  onClose: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  state, 
  aiCapabilities, 
  settings, 
  onSimplify, 
  onQuiz, 
  onTranslate, 
  onClear, 
  onClose 
}) => {
  if (!state.visible) return null

  const showTranslate = settings.outputLanguage === 'ja' || aiCapabilities.translator
  const showQuiz = aiCapabilities.writer || state.selectedText.length > 50

  return (
    <div 
      className="ll-toolbar"
      style={{
        left: state.x - (showTranslate && showQuiz ? 140 : showTranslate || showQuiz ? 110 : 80),
        top: state.y
      }}
    >
      <button 
        onClick={() => onSimplify(state.selectedText, state.x, state.y)}
        title={`Simplify text to ${settings.level} level ${aiCapabilities.languageModel ? '(AI)' : '(Local)'}`}
      >
        {aiCapabilities.languageModel ? '🤖' : '📚'} Simplify
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
      
      {showTranslate && (
        <button 
          className="secondary" 
          onClick={() => onTranslate(state.selectedText, state.x, state.y)}
          title={`Translate to ${settings.outputLanguage.toUpperCase()} ${aiCapabilities.translator ? '(AI)' : '(Local)'}`}
        >
          {aiCapabilities.translator ? '🤖' : '🌐'} Translate
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
    new LevelLensContentScript()
  })
} else {
  new LevelLensContentScript()
}