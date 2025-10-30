import type { UserSettings, CEFRLevel, UsageStatistics } from '../types'

const DEFAULT_SETTINGS: UserSettings = {
  level: 'B1',
  enabled: true
}

export async function getSettings(): Promise<UserSettings> {
  try {
    const result = await chrome.storage.sync.get(['level', 'enabled'])
    return {
      level: (result.level as CEFRLevel) || DEFAULT_SETTINGS.level,
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

export async function updateEnabled(enabled: boolean): Promise<void> {
  await saveSettings({ enabled })
}

export function onSettingsChanged(callback: (changes: chrome.storage.StorageChange, areaName: string) => void): void {
  chrome.storage.onChanged.addListener(callback)
}

export function removeSettingsListener(callback: (changes: chrome.storage.StorageChange, areaName: string) => void): void {
  chrome.storage.onChanged.removeListener(callback)
}

const DEFAULT_STATISTICS: UsageStatistics = {
  totalSimplifications: 0,
  totalQuizzes: 0,
  totalWords: 0,
  todaySimplifications: 0,
  todayQuizzes: 0,
  todayWords: 0,
  lastResetDate: new Date().toDateString()
}

export async function getStatistics(): Promise<UsageStatistics> {
  try {
    const result = await chrome.storage.local.get(['statistics'])
    const stats = result.statistics || DEFAULT_STATISTICS
    
    // Check if we need to reset daily stats
    const today = new Date().toDateString()
    if (stats.lastResetDate !== today) {
      const resetStats = {
        ...stats,
        todaySimplifications: 0,
        todayQuizzes: 0,
        todayWords: 0,
        lastResetDate: today
      }
      await saveStatistics(resetStats)
      return resetStats
    }
    
    return stats
  } catch (error) {
    console.error('Error getting statistics:', error)
    return DEFAULT_STATISTICS
  }
}

export async function saveStatistics(statistics: UsageStatistics): Promise<void> {
  try {
    await chrome.storage.local.set({ statistics })
  } catch (error) {
    console.error('Error saving statistics:', error)
    throw error
  }
}

export async function incrementSimplification(wordCount: number): Promise<void> {
  const stats = await getStatistics()
  const newStats = {
    ...stats,
    totalSimplifications: stats.totalSimplifications + 1,
    totalWords: stats.totalWords + wordCount,
    todaySimplifications: stats.todaySimplifications + 1,
    todayWords: stats.todayWords + wordCount
  }
  await saveStatistics(newStats)
}

export async function incrementQuiz(): Promise<void> {
  const stats = await getStatistics()
  const newStats = {
    ...stats,
    totalQuizzes: stats.totalQuizzes + 1,
    todayQuizzes: stats.todayQuizzes + 1
  }
  await saveStatistics(newStats)
}