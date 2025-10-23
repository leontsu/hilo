import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import type { UserSettings, SimplificationResponse } from '../types'

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
}

class LevelLensContentScript {
  private shadowRoot: ShadowRoot | null = null
  private toolbarRoot: any = null
  private activeOverlays: Map<string, SimplificationOverlay> = new Map()
  private settings: UserSettings = { level: 'B1', outputLanguage: 'en', enabled: true }

  constructor() {
    this.init()
  }

  private async init() {
    // Don't initialize on YouTube (handled by separate script)
    if (window.location.hostname.includes('youtube.com')) {
      return
    }

    // Load settings
    await this.loadSettings()
    
    // Create shadow DOM container
    this.createShadowContainer()
    
    // Setup event listeners
    this.setupEventListeners()
    
    console.log('LevelLens content script initialized')
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
        onSimplify={this.handleSimplify.bind(this)}
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
        onSimplify={() => {}}
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
    
    overlay.innerHTML = `
      <div class="ll-overlay-header">
        <span>LevelLens (${this.settings.level})</span>
        <button class="ll-overlay-close" data-overlay-id="${overlayId}">×</button>
      </div>
      <div class="ll-overlay-content">${data.simplified}</div>
      ${data.summary ? `<div class="ll-overlay-summary">${data.summary}</div>` : ''}
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
      summary: data.summary || ''
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
  onSimplify: (text: string, x: number, y: number) => void
  onClear: () => void
  onClose: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({ state, onSimplify, onClear, onClose }) => {
  if (!state.visible) return null

  return (
    <div 
      className="ll-toolbar"
      style={{
        left: state.x - 80,
        top: state.y
      }}
    >
      <button onClick={() => onSimplify(state.selectedText, state.x, state.y)}>
        Simplify
      </button>
      <button className="secondary" onClick={onClear}>
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