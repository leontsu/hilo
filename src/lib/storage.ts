import type { UserSettings, CEFRLevel, OutputLanguage } from '../types'

const DEFAULT_SETTINGS: UserSettings = {
  level: 'B1',
  outputLanguage: 'en',
  enabled: true
}

export async function getSettings(): Promise<UserSettings> {
  try {
    const result = await chrome.storage.sync.get(['level', 'outputLanguage', 'enabled'])
    return {
      level: (result.level as CEFRLevel) || DEFAULT_SETTINGS.level,
      outputLanguage: (result.outputLanguage as OutputLanguage) || DEFAULT_SETTINGS.outputLanguage,
      enabled: result.enabled !== undefined ? result.enabled : DEFAULT_SETTINGS.enabled
    }
  } catch (error) {
    console.error('Error getting settings:', error)
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  try {
    await chrome.storage.sync.set(settings)
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
}

export async function updateLevel(level: CEFRLevel): Promise<void> {
  await saveSettings({ level })
}

export async function updateOutputLanguage(outputLanguage: OutputLanguage): Promise<void> {
  await saveSettings({ outputLanguage })
}

export async function updateEnabled(enabled: boolean): Promise<void> {
  await saveSettings({ enabled })
}

export function onSettingsChanged(callback: (changes: chrome.storage.StorageChange, areaName: string) => void): void {
  chrome.storage.onChanged.addListener(callback)
}

export function removeSettingsListener(callback: (changes: chrome.storage.StorageChange, areaName: string) => void): void {
  chrome.storage.onChanged.removeListener(callback)
}