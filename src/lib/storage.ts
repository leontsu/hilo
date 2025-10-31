import type { UserSettings, CEFRLevel, UsageStatistics, CEFRTestSettings, CEFRTestResult, PageAdjustmentCache, PageAdjustmentCacheEntry } from '../types'

const DEFAULT_CEFR_TEST_SETTINGS: CEFRTestSettings = {
  hasCompletedTest: false,
  testResults: [],
  skipInitialTest: false
}

const DEFAULT_SETTINGS: UserSettings = {
  level: 'B1',
  enabled: true,
  cefrTest: DEFAULT_CEFR_TEST_SETTINGS
}

export async function getSettings(): Promise<UserSettings> {
  try {
    const result = await chrome.storage.sync.get(['level', 'enabled', 'cefrTest'])
    return {
      level: (result.level as CEFRLevel) || DEFAULT_SETTINGS.level,
      enabled: result.enabled !== undefined ? result.enabled : DEFAULT_SETTINGS.enabled,
      cefrTest: result.cefrTest || DEFAULT_SETTINGS.cefrTest
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

// CEFR Test specific functions
export async function getCEFRTestSettings(): Promise<CEFRTestSettings> {
  const settings = await getSettings()
  return settings.cefrTest || DEFAULT_CEFR_TEST_SETTINGS
}

export async function saveCEFRTestSettings(cefrTestSettings: Partial<CEFRTestSettings>): Promise<void> {
  const currentSettings = await getSettings()
  const updatedTestSettings = {
    ...currentSettings.cefrTest,
    ...cefrTestSettings
  }
  
  await saveSettings({
    cefrTest: updatedTestSettings as CEFRTestSettings
  })
}

export async function saveTestResult(result: CEFRTestResult): Promise<void> {
  const testSettings = await getCEFRTestSettings()
  const updatedSettings: CEFRTestSettings = {
    ...testSettings,
    hasCompletedTest: true,
    lastTestDate: result.testDate,
    testResults: [...testSettings.testResults, result]
  }
  
  // Also update the user's CEFR level based on test result
  await Promise.all([
    saveCEFRTestSettings(updatedSettings),
    updateLevel(result.level)
  ])
  
  console.log(`[Storage] Saved test result: Level ${result.level}, Confidence: ${Math.round(result.confidence * 100)}%`)
}

export async function isFirstTimeUser(): Promise<boolean> {
  const testSettings = await getCEFRTestSettings()
  return !testSettings.hasCompletedTest && !testSettings.skipInitialTest
}

export async function skipInitialTest(): Promise<void> {
  await saveCEFRTestSettings({ skipInitialTest: true })
}

export async function getTestHistory(): Promise<CEFRTestResult[]> {
  const testSettings = await getCEFRTestSettings()
  return testSettings.testResults || []
}

export async function getLatestTestResult(): Promise<CEFRTestResult | null> {
  const history = await getTestHistory()
  if (history.length === 0) return null
  
  // Return the most recent test result
  return history.reduce((latest, current) => 
    current.testDate > latest.testDate ? current : latest
  )
}

export async function clearTestHistory(): Promise<void> {
  await saveCEFRTestSettings({
    hasCompletedTest: false,
    lastTestDate: undefined,
    testResults: [],
    skipInitialTest: false
  })
  
  console.log('[Storage] Cleared CEFR test history')
}

export async function retakeTest(): Promise<void> {
  const testSettings = await getCEFRTestSettings()
  await saveCEFRTestSettings({
    ...testSettings,
    hasCompletedTest: false
  })
  
  console.log('[Storage] Enabled test retake')
}

// Page Adjustment Cache functions
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_ENTRIES = 50 // Limit cache size

function getCacheKey(url: string, level: CEFRLevel): string {
  // Normalize URL by removing fragment and query params that don't affect content
  const urlObj = new URL(url)
  const normalizedUrl = `${urlObj.origin}${urlObj.pathname}`
  return `${normalizedUrl}:${level}`
}

export async function getPageAdjustmentCache(): Promise<PageAdjustmentCache> {
  try {
    const result = await chrome.storage.local.get(['pageAdjustmentCache'])
    return result.pageAdjustmentCache || {}
  } catch (error) {
    console.error('Error getting page adjustment cache:', error)
    return {}
  }
}

export async function savePageAdjustmentCache(cache: PageAdjustmentCache): Promise<void> {
  try {
    await chrome.storage.local.set({ pageAdjustmentCache: cache })
  } catch (error) {
    console.error('Error saving page adjustment cache:', error)
    throw error
  }
}

export async function getCachedPageAdjustment(url: string, level: CEFRLevel): Promise<PageAdjustmentCacheEntry | null> {
  const cache = await getPageAdjustmentCache()
  const key = getCacheKey(url, level)
  const entry = cache[key]
  
  if (!entry) {
    return null
  }
  
  // Check if cache entry is expired
  const now = Date.now()
  if (now - entry.timestamp > CACHE_EXPIRY_MS) {
    // Remove expired entry
    delete cache[key]
    await savePageAdjustmentCache(cache)
    return null
  }
  
  return entry
}

export async function setCachedPageAdjustment(
  url: string, 
  level: CEFRLevel, 
  adjustments: PageAdjustmentCacheEntry['adjustments'],
  pageHash?: string
): Promise<void> {
  const cache = await getPageAdjustmentCache()
  const key = getCacheKey(url, level)
  
  // Clean up old entries if cache is too large
  const entries = Object.entries(cache)
  if (entries.length >= MAX_CACHE_ENTRIES) {
    // Remove oldest entries (by timestamp)
    const sortedEntries = entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
    const entriesToRemove = sortedEntries.slice(0, entries.length - MAX_CACHE_ENTRIES + 1)
    
    for (const [keyToRemove] of entriesToRemove) {
      delete cache[keyToRemove]
    }
  }
  
  cache[key] = {
    url,
    level,
    timestamp: Date.now(),
    adjustments,
    pageHash
  }
  
  await savePageAdjustmentCache(cache)
  console.log(`[Storage] Cached page adjustment for ${url} at level ${level}`)
}

export async function clearPageAdjustmentCache(): Promise<void> {
  try {
    await chrome.storage.local.set({ pageAdjustmentCache: {} })
    console.log('[Storage] Cleared page adjustment cache')
  } catch (error) {
    console.error('Error clearing page adjustment cache:', error)
    throw error
  }
}

export async function removeCachedPageAdjustment(url: string, level?: CEFRLevel): Promise<void> {
  const cache = await getPageAdjustmentCache()
  
  if (level) {
    // Remove specific level cache
    const key = getCacheKey(url, level)
    delete cache[key]
  } else {
    // Remove all levels for this URL
    const urlObj = new URL(url)
    const normalizedUrl = `${urlObj.origin}${urlObj.pathname}`
    
    for (const key in cache) {
      if (key.startsWith(`${normalizedUrl}:`)) {
        delete cache[key]
      }
    }
  }
  
  await savePageAdjustmentCache(cache)
}