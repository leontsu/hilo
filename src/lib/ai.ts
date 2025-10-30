import type { 
  CEFRLevel, 
  UserSettings, 
  SimplificationResponse,
  CaptionLine,
  SimplifiedCaptionLine,
  QuizQuestion,
  QuizResponse,
  AICapabilities
} from '../types'


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

    console.log('[AI] Creating LanguageModel session...')
    // Use unified API wrapper for text simplification
    session = await createLanguageModelSession({
      initialPrompts: [{ role: 'system', content: buildSimplificationPrompt(settings.level) }],
      temperature: 0.7,
      topK: 40
    })
    console.log('[AI] Session created successfully')

    console.log('[AI] Sending prompt to AI model...')
    const simplified = await session.prompt(`Simplify this text to ${settings.level} CEFR level: "${text}"`)
    console.log('[AI] Received simplified text (first 100 chars):', simplified.substring(0, 100))

    let summary = ''
    if (capabilities.summarizer) {
      try {
        console.log('[AI] Creating Summarizer session...')
        // Use unified API wrapper for summary
        summarizer = await createSummarizerSession({
          type: 'tl;dr',
          format: 'plain-text',
          length: 'short'
        })
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
    // Cleanup resources
    try {
      if (session) session.destroy()
      if (summarizer) summarizer.destroy()
    } catch (cleanupError) {
      console.warn('Resource cleanup error:', cleanupError)
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

    console.log('[AI] Creating Writer session for quiz generation...')
    // Use unified API wrapper for quiz generation
    session = await createWriterSession({
      format: 'plain-text',
      tone: 'formal'
    })
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
    // Cleanup resources
    try {
      if (session) session.destroy()
    } catch (cleanupError) {
      console.warn('Resource cleanup error:', cleanupError)
    }
  }
}

export async function simplifyCaptionsAI(lines: CaptionLine[], settings: UserSettings): Promise<SimplifiedCaptionLine[]> {
  let session: any = null
  
  try {
    console.log('[AI] simplifyCaptionsAI called with', lines.length, 'caption lines')
    console.log('[AI] CEFR level:', settings.level)
    
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

    console.log('[AI] Creating LanguageModel session for captions...')
    session = await createLanguageModelSession({
      initialPrompts: [{ role: 'system', content: buildSimplificationPrompt(settings.level) }],
      temperature: 0.7,
      topK: 40
    })
    console.log('[AI] Caption session created')

    console.log('[AI] Processing', lines.length, 'caption lines...')
    const simplifiedLines = await Promise.all(
      lines.map(async (line, index) => {
        if (line.text.trim().length < 8 || /\[Music\]/i.test(line.text)) {
          console.log(`[AI] Skipping caption ${index + 1} (too short or music)`)
          return {
            tStart: line.tStart,
            tEnd: line.tEnd,
            original: line.text,
            simplified: line.text
          }
        }

        try {
          console.log(`[AI] Simplifying caption ${index + 1}/${lines.length}:`, line.text.substring(0, 50))
          const simplified = await session.prompt(`Simplify: "${line.text}"`)
          console.log(`[AI] Caption ${index + 1} simplified:`, simplified.substring(0, 50))
          return {
            tStart: line.tStart,
            tEnd: line.tEnd,
            original: line.text,
            simplified: simplified.trim()
          }
        } catch (error) {
          console.error(`[AI] Error simplifying caption ${index + 1}:`, error)
          // Return original text for individual caption errors
          return {
            tStart: line.tStart,
            tEnd: line.tEnd,
            original: line.text,
            simplified: line.text
          }
        }
      })
    )

    console.log('[AI] All captions processed')
    return simplifiedLines
  } catch (error) {
    console.error('AI caption simplification error:', error)
    
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
    // Cleanup resources
    try {
      if (session) session.destroy()
    } catch (cleanupError) {
      console.warn('Resource cleanup error:', cleanupError)
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

// generateQuizLocal removed - extension now requires Chrome's built-in AI Writer API