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

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage()
  }

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo-section">
          <div className="logo-icon">🔍</div>
          <div className="logo-text">
            <h1>LevelLens</h1>
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
              <span className="toggle-title">Enable LevelLens</span>
              <span className="toggle-status">{settings.enabled ? 'Active' : 'Inactive'}</span>
            </span>
          </label>
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

        <div className="ai-status">
          <div className="ai-status-header">
            <h3>🤖 AI Capabilities</h3>
            <div className="ai-status-indicator">
              <div className={`status-dot ${Object.values(aiCapabilities).some(v => v) ? 'active' : 'inactive'}`}></div>
              <span className="status-text">
                {Object.values(aiCapabilities).filter(v => v).length}/{Object.values(aiCapabilities).length} Available
              </span>
            </div>
          </div>
          <div className="ai-capabilities">
            <div className={`ai-capability ${aiCapabilities.languageModel ? 'available' : 'unavailable'}`}>
              <div className="capability-icon">{aiCapabilities.languageModel ? '🤖' : '📚'}</div>
              <div className="capability-info">
                <div className="capability-name">Simplification</div>
                <div className="capability-type">{aiCapabilities.languageModel ? 'AI-Powered' : 'Basic'}</div>
              </div>
            </div>
            <div className={`ai-capability ${aiCapabilities.writer ? 'available' : 'unavailable'}`}>
              <div className="capability-icon">{aiCapabilities.writer ? '🤖' : '📝'}</div>
              <div className="capability-info">
                <div className="capability-name">Quiz Generation</div>
                <div className="capability-type">{aiCapabilities.writer ? 'AI-Powered' : 'Basic'}</div>
              </div>
            </div>
            <div className={`ai-capability ${aiCapabilities.translator ? 'available' : 'unavailable'}`}>
              <div className="capability-icon">{aiCapabilities.translator ? '🤖' : '🌐'}</div>
              <div className="capability-info">
                <div className="capability-name">Translation</div>
                <div className="capability-type">{aiCapabilities.translator ? 'AI-Powered' : 'Basic'}</div>
              </div>
            </div>
            <div className={`ai-capability ${aiCapabilities.summarizer ? 'available' : 'unavailable'}`}>
              <div className="capability-icon">{aiCapabilities.summarizer ? '🤖' : '📄'}</div>
              <div className="capability-info">
                <div className="capability-name">Summarization</div>
                <div className="capability-type">{aiCapabilities.summarizer ? 'AI-Powered' : 'Basic'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="statistics-section">
          <div className="statistics-header">
            <h3>📊 Usage Statistics</h3>
          </div>
          <div className="statistics-grid">
            <div className="stat-card today">
              <div className="stat-header">
                <div className="stat-title">Today</div>
                <div className="stat-icon">🌟</div>
              </div>
              <div className="stat-metrics">
                <div className="stat-metric">
                  <div className="metric-value">{statistics.todaySimplifications}</div>
                  <div className="metric-label">Simplified</div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">{statistics.todayWords}</div>
                  <div className="metric-label">Words</div>
                </div>
              </div>
            </div>
            <div className="stat-card total">
              <div className="stat-header">
                <div className="stat-title">All Time</div>
                <div className="stat-icon">🏆</div>
              </div>
              <div className="stat-metrics">
                <div className="stat-metric">
                  <div className="metric-value">{statistics.totalSimplifications}</div>
                  <div className="metric-label">Simplified</div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">{statistics.totalWords}</div>
                  <div className="metric-label">Words</div>
                </div>
              </div>
            </div>
          </div>
          <div className="activity-summary">
            <div className="activity-item">
              <span className="activity-icon">🧠</span>
              <span className="activity-text">{statistics.todayQuizzes} quizzes today</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🌐</span>
              <span className="activity-text">{statistics.todayTranslations} translations today</span>
            </div>
          </div>
        </div>

        <div className="usage-info">
          <div className="usage-header">
            <h3>📖 Quick Guide</h3>
          </div>
          <div className="usage-steps">
            <div className="usage-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <div className="step-title">Select Text</div>
                <div className="step-description">Highlight 8+ characters on any webpage</div>
              </div>
            </div>
            <div className="usage-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <div className="step-title">Choose Action</div>
                <div className="step-description">Simplify, Quiz, or Translate the selected text</div>
              </div>
            </div>
            <div className="usage-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <div className="step-title">YouTube Support</div>
                <div className="step-description">Use "EASY" button for simplified captions</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="popup-footer">
        <button onClick={openOptionsPage} className="settings-button">
          <span className="settings-icon">⚙️</span>
          Advanced Settings
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