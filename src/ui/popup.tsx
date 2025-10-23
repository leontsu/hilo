import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { getSettings, saveSettings } from '../lib/storage'
import type { CEFRLevel, OutputLanguage, UserSettings } from '../types'

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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
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
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>LevelLens</h1>
        <p>Adaptive Translator</p>
      </header>

      <main className="popup-main">
        <div className="setting-group">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleSettingChange('enabled', e.target.checked)}
              disabled={saving}
            />
            <span className="checkmark"></span>
            Enable LevelLens
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

        <div className="usage-info">
          <h3>How to use:</h3>
          <ul>
            <li>Select text on any webpage (8+ characters)</li>
            <li>Click "Simplify" to get easier version</li>
            <li>For YouTube: Enable "EASY" button for captions</li>
          </ul>
        </div>
      </main>

      <footer className="popup-footer">
        <button onClick={openOptionsPage} className="link-button">
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