import type { 
  CEFRLevel, 
  UserSettings, 
  SimplificationResponse,
  QuizQuestion,
  QuizResponse,
  AICapabilities
} from '../types'

// Batch processing interfaces
interface BatchRequest {
  id: string
  text: string
  priority: number // 1 = highest priority (visible), 2 = normal, 3 = background
}

interface BatchResponse {
  id: string
  success: boolean
  data?: SimplificationResponse
  error?: string
}

interface AISessionPool {
  languageModel: any[]
  summarizer: any[]
  writer: any[]
}

// Cache system for processed texts
interface CacheEntry {
  originalText: string
  level: CEFRLevel
  simplified: string
  summary: string
  timestamp: number
}

class TextCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 500
  private maxAge = 24 * 60 * 60 * 1000 // 24 hours

  private generateKey(text: string, level: CEFRLevel): string {
    return `${level}:${text.slice(0, 100)}:${text.length}`
  }

  get(text: string, level: CEFRLevel): CacheEntry | null {
    const key = this.generateKey(text, level)
    const entry = this.cache.get(key)
    
    if (entry && Date.now() - entry.timestamp < this.maxAge) {
      return entry
    }
    
    if (entry) {
      this.cache.delete(key)
    }
    
    return null
  }

  set(text: string, level: CEFRLevel, simplified: string, summary: string): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      for (let i = 0; i < Math.floor(this.maxSize * 0.2); i++) {
        this.cache.delete(entries[i][0])
      }
    }

    const key = this.generateKey(text, level)
    this.cache.set(key, {
      originalText: text,
      level,
      simplified,
      summary,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

// Global cache instance
const textCache = new TextCache()

// AI Session Pool Manager
class AISessionManager {
  private sessionPool: AISessionPool = {
    languageModel: [],
    summarizer: [],
    writer: []
  }
  private maxPoolSize = 3
  private sessionTimeout = 30000 // 30 seconds

  async getLanguageModelSession(): Promise<any> {
    if (this.sessionPool.languageModel.length > 0) {
      return this.sessionPool.languageModel.pop()
    }
    return await createLanguageModelSession({
      initialPrompts: [{ role: 'system', content: 'You are a text simplification assistant.' }],
      temperature: 0.7,
      topK: 40
    })
  }

  async getSummarizerSession(): Promise<any> {
    if (this.sessionPool.summarizer.length > 0) {
      return this.sessionPool.summarizer.pop()
    }
    return await createSummarizerSession({
      type: 'tl;dr',
      format: 'plain-text',
      length: 'short'
    })
  }

  async getWriterSession(): Promise<any> {
    if (this.sessionPool.writer.length > 0) {
      return this.sessionPool.writer.pop()
    }
    return await createWriterSession({
      format: 'plain-text',
      tone: 'formal'
    })
  }

  returnSession(session: any, type: 'languageModel' | 'summarizer' | 'writer'): void {
    if (this.sessionPool[type].length < this.maxPoolSize) {
      this.sessionPool[type].push(session)
      // Auto-cleanup after timeout
      setTimeout(() => {
        const index = this.sessionPool[type].indexOf(session)
        if (index !== -1) {
          this.sessionPool[type].splice(index, 1)
          try {
            session.destroy()
          } catch (e) {
            console.warn('Session cleanup error:', e)
          }
        }
      }, this.sessionTimeout)
    } else {
      try {
        session.destroy()
      } catch (e) {
        console.warn('Session cleanup error:', e)
      }
    }
  }

  cleanup(): void {
    Object.values(this.sessionPool).forEach(sessions => {
      sessions.forEach((session: any) => {
        try {
          session.destroy()
        } catch (e) {
          console.warn('Session cleanup error:', e)
        }
      })
      sessions.length = 0
    })
  }
}

// Global session manager
const sessionManager = new AISessionManager()

// AI API Access Methods Interface
interface AIAPIAccess {
  languageModel?: any
  summarizer?: any
  writer?: any
}

// Chrome Version Detection for Better Error Messages
function getChromeVersion(): string {
  try {
    const userAgent = navigator.userAgent
    const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)
    if (chromeMatch) {
      return chromeMatch[1]
    }
    return 'Unknown'
  } catch (error) {
    return 'Detection failed'
  }
}

// Enhanced Error Message Generator
function getAIErrorMessage(errorType: string, chromeVersion: string): string {
  const baseMessages: Record<string, string> = {
    'api-unavailable': `Chrome's built-in AI is not available. This requires Chrome Canary 128+ with experimental AI features enabled.`,
    'activation-required': `User interaction required. Please click or interact with the page first before using AI features.`,
    'download-required': `AI model needs to be downloaded. This may take a few minutes on first use.`,
    'version-outdated': `Your Chrome version (${chromeVersion}) may not support AI features. Please update to Chrome Canary 128+.`,
    'flags-disabled': `AI features are disabled. Please enable them in chrome://flags/#optimization-guide-on-device-model`
  }
  
  const instructions = [
    '1. Use Chrome Canary (not regular Chrome)',
    '2. Go to chrome://flags/#optimization-guide-on-device-model',
    '3. Set to "Enabled BypassPerfRequirement"',
    '4. Go to chrome://flags/#prompt-api-for-gemini-nano',
    '5. Set to "Enabled"',
    '6. Restart Chrome Canary',
    '7. Visit chrome://components/ and update "Optimization Guide On Device Model"'
  ]
  
  return `${baseMessages[errorType] || 'AI feature unavailable'}\n\nSetup Instructions:\n${instructions.join('\n')}`
}

// Comprehensive API Detection with Fallback Chain
function getAIAPIAccess(): AIAPIAccess {
  // Try multiple access methods in order of preference
  
  // Method 1: globalThis.ai (for service workers)
  if (typeof (globalThis as any).ai !== 'undefined') {
    console.log('[AI] Found globalThis.ai interface')
    return {
      languageModel: (globalThis as any).ai.languageModel,
      summarizer: (globalThis as any).ai.summarizer,
      writer: (globalThis as any).ai.writer
    }
  }
  
  // Method 2: self.ai (working implementation in content scripts)
  if (typeof self !== 'undefined' && (self as any).ai) {
    console.log('[AI] Found self.ai interface')
    return {
      languageModel: (self as any).ai.languageModel,
      summarizer: (self as any).ai.summarizer,
      writer: (self as any).ai.writer
    }
  }
  
  // Method 3: window.ai (some documentation references)
  if (typeof window !== 'undefined' && (window as any).ai) {
    console.log('[AI] Found window.ai interface')
    return {
      languageModel: (window as any).ai.languageModel,
      summarizer: (window as any).ai.summarizer,
      writer: (window as any).ai.writer
    }
  }
  
  // Method 4: Global objects (official documentation)
  const globalAccess: AIAPIAccess = {}
  if (typeof (globalThis as any).LanguageModel !== 'undefined') {
    globalAccess.languageModel = (globalThis as any).LanguageModel
  }
  if (typeof (globalThis as any).Summarizer !== 'undefined') {
    globalAccess.summarizer = (globalThis as any).Summarizer
  }
  if (typeof (globalThis as any).Writer !== 'undefined') {
    globalAccess.writer = (globalThis as any).Writer
  }
  
  if (Object.keys(globalAccess).length > 0) {
    console.log('[AI] Found global AI objects:', Object.keys(globalAccess))
    return globalAccess
  }
  
  console.log('[AI] No AI APIs found')
  return {}
}

// Enhanced AI Capability Detection
export async function checkAICapabilities(): Promise<AICapabilities> {
  try {
    console.log('[AI] Starting comprehensive AI capability check...')
    
    const capabilities: AICapabilities = {
      languageModel: false,
      summarizer: false,
      translator: false,
      writer: false
    }

    // Check if running in service worker context
    if (typeof window === 'undefined' && typeof document === 'undefined') {
      console.log('[AI] Running in service worker context, checking global APIs directly...')
      
      // In service worker context, check for global APIs directly
      try {
        if (typeof (globalThis as any).ai !== 'undefined') {
          console.log('[AI] Found globalThis.ai in service worker')
          const ai = (globalThis as any).ai
          
          if (ai.languageModel) {
            try {
              const availability = await ai.languageModel.capabilities()
              capabilities.languageModel = availability.available === 'readily' || availability.available === 'after-download' || availability.available === 'available'
              console.log('[AI] Service Worker LanguageModel:', availability.available)
            } catch (e) {
              console.log('[AI] Service Worker LanguageModel check failed:', e)
            }
          }
          
          if (ai.summarizer) {
            try {
              const availability = await ai.summarizer.capabilities()
              capabilities.summarizer = availability.available === 'readily' || availability.available === 'after-download' || availability.available === 'available'
              console.log('[AI] Service Worker Summarizer:', availability.available)
            } catch (e) {
              console.log('[AI] Service Worker Summarizer check failed:', e)
            }
          }
          
          if (ai.writer) {
            try {
              const availability = await ai.writer.capabilities()
              capabilities.writer = availability.available === 'readily' || availability.available === 'after-download' || availability.available === 'available'
              console.log('[AI] Service Worker Writer:', availability.available)
            } catch (e) {
              console.log('[AI] Service Worker Writer check failed:', e)
            }
          }
        } else {
          console.log('[AI] No globalThis.ai found in service worker, trying global objects...')
          
          // Try global objects
          if (typeof (globalThis as any).LanguageModel !== 'undefined') {
            try {
              const availability = await (globalThis as any).LanguageModel.availability()
              capabilities.languageModel = availability === 'readily' || availability === 'after-download' || availability === 'available'
              console.log('[AI] Service Worker global LanguageModel:', availability)
            } catch (e) {
              console.log('[AI] Service Worker global LanguageModel check failed:', e)
            }
          }
          
          if (typeof (globalThis as any).Summarizer !== 'undefined') {
            try {
              const availability = await (globalThis as any).Summarizer.availability()
              capabilities.summarizer = availability === 'readily' || availability === 'after-download' || availability === 'available'
              console.log('[AI] Service Worker global Summarizer:', availability)
            } catch (e) {
              console.log('[AI] Service Worker global Summarizer check failed:', e)
            }
          }
          
          if (typeof (globalThis as any).Writer !== 'undefined') {
            try {
              const availability = await (globalThis as any).Writer.availability()
              capabilities.writer = availability === 'readily' || availability === 'after-download' || availability === 'available'
              console.log('[AI] Service Worker global Writer:', availability)
            } catch (e) {
              console.log('[AI] Service Worker global Writer check failed:', e)
            }
          }
        }
      } catch (error) {
        console.error('[AI] Service worker API check failed:', error)
      }
      
      console.log('[AI] Service worker final capabilities:', capabilities)
      return capabilities
    }

    // Check Chrome version for better error messages (only in regular context)
    const chromeVersion = getChromeVersion()
    console.log('[AI] Chrome version:', chromeVersion)

    // Check user activation requirement
    if (typeof navigator !== 'undefined' && navigator.userActivation) {
      console.log('[AI] User activation status:', navigator.userActivation.isActive)
      if (!navigator.userActivation.isActive) {
        console.warn('[AI] User activation required for AI APIs')
      }
    }

    // Get API access methods
    const apiAccess = getAIAPIAccess()

    // Check Language Model API
    console.log('[AI] Checking LanguageModel API...')
    if (apiAccess.languageModel) {
      try {
        let availability
        if (typeof apiAccess.languageModel.capabilities === 'function') {
          // For self.ai/window.ai interface
          const caps = await apiAccess.languageModel.capabilities()
          availability = caps.available
        } else if (typeof apiAccess.languageModel.availability === 'function') {
          // For global object interface
          availability = await apiAccess.languageModel.availability()
        }
        
        console.log('[AI] LanguageModel availability:', availability)
        capabilities.languageModel = availability === 'readily' || availability === 'after-download' || availability === 'available'
        console.log('[AI] LanguageModel ready:', capabilities.languageModel)
      } catch (e) {
        console.log('[AI] LanguageModel check failed:', e)
      }
    } else {
      console.log('[AI] LanguageModel API not found')
    }

    // Check Summarizer API
    console.log('[AI] Checking Summarizer API...')
    if (apiAccess.summarizer) {
      try {
        let availability
        if (typeof apiAccess.summarizer.capabilities === 'function') {
          const caps = await apiAccess.summarizer.capabilities()
          availability = caps.available
        } else if (typeof apiAccess.summarizer.availability === 'function') {
          availability = await apiAccess.summarizer.availability()
        }
        
        console.log('[AI] Summarizer availability:', availability)
        capabilities.summarizer = availability === 'readily' || availability === 'after-download' || availability === 'available'
        console.log('[AI] Summarizer ready:', capabilities.summarizer)
      } catch (e) {
        console.log('[AI] Summarizer check failed:', e)
      }
    } else {
      console.log('[AI] Summarizer API not found')
    }

    // Check Writer API
    console.log('[AI] Checking Writer API...')
    if (apiAccess.writer) {
      try {
        let availability
        if (typeof apiAccess.writer.capabilities === 'function') {
          const caps = await apiAccess.writer.capabilities()
          availability = caps.available
        } else if (typeof apiAccess.writer.availability === 'function') {
          availability = await apiAccess.writer.availability()
        }
        
        console.log('[AI] Writer availability:', availability)
        capabilities.writer = availability === 'readily' || availability === 'after-download' || availability === 'available'
        console.log('[AI] Writer ready:', capabilities.writer)
      } catch (e) {
        console.log('[AI] Writer check failed:', e)
      }
    } else {
      console.log('[AI] Writer API not found')
    }

    console.log('[AI] Final capabilities:', capabilities)
    return capabilities
  } catch (error) {
    console.error('Error checking AI capabilities:', error)
    return {
      languageModel: false,
      summarizer: false,
      translator: false,
      writer: false
    }
  }
}

// Unified API Wrapper Functions
async function createLanguageModelSession(options: any = {}) {
  const apiAccess = getAIAPIAccess()
  if (!apiAccess.languageModel) {
    throw new Error('LanguageModel API not available')
  }
  
  // Handle different API interfaces
  if (typeof apiAccess.languageModel.create === 'function') {
    return await apiAccess.languageModel.create(options)
  }
  
  throw new Error('LanguageModel.create method not found')
}

async function createSummarizerSession(options: any = {}) {
  const apiAccess = getAIAPIAccess()
  if (!apiAccess.summarizer) {
    throw new Error('Summarizer API not available')
  }
  
  if (typeof apiAccess.summarizer.create === 'function') {
    return await apiAccess.summarizer.create(options)
  }
  
  throw new Error('Summarizer.create method not found')
}

async function createWriterSession(options: any = {}) {
  const apiAccess = getAIAPIAccess()
  if (!apiAccess.writer) {
    throw new Error('Writer API not available')
  }
  
  if (typeof apiAccess.writer.create === 'function') {
    return await apiAccess.writer.create(options)
  }
  
  throw new Error('Writer.create method not found')
}

// Batch processing function for multiple texts
export async function simplifyTextsBatch(
  requests: BatchRequest[], 
  settings: UserSettings,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchResponse[]> {
  const results: BatchResponse[] = []
  const capabilities = await checkAICapabilities()

  if (!capabilities.languageModel) {
    return requests.map(req => ({
      id: req.id,
      success: false,
      error: getAIErrorMessage('api-unavailable', getChromeVersion())
    }))
  }

  // Sort by priority (1 = highest, 3 = lowest)
  const sortedRequests = requests.sort((a, b) => a.priority - b.priority)
  
  // Process in chunks to avoid overwhelming the system
  const chunkSize = 5
  let completed = 0

  for (let i = 0; i < sortedRequests.length; i += chunkSize) {
    const chunk = sortedRequests.slice(i, i + chunkSize)
    const chunkPromises = chunk.map(async (request) => {
      try {
        // Check cache first
        const cached = textCache.get(request.text, settings.level)
        if (cached) {
          console.log(`[Cache Hit] Using cached result for text: ${request.text.slice(0, 50)}...`)
          return {
            id: request.id,
            success: true,
            data: {
              simplified: cached.simplified,
              summary: cached.summary,
              originalText: cached.originalText
            }
          }
        }

        // Process with AI
        const result = await simplifyTextAI(request.text, settings)
        
        // Cache the result
        textCache.set(request.text, settings.level, result.simplified, result.summary || '')
        
        return {
          id: request.id,
          success: true,
          data: result
        }
      } catch (error) {
        console.error(`Batch processing error for request ${request.id}:`, error)
        return {
          id: request.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    const chunkResults = await Promise.all(chunkPromises)
    results.push(...chunkResults)
    completed += chunk.length

    if (onProgress) {
      onProgress(completed, requests.length)
    }

    // Small delay between chunks to prevent overwhelming
    if (i + chunkSize < sortedRequests.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

// Enhanced single text processing with caching
export async function simplifyTextAIFast(text: string, settings: UserSettings): Promise<SimplificationResponse> {
  // Check cache first
  const cached = textCache.get(text, settings.level)
  if (cached) {
    console.log(`[Cache Hit] Using cached result for: ${text.slice(0, 50)}...`)
    return {
      simplified: cached.simplified,
      summary: cached.summary,
      originalText: cached.originalText
    }
  }

  // Process with AI and cache result
  const result = await simplifyTextAI(text, settings)
  textCache.set(text, settings.level, result.simplified, result.summary || '')
  
  return result
}

// Chrome Built-in AI Implementation
export async function simplifyTextAI(text: string, settings: UserSettings): Promise<SimplificationResponse> {
  let session: any = null
  let summarizer: any = null
  
  try {
    console.log('[AI] simplifyTextAI called with level:', settings.level)
    console.log('[AI] Text to simplify (first 100 chars):', text.substring(0, 100))
    
    const chromeVersion = getChromeVersion()
    const capabilities = await checkAICapabilities()
    
    if (!capabilities.languageModel) {
      // Provide enhanced error message based on likely cause
      const apiAccess = getAIAPIAccess()
      if (Object.keys(apiAccess).length === 0) {
        throw new Error(getAIErrorMessage('api-unavailable', chromeVersion))
      } else {
        throw new Error(getAIErrorMessage('flags-disabled', chromeVersion))
      }
    }

    console.log('[AI] Getting LanguageModel session from pool...')
    // Use session pool for better performance
    session = await sessionManager.getLanguageModelSession()
    console.log('[AI] Session acquired successfully')

    console.log('[AI] Sending prompt to AI model...')
    const prompt = `${buildSimplificationPrompt(settings.level)}\n\nText to simplify: "${text}"`
    const simplified = await session.prompt(prompt)
    console.log('[AI] Received simplified text (first 100 chars):', simplified.substring(0, 100))

    let summary = ''
    if (capabilities.summarizer) {
      try {
        console.log('[AI] Getting Summarizer session from pool...')
        // Use session pool for better performance
        summarizer = await sessionManager.getSummarizerSession()
        console.log('[AI] Generating summary...')
        summary = await summarizer.summarize(simplified)
        console.log('[AI] Summary generated:', summary)
      } catch (summaryError) {
        console.warn('[AI] Summarizer failed, using simple truncation:', summaryError)
        summary = simplified.length > 60 ? simplified.substring(0, 57) + '...' : simplified
      }
    } else {
      // Simple truncation for summary if summarizer not available
      summary = simplified.length > 60 ? simplified.substring(0, 57) + '...' : simplified
    }

    console.log('[AI] Simplification complete (AI-powered)')
    return {
      simplified: simplified.trim(),
      summary: summary || (simplified.length > 60 ? simplified.substring(0, 57) + '...' : simplified),
      originalText: text
    }
  } catch (error) {
    console.error('AI simplification error:', error)
    
    // Enhanced error handling with specific guidance
    if (error instanceof Error) {
      // If it's already an enhanced error message, pass it through
      if (error.message.includes('Setup Instructions:')) {
        throw error
      }
      
      // Provide specific error guidance based on error type
      if (error.message.includes('user activation')) {
        throw new Error(getAIErrorMessage('activation-required', getChromeVersion()))
      } else if (error.message.includes('download') || error.message.includes('model')) {
        throw new Error(getAIErrorMessage('download-required', getChromeVersion()))
      } else {
        throw new Error(getAIErrorMessage('api-unavailable', getChromeVersion()))
      }
    }
    
    throw new Error(getAIErrorMessage('api-unavailable', getChromeVersion()))
  } finally {
    // Return sessions to pool instead of destroying
    try {
      if (session) sessionManager.returnSession(session, 'languageModel')
      if (summarizer) sessionManager.returnSession(summarizer, 'summarizer')
    } catch (cleanupError) {
      console.warn('Session return error:', cleanupError)
    }
  }
}

export async function generateQuizAI(text: string, settings: UserSettings): Promise<QuizResponse> {
  let session: any = null
  
  try {
    console.log('[AI] generateQuizAI called with level:', settings.level)
    console.log('[AI] Text for quiz (first 100 chars):', text.substring(0, 100))
    
    const chromeVersion = getChromeVersion()
    const capabilities = await checkAICapabilities()
    
    if (!capabilities.writer) {
      // Provide enhanced error message based on likely cause
      const apiAccess = getAIAPIAccess()
      if (!apiAccess.writer) {
        throw new Error(getAIErrorMessage('api-unavailable', chromeVersion))
      } else {
        throw new Error(getAIErrorMessage('flags-disabled', chromeVersion))
      }
    }

    console.log('[AI] Getting Writer session from pool...')
    // Use session pool for better performance
    session = await sessionManager.getWriterSession()
    console.log('[AI] Writer session created')

    const prompt = buildQuizPrompt(text, settings.level)
    console.log('[AI] Sending quiz prompt to Writer API...')
    const quizText = await session.write(prompt)
    console.log('[AI] Quiz text received:', quizText)

    // Parse the generated quiz text into structured questions
    console.log('[AI] Parsing quiz text into questions...')
    const questions = parseQuizText(quizText, settings.level)
    console.log('[AI] Parsed questions:', questions.length)
    
    if (questions.length === 0) {
      throw new Error('Failed to generate quiz questions. Please try with a different text.')
    }
    
    return {
      questions,
      originalText: text
    }
  } catch (error) {
    console.error('AI quiz generation error:', error)
    
    // Enhanced error handling with specific guidance
    if (error instanceof Error) {
      // If it's already an enhanced error message, pass it through
      if (error.message.includes('Setup Instructions:')) {
        throw error
      }
      
      // Provide specific error guidance based on error type
      if (error.message.includes('user activation')) {
        throw new Error(getAIErrorMessage('activation-required', getChromeVersion()))
      } else if (error.message.includes('download') || error.message.includes('model')) {
        throw new Error(getAIErrorMessage('download-required', getChromeVersion()))
      } else {
        throw new Error(getAIErrorMessage('api-unavailable', getChromeVersion()))
      }
    }
    
    throw new Error(getAIErrorMessage('api-unavailable', getChromeVersion()))
  } finally {
    // Return session to pool instead of destroying
    try {
      if (session) sessionManager.returnSession(session, 'writer')
    } catch (cleanupError) {
      console.warn('Session return error:', cleanupError)
    }
  }
}

// Helper functions for AI prompts
function buildSimplificationPrompt(level: CEFRLevel): string {
  const levelDescriptions = {
    A1: 'VERY simple words only (cat, run, happy), ONLY present tense, sentences under 8 words, NO difficult vocabulary',
    A2: 'basic everyday words (house, work, friend), simple past/future, sentences under 12 words, common expressions only',
    B1: 'clear everyday vocabulary, standard grammar, sentences under 15 words, avoid complex structures',
    B2: 'varied vocabulary including abstract terms, complex sentences allowed, natural expression',
    C1: 'sophisticated vocabulary, nuanced expressions, idioms acceptable, flexible structures'
  }

  const maxWords = {
    A1: 8,
    A2: 12,
    B1: 15,
    B2: 20,
    C1: 25
  }

  return `You are a strict language level adjuster. Simplify text to EXACTLY ${level} CEFR level.

CRITICAL RULES FOR ${level}:
- Use ${levelDescriptions[level]}
- Maximum sentence length: ${maxWords[level]} words
- Keep EXACT same meaning as original
- Return ONLY the simplified text, nothing else
- Do NOT add explanations or meta-commentary
- Preserve all punctuation appropriately
- Use natural, correct English

Original meaning must be preserved completely. Just adjust the language level.`
}

function buildQuizPrompt(text: string, level: CEFRLevel): string {
  return `Generate 2-3 multiple choice questions about this ${level} level text to test comprehension. Format each question with:
Question: [question text]
A) [option A]
B) [option B] 
C) [option C]
D) [option D]
Answer: [A/B/C/D]

Text: "${text}"`
}

function parseQuizText(quizText: string, level: CEFRLevel): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const questionBlocks = quizText.split(/Question:|^\d+\./).filter(block => block.trim().length > 0)
  
  questionBlocks.forEach((block, index) => {
    const lines = block.trim().split('\n').filter(line => line.trim().length > 0)
    if (lines.length < 6) return // Need at least question + 4 options + answer
    
    const questionText = lines[0].trim()
    const options = lines.slice(1, 5).map(line => line.replace(/^[A-D]\)\s*/, '').trim())
    const answerLine = lines.find(line => line.toLowerCase().includes('answer:'))
    
    if (questionText && options.length === 4 && answerLine) {
      const answerMatch = answerLine.match(/answer:\s*([A-D])/i)
      const correctAnswer = answerMatch ? answerMatch[1].toUpperCase().charCodeAt(0) - 65 : 0
      
      questions.push({
        id: `q${index + 1}`,
        question: questionText,
        options,
        correctAnswer,
        explanation: `This tests understanding of ${level} level content.`
      })
    }
  })
  
  return questions.slice(0, 3) // Limit to 3 questions
}

// Cache and session management functions
export function clearTextCache(): void {
  textCache.clear()
  console.log('[Cache] Text cache cleared')
}

export function cleanupAISessions(): void {
  sessionManager.cleanup()
  console.log('[Sessions] All AI sessions cleaned up')
}

export function getCacheStats(): { size: number, maxSize: number } {
  return {
    size: (textCache as any).cache.size,
    maxSize: (textCache as any).maxSize
  }
}

// Initialize cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanupAISessions()
  })
}

// generateQuizLocal removed - extension now requires Chrome's built-in AI Writer API