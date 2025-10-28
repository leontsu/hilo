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

// Local fallback data removed - all processing now handled by Chrome's built-in AI

// Local fallback functions removed - extension now requires Chrome's built-in AI
// If AI is not available, clear error messages will be shown to users

// AI Capability Detection
export async function checkAICapabilities(): Promise<AICapabilities> {
  try {
    console.log('[AI] Checking AI capabilities...')
    const capabilities: AICapabilities = {
      languageModel: false,
      summarizer: false,
      translator: false,
      writer: false
    }

    // Return default capabilities if window is not available (e.g., in service worker)
    if (typeof window === 'undefined') {
      console.log('[AI] Window not available, returning default capabilities')
      return capabilities
    }

    // Check Language Model API (global LanguageModel function)
    console.log('[AI] Checking LanguageModel API...')
    if (typeof (globalThis as any).LanguageModel === 'function') {
      try {
        const status = await (globalThis as any).LanguageModel.availability()
        console.log('[AI] LanguageModel status:', status)
        capabilities.languageModel = status === 'readily' || status === 'downloadable'
        console.log('[AI] LanguageModel available:', capabilities.languageModel)
      } catch (e) {
        console.log('[AI] Language Model API not available:', e)
      }
    } else {
      console.log('[AI] LanguageModel function not found on globalThis')
    }

    // Check Summarizer API (global Summarizer function)
    console.log('[AI] Checking Summarizer API...')
    if (typeof (globalThis as any).Summarizer === 'function') {
      try {
        const status = await (globalThis as any).Summarizer.availability()
        console.log('[AI] Summarizer status:', status)
        capabilities.summarizer = status === 'readily' || status === 'downloadable'
        console.log('[AI] Summarizer available:', capabilities.summarizer)
      } catch (e) {
        console.log('[AI] Summarizer API not available:', e)
      }
    } else {
      console.log('[AI] Summarizer function not found on globalThis')
    }

    // Check Writer API (global Writer function)
    console.log('[AI] Checking Writer API...')
    if (typeof (globalThis as any).Writer === 'function') {
      try {
        const status = await (globalThis as any).Writer.availability()
        console.log('[AI] Writer status:', status)
        capabilities.writer = status === 'readily' || status === 'downloadable'
        console.log('[AI] Writer available:', capabilities.writer)
      } catch (e) {
        console.log('[AI] Writer API not available:', e)
      }
    } else {
      console.log('[AI] Writer function not found on globalThis')
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

// Chrome Built-in AI Implementation
export async function simplifyTextAI(text: string, settings: UserSettings): Promise<SimplificationResponse> {
  let session: any = null
  let summarizer: any = null
  
  try {
    console.log('[AI] simplifyTextAI called with level:', settings.level)
    console.log('[AI] Text to simplify (first 100 chars):', text.substring(0, 100))
    
    const capabilities = await checkAICapabilities()
    
    if (!capabilities.languageModel) {
      throw new Error('AI Language Model is not available. Please enable Chrome\'s built-in AI features or use a browser that supports them.')
    }

    console.log('[AI] Creating LanguageModel session...')
    // Use global LanguageModel for text simplification
    session = await (globalThis as any).LanguageModel.create({
      systemPrompt: buildSimplificationPrompt(settings.level),
      temperature: 0.7,
      topK: 3,
      outputLanguage: 'en'
    })
    console.log('[AI] Session created successfully')

    console.log('[AI] Sending prompt to AI model...')
    const simplified = await session.prompt(`Simplify this text to ${settings.level} CEFR level: "${text}"`)
    console.log('[AI] Received simplified text (first 100 chars):', simplified.substring(0, 100))

    let summary = ''
    if (capabilities.summarizer) {
      try {
        console.log('[AI] Creating Summarizer session...')
        // Use global Summarizer for summary
        summarizer = await (globalThis as any).Summarizer.create({
          outputLanguage: 'en'
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
    throw new Error(error instanceof Error ? error.message : 'AI simplification failed. Please ensure Chrome\'s built-in AI is enabled.')
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
    
    const capabilities = await checkAICapabilities()
    
    if (!capabilities.writer) {
      throw new Error('AI Writer is not available. Please enable Chrome\'s built-in AI features or use a browser that supports them.')
    }

    console.log('[AI] Creating Writer session for quiz generation...')
    // Use global Writer API for quiz generation
    session = await (globalThis as any).Writer.create({
      outputLanguage: 'en'
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
    throw new Error(error instanceof Error ? error.message : 'AI quiz generation failed. Please ensure Chrome\'s built-in AI is enabled.')
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
    
    const capabilities = await checkAICapabilities()
    
    if (!capabilities.languageModel) {
      throw new Error('AI Language Model is not available. Please enable Chrome\'s built-in AI features or use a browser that supports them.')
    }

    console.log('[AI] Creating LanguageModel session for captions...')
    session = await (globalThis as any).LanguageModel.create({
      systemPrompt: buildSimplificationPrompt(settings.level),
      temperature: 0.7,
      topK: 3,
      outputLanguage: 'en'
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
    throw new Error(error instanceof Error ? error.message : 'AI caption simplification failed. Please ensure Chrome\'s built-in AI is enabled.')
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