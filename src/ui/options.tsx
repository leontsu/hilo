import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { getSettings, saveSettings } from '../lib/storage'
import type { CEFRLevel, OutputLanguage, UserSettings } from '../types'

const CEFR_LEVELS: { value: CEFRLevel; label: string; description: string; examples: string[] }[] = [
  {
    value: 'A1',
    label: 'A1 - Beginner',
    description: 'Basic words and simple phrases for everyday situations',
    examples: ['I am happy', 'The cat is big', 'This is my book']
  },
  {
    value: 'A2',
    label: 'A2 - Elementary',
    description: 'Common expressions and simple descriptions',
    examples: ['I work in an office', 'The weather is nice today', 'I like this restaurant']
  },
  {
    value: 'B1',
    label: 'B1 - Intermediate',
    description: 'Clear language about familiar topics',
    examples: ['I can explain my opinion', 'The project was successful', 'We need to solve this problem']
  },
  {
    value: 'B2',
    label: 'B2 - Upper Intermediate',
    description: 'Complex ideas and abstract concepts',
    examples: ['The analysis reveals important trends', 'This approach facilitates better results', 'The implications are significant']
  },
  {
    value: 'C1',
    label: 'C1 - Advanced',
    description: 'Sophisticated and flexible language use',
    examples: ['The methodology demonstrates comprehensive understanding', 'This paradigm encompasses multiple dimensions', 'The framework facilitates systematic evaluation']
  }
]

const OUTPUT_LANGUAGES: { value: OutputLanguage; label: string; description: string }[] = [
  { value: 'en', label: 'English', description: 'Simplify text while keeping English language' },
  { value: 'ja', label: '日本語 (Japanese)', description: 'Translate and simplify to Japanese' }
]

const OptionsApp: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    level: 'B1',
    outputLanguage: 'en',
    enabled: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

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
    setSaveMessage('')
    
    try {
      const newSettings = { ...settings, [key]: value }
      await saveSettings({ [key]: value })
      setSettings(newSettings)
      setSaveMessage('Settings saved successfully!')
      
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving setting:', error)
      setSaveMessage('Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSaving(true)
      try {
        const defaultSettings: UserSettings = {
          level: 'B1',
          outputLanguage: 'en',
          enabled: true
        }
        await saveSettings(defaultSettings)
        setSettings(defaultSettings)
        setSaveMessage('Settings reset to defaults!')
        setTimeout(() => setSaveMessage(''), 3000)
      } catch (error) {
        console.error('Error resetting settings:', error)
        setSaveMessage('Error resetting settings.')
      } finally {
        setSaving(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="options-container">
        <div className="loading">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>LevelLens Settings</h1>
        <p>Configure your adaptive translation preferences</p>
      </header>

      <main className="options-main">
        <section className="settings-section">
          <h2>General Settings</h2>
          
          <div className="setting-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                disabled={saving}
              />
              <span className="checkmark"></span>
              Enable LevelLens on all websites
            </label>
            <p className="setting-help">
              When disabled, LevelLens will not process any text or show simplification options.
            </p>
          </div>
        </section>

        <section className="settings-section">
          <h2>Language Level (CEFR)</h2>
          <p className="section-description">
            Choose your target language complexity level based on the Common European Framework of Reference (CEFR).
          </p>
          
          <div className="level-cards">
            {CEFR_LEVELS.map(level => (
              <div 
                key={level.value}
                className={`level-card ${settings.level === level.value ? 'selected' : ''}`}
                onClick={() => handleSettingChange('level', level.value)}
              >
                <div className="level-header">
                  <input
                    type="radio"
                    name="level"
                    value={level.value}
                    checked={settings.level === level.value}
                    onChange={() => handleSettingChange('level', level.value)}
                    disabled={saving || !settings.enabled}
                  />
                  <h3>{level.label}</h3>
                </div>
                <p className="level-description">{level.description}</p>
                <div className="level-examples">
                  <strong>Examples:</strong>
                  <ul>
                    {level.examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2>Output Language</h2>
          
          <div className="language-options">
            {OUTPUT_LANGUAGES.map(lang => (
              <label key={lang.value} className="language-option">
                <input
                  type="radio"
                  name="outputLanguage"
                  value={lang.value}
                  checked={settings.outputLanguage === lang.value}
                  onChange={() => handleSettingChange('outputLanguage', lang.value)}
                  disabled={saving || !settings.enabled}
                />
                <div className="language-info">
                  <h3>{lang.label}</h3>
                  <p>{lang.description}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2>Usage Instructions</h2>
          <div className="instructions">
            <div className="instruction-item">
              <h3>📄 Web Pages</h3>
              <p>Select any text (8+ characters) to see the simplification toolbar. Click "Simplify" to get an easier version.</p>
            </div>
            <div className="instruction-item">
              <h3>🎥 YouTube</h3>
              <p>Click the "EASY" button that appears on YouTube videos to enable simplified captions.</p>
            </div>
            <div className="instruction-item">
              <h3>⚙️ Settings</h3>
              <p>Changes take effect immediately. All your settings are synced across your Chrome browsers.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="options-footer">
        <div className="footer-actions">
          <button 
            onClick={resetToDefaults}
            disabled={saving}
            className="secondary-button"
          >
            Reset to Defaults
          </button>
          
          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
              {saveMessage}
            </div>
          )}
        </div>
        
        <div className="footer-info">
          <p>LevelLens v1.0.0 - Adaptive Language Learning Chrome Extension</p>
        </div>
      </footer>
    </div>
  )
}

// Initialize options page
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<OptionsApp />)
}