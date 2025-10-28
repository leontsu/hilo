import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { getSettings, saveSettings, getStatistics } from '../lib/storage'
import type { CEFRLevel, OutputLanguage, UserSettings, AICapabilities, UsageStatistics } from '../types'

const CEFR_LEVELS: { value: CEFRLevel; label: string; description: string }[] = [
  { value: 'A1', label: 'A1 - Beginner', description: 'Very simple words and phrases' },
  { value: 'A2', label: 'A2 - Elementary', description: 'Common everyday expressions' },
  { value: 'B1', label: 'B1 - Intermediate', description: 'Clear standard language' },
  { value: 'B2', label: 'B2 - Upper Intermediate', description: 'Complex topics and ideas' },
  { value: 'C1', label: 'C1 - Advanced', description: 'Flexible and effective language' }
]

const OUTPUT_LANGUAGES: { value: OutputLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' }
]

const PopupApp: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    level: 'B1',
    outputLanguage: 'en',
    enabled: true
  })
  const [aiCapabilities, setAiCapabilities] = useState<AICapabilities>({
    languageModel: false,
    summarizer: false,
    translator: false,
    writer: false
  })
  const [statistics, setStatistics] = useState<UsageStatistics>({
    totalSimplifications: 0,
    totalQuizzes: 0,
    totalTranslations: 0,
    totalWords: 0,
    todaySimplifications: 0,
    todayQuizzes: 0,
    todayTranslations: 0,
    todayWords: 0,
    lastResetDate: new Date().toDateString()
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adjustingPage, setAdjustingPage] = useState(false)
  const [pageAdjustError, setPageAdjustError] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
    checkAICapabilities()
    loadStatistics()
  }, [])

  const loadSettings = async () => {
    try {
      const currentSettings = await getSettings()
      setSettings(currentSettings)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAICapabilities = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_AI_CAPABILITIES' })
      if (response.success) {
        setAiCapabilities(response.data.capabilities)
      }
    } catch (error) {
      console.error('Error checking AI capabilities:', error)
    }
  }

  const loadStatistics = async () => {
    try {
      const currentStats = await getStatistics()
      setStatistics(currentStats)
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }

  const handleSettingChange = async (key: keyof UserSettings, value: any) => {
    setSaving(true)
    try {
      const newSettings = { ...settings, [key]: value }
      await saveSettings({ [key]: value })
      setSettings(newSettings)
    } catch (error) {
      console.error('Error saving setting:', error)
    } finally {
      setSaving(false)
    }
  }

  const adjustCurrentPage = async () => {
    setAdjustingPage(true)
    setPageAdjustError(null)
    
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      
      if (!tab.id) {
        throw new Error('No active tab found')
      }

      // Check if the tab URL is valid for content scripts
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('Cannot adjust level on browser pages. Please navigate to a regular webpage.')
      }

      // Send message to content script to adjust the entire page
      await chrome.tabs.sendMessage(tab.id, {
        type: 'ADJUST_PAGE',
        settings: settings
      })

      // Close popup after triggering adjustment
      setTimeout(() => window.close(), 500)
    } catch (error) {
      console.error('Error adjusting page:', error)
      setAdjustingPage(false)
      setPageAdjustError(
        error instanceof Error 
          ? error.message 
          : 'Failed to adjust page level. Make sure the content script is loaded and try refreshing the page.'
      )
      
      // Clear error after 5 seconds
      setTimeout(() => setPageAdjustError(null), 5000)
    }
  }

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage()
  }

  if (loading) {
    return (
      <div className="popup-container">
        <header className="popup-header">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="logo-text">
              <h1>Hilo</h1>
              <p>Adaptive Translator</p>
            </div>
          </div>
        </header>
        <main className="popup-main">
          <div className="skeleton-loader">
            <div className="skeleton-box skeleton-toggle"></div>
            <div className="skeleton-box skeleton-button"></div>
            <div className="skeleton-box skeleton-select"></div>
            <div className="skeleton-box skeleton-select"></div>
            <div className="skeleton-box skeleton-grid">
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo-section">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1>Hilo</h1>
            <p>Adaptive Translator</p>
          </div>
        </div>
      </header>

      <main className="popup-main">
        <div className="setting-group main-toggle">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleSettingChange('enabled', e.target.checked)}
              disabled={saving}
            />
            <span className="checkmark"></span>
            <span className="toggle-text">
              <span className="toggle-title">Enable Hilo</span>
              <span className="toggle-status">{settings.enabled ? 'Active' : 'Inactive'}</span>
            </span>
          </label>
        </div>

        <div className="page-actions">
          <div className="page-actions-header">
            <h3>🌐 Page Actions</h3>
          </div>
          <button 
            onClick={adjustCurrentPage}
            className="adjust-page-button"
            disabled={!settings.enabled || saving || adjustingPage}
          >
            {adjustingPage ? (
              <>
                <span className="button-icon loading">⏳</span>
                <div className="button-content">
                  <div className="button-title">Starting...</div>
                  <div className="button-description">Adjusting page level</div>
                </div>
              </>
            ) : (
              <>
                <span className="button-icon">→</span>
                <div className="button-content">
                  <div className="button-title">Adjust Entire Page</div>
                  <div className="button-description">Change all text to {settings.level} level</div>
                </div>
              </>
            )}
          </button>
          {pageAdjustError && (
            <div className="page-adjust-error">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{pageAdjustError}</span>
            </div>
          )}
        </div>

        <div className="setting-group">
          <label className="setting-title">CEFR Level</label>
          <select
            value={settings.level}
            onChange={(e) => handleSettingChange('level', e.target.value as CEFRLevel)}
            disabled={saving || !settings.enabled}
            className="setting-select"
          >
            {CEFR_LEVELS.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <p className="setting-description">
            {CEFR_LEVELS.find(l => l.value === settings.level)?.description}
          </p>
        </div>

        <div className="setting-group">
          <label className="setting-title">Output Language</label>
          <select
            value={settings.outputLanguage}
            onChange={(e) => handleSettingChange('outputLanguage', e.target.value as OutputLanguage)}
            disabled={saving || !settings.enabled}
            className="setting-select"
          >
            {OUTPUT_LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="capabilities-section">
          <h3 className="section-title">System Status</h3>
          <div className="capabilities-grid">
            <div className={`capability-item ${aiCapabilities.languageModel ? 'active' : 'inactive'}`}>
              <div className="capability-icon">{aiCapabilities.languageModel ? '●' : '○'}</div>
              <div className="capability-label">Level Adjust</div>
            </div>
            <div className={`capability-item ${aiCapabilities.writer ? 'active' : 'inactive'}`}>
              <div className="capability-icon">{aiCapabilities.writer ? '●' : '○'}</div>
              <div className="capability-label">Quiz</div>
            </div>
            <div className={`capability-item ${aiCapabilities.translator ? 'active' : 'inactive'}`}>
              <div className="capability-icon">{aiCapabilities.translator ? '●' : '○'}</div>
              <div className="capability-label">Translation</div>
            </div>
            <div className={`capability-item ${aiCapabilities.summarizer ? 'active' : 'inactive'}`}>
              <div className="capability-icon">{aiCapabilities.summarizer ? '●' : '○'}</div>
              <div className="capability-label">Summary</div>
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h3 className="section-title">Usage</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-value">{statistics.todaySimplifications}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{statistics.totalSimplifications}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{statistics.todayWords}</div>
              <div className="stat-label">Words</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{statistics.todayQuizzes + statistics.todayTranslations}</div>
              <div className="stat-label">Actions</div>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <h3 className="section-title">How to Use</h3>
          <div className="guide-steps">
            <div className="guide-step">
              <span className="step-number">1</span>
              <span className="step-text">Highlight text on any page</span>
            </div>
            <div className="guide-step">
              <span className="step-number">2</span>
              <span className="step-text">Click Adjust Level, Quiz, or Translate</span>
            </div>
            <div className="guide-step">
              <span className="step-number">3</span>
              <span className="step-text">View adjusted text with toggle</span>
            </div>
          </div>
        </div>

      </main>

      <footer className="popup-footer">
        <button onClick={openOptionsPage} className="footer-link">
          Advanced Settings →
        </button>
      </footer>
    </div>
  )
}

// Initialize popup
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<PopupApp />)
}