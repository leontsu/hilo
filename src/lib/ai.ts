import type { 
  CEFRLevel, 
  UserSettings, 
  SimplificationResponse,
  CaptionLine,
  SimplifiedCaptionLine,
  QuizQuestion,
  QuizResponse,
  TranslationResponse,
  AICapabilities
} from '../types'

// Word replacement dictionary for different CEFR levels
const WORD_REPLACEMENTS: Record<CEFRLevel, Record<string, string>> = {
  A1: {
    'difficult': 'hard',
    'enormous': 'very big',
    'purchase': 'buy',
    'automobile': 'car',
    'residence': 'home',
    'utilize': 'use',
    'commence': 'start',
    'terminate': 'end',
    'magnificent': 'great',
    'demonstrate': 'show'
  },
  A2: {
    'enormous': 'huge',
    'purchase': 'buy',
    'automobile': 'car',
    'residence': 'house',
    'utilize': 'use',
    'commence': 'begin',
    'terminate': 'finish',
    'demonstrate': 'show',
    'approximately': 'about',
    'investigate': 'look into'
  },
  B1: {
    'enormous': 'huge',
    'automobile': 'vehicle',
    'residence': 'house',
    'utilize': 'use',
    'commence': 'begin',
    'demonstrate': 'show',
    'approximately': 'about',
    'investigate': 'examine',
    'substantial': 'large',
    'comprehensive': 'complete'
  },
  B2: {
    'utilize': 'use',
    'commence': 'begin',
    'demonstrate': 'show',
    'investigate': 'examine',
    'substantial': 'significant',
    'comprehensive': 'thorough',
    'elaborate': 'detailed',
    'diminish': 'reduce',
    'constitute': 'make up',
    'accumulate': 'collect'
  },
  C1: {
    'demonstrate': 'show',
    'substantial': 'significant',
    'elaborate': 'detailed',
    'constitute': 'form',
    'accumulate': 'gather',
    'scrutinize': 'examine closely',
    'contemplate': 'consider',
    'perpetuate': 'continue',
    'circumvent': 'avoid',
    'corroborate': 'confirm'
  }
}

// Maximum sentence length by CEFR level
const MAX_SENTENCE_LENGTH: Record<CEFRLevel, number> = {
  A1: 10,
  A2: 15,
  B1: 20,
  B2: 25,
  C1: 30
}

export function simplifyText(text: string, settings: UserSettings): SimplificationResponse {
  // Skip if text is too short or contains only symbols/music notation
  if (text.length < 8 || /^[\[\](){}.,!?;:\s\-_]*$/.test(text) || /\[Music\]/i.test(text)) {
    return {
      simplified: text,
      summary: '',
      originalText: text
    }
  }

  try {
    // Clean and normalize text
    let simplified = text.trim()
    
    // Apply word replacements based on CEFR level
    const replacements = WORD_REPLACEMENTS[settings.level] || {}
    Object.entries(replacements).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi')
      simplified = simplified.replace(regex, simple)
    })

    // Split into sentences and simplify structure
    const sentences = simplified.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const maxLength = MAX_SENTENCE_LENGTH[settings.level]
    
    const simplifiedSentences = sentences.map(sentence => {
      const words = sentence.trim().split(/\s+/)
      if (words.length <= maxLength) {
        return sentence.trim()
      }
      
      // Break long sentences into shorter ones
      const chunks: string[] = []
      for (let i = 0; i < words.length; i += maxLength) {
        chunks.push(words.slice(i, i + maxLength).join(' '))
      }
      return chunks.join('. ')
    })

    simplified = simplifiedSentences.join('. ').replace(/\.\s*\./g, '.').trim()
    
    // Add period if not present
    if (simplified && !simplified.match(/[.!?]$/)) {
      simplified += '.'
    }

    // Generate summary (first 60 characters)
    const summary = simplified.length > 60 
      ? simplified.substring(0, 57) + '...'
      : simplified

    return {
      simplified,
      summary,
      originalText: text
    }
  } catch (error) {
    console.error('Simplification error:', error)
    return {
      simplified: text,
      summary: 'Error occurred during simplification',
      originalText: text
    }
  }
}

export function simplifyCaptions(lines: CaptionLine[], settings: UserSettings): SimplifiedCaptionLine[] {
  return lines.map(line => {
    const result = simplifyText(line.text, settings)
    return {
      tStart: line.tStart,
      tEnd: line.tEnd,
      original: line.text,
      simplified: result.simplified
    }
  }).filter(line => line.original.trim().length > 0)
}

// AI Capability Detection
export async function checkAICapabilities(): Promise<AICapabilities> {
  try {
    console.log('Hilo AI: Starting capability check...')
    console.log('Hilo AI: globalThis keys:', Object.keys(globalThis))
    console.log('Hilo AI: LanguageModel type:', typeof (globalThis as any).LanguageModel)
    console.log('Hilo AI: Summarizer type:', typeof (globalThis as any).Summarizer)
    console.log('Hilo AI: Writer type:', typeof (globalThis as any).Writer)
    console.log('Hilo AI: translation type:', typeof (globalThis as any).translation)
    
    const capabilities: AICapabilities = {
      languageModel: false,
      summarizer: false,
      translator: false,
      writer: false
    }

    // Return default capabilities if window is not available (e.g., in service worker)
    if (typeof window === 'undefined') {
      console.log('Hilo AI: Window is undefined, returning default capabilities')
      return capabilities
    }

    // Check Language Model API (global LanguageModel function)
    if (typeof (globalThis as any).LanguageModel === 'function') {
      try {
        console.log('Hilo AI: Checking LanguageModel availability...')
        const status = await (globalThis as any).LanguageModel.availability()
        console.log('Hilo AI: LanguageModel status:', status)
        capabilities.languageModel = status === 'readily' || status === 'downloadable'
      } catch (e) {
        console.log('Hilo AI: LanguageModel not available:', e)
      }
    } else {
      console.log('Hilo AI: LanguageModel is not a function')
    }

    // Check Summarizer API (global Summarizer function)
    if (typeof (globalThis as any).Summarizer === 'function') {
      try {
        console.log('Hilo AI: Checking Summarizer availability...')
        const status = await (globalThis as any).Summarizer.availability()
        console.log('Hilo AI: Summarizer status:', status)
        capabilities.summarizer = status === 'readily' || status === 'downloadable'
      } catch (e) {
        console.log('Hilo AI: Summarizer not available:', e)
      }
    } else {
      console.log('Hilo AI: Summarizer is not a function')
    }

    // Check Writer API (global Writer function)
    if (typeof (globalThis as any).Writer === 'function') {
      try {
        console.log('Hilo AI: Checking Writer availability...')
        const status = await (globalThis as any).Writer.availability()
        console.log('Hilo AI: Writer status:', status)
        capabilities.writer = status === 'readily' || status === 'downloadable'
      } catch (e) {
        console.log('Hilo AI: Writer not available:', e)
      }
    } else {
      console.log('Hilo AI: Writer is not a function')
    }

    // Check Translation API (using global translation function)
    if (typeof (globalThis as any).translation === 'object') {
      try {
        console.log('Hilo AI: Checking Translation availability...')
        const canTranslate = await (globalThis as any).translation.canTranslate({
          sourceLanguage: 'en',
          targetLanguage: 'ja'
        })
        console.log('Hilo AI: Translation canTranslate:', canTranslate)
        capabilities.translator = canTranslate === 'readily' || canTranslate === 'downloadable'
      } catch (e) {
        console.log('Hilo AI: Translation API not available:', e)
      }
    } else {
      console.log('Hilo AI: translation is not an object')
    }

    console.log('Hilo AI: Final AI capabilities:', capabilities)
    return capabilities
  } catch (error) {
    console.error('Hilo AI: Error checking AI capabilities:', error)
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
  let translator: any = null
  
  try {
    const capabilities = await checkAICapabilities()
    
    if (capabilities.languageModel) {
      // Use LanguageModel API for text simplification
      session = await (globalThis as any).LanguageModel.create({
        systemPrompt: buildSimplificationPrompt(settings.level),
        temperature: 0.7,
        topK: 3
      })

      const simplified = await session.prompt(`Simplify this text to ${settings.level} CEFR level: "${text}"`)

      let summary = ''
      if (capabilities.summarizer) {
        try {
          // Use Summarizer API for summary
          summarizer = await (globalThis as any).Summarizer.create({
            type: 'tl;dr',
            format: 'plain-text',
            length: 'short'
          })
          summary = await summarizer.summarize(simplified)
        } catch (summaryError) {
          console.warn('Summarizer failed, using fallback:', summaryError)
          summary = simplified.length > 60 ? simplified.substring(0, 57) + '...' : simplified
        }
      }

      let translation = ''
      if (capabilities.translator && settings.outputLanguage === 'ja') {
        try {
          // Use Translator API for Japanese translation
          translator = await (globalThis as any).translation.createTranslator({
            sourceLanguage: 'en',
            targetLanguage: 'ja'
          })
          translation = await translator.translate(simplified)
        } catch (translationError) {
          console.warn('Translation failed:', translationError)
          translation = `[翻訳] ${simplified}`
        }
      }

      return {
        simplified: simplified.trim(),
        summary: summary || (simplified.length > 60 ? simplified.substring(0, 57) + '...' : simplified),
        originalText: text,
        translation: translation || undefined
      }
    } else {
      // Fallback to local simplification
      return simplifyText(text, settings)
    }
  } catch (error) {
    console.error('AI simplification error:', error)
    // Fallback to local simplification
    return {
      ...simplifyText(text, settings),
      summary: `Error: ${error instanceof Error ? error.message : 'AI processing failed'}`
    }
  } finally {
    // Cleanup resources
    try {
      if (session) session.destroy()
      if (summarizer) summarizer.destroy()
      if (translator) translator.destroy()
    } catch (cleanupError) {
      console.warn('Resource cleanup error:', cleanupError)
    }
  }
}

export async function generateQuizAI(text: string, settings: UserSettings): Promise<QuizResponse> {
  try {
    const capabilities = await checkAICapabilities()
    
    if (capabilities.writer) {
      // Use Writer API for quiz generation
      const session = await (globalThis as any).Writer.create({
        format: 'plain-text',
        tone: 'educational',
        length: 'medium'
      })

      const prompt = buildQuizPrompt(text, settings.level)
      const quizText = await session.write(prompt)
      session.destroy()

      // Parse the generated quiz text into structured questions
      const questions = parseQuizText(quizText, settings.level)
      
      return {
        questions,
        originalText: text
      }
    } else {
      // Fallback to local quiz generation
      return generateQuizLocal(text, settings)
    }
  } catch (error) {
    console.error('AI quiz generation error:', error)
    // Fallback to local quiz generation
    return generateQuizLocal(text, settings)
  }
}

export async function translateTextAI(text: string, settings: UserSettings): Promise<TranslationResponse> {
  try {
    const capabilities = await checkAICapabilities()
    
    if (capabilities.translator && settings.outputLanguage === 'ja') {
      // Use Translator API
      const translator = await (globalThis as any).translation.createTranslator({
        sourceLanguage: 'en',
        targetLanguage: 'ja'
      })
      
      const translatedText = await translator.translate(text)
      translator.destroy()

      return {
        translatedText,
        originalText: text,
        sourceLanguage: 'en',
        targetLanguage: 'ja'
      }
    } else {
      // Fallback to local translation stub
      return {
        translatedText: `[翻訳] ${text}`,
        originalText: text,
        sourceLanguage: 'en',
        targetLanguage: settings.outputLanguage || 'ja'
      }
    }
  } catch (error) {
    console.error('AI translation error:', error)
    return {
      translatedText: `[翻訳エラー] ${text}`,
      originalText: text,
      sourceLanguage: 'en',
      targetLanguage: settings.outputLanguage || 'ja'
    }
  }
}

export async function simplifyCaptionsAI(lines: CaptionLine[], settings: UserSettings): Promise<SimplifiedCaptionLine[]> {
  try {
    const capabilities = await checkAICapabilities()
    
    if (capabilities.languageModel) {
      const session = await (globalThis as any).LanguageModel.create({
        systemPrompt: buildSimplificationPrompt(settings.level),
        temperature: 0.7,
        topK: 3
      })

      const simplifiedLines = await Promise.all(
        lines.map(async (line) => {
          if (line.text.trim().length < 8 || /\[Music\]/i.test(line.text)) {
            return {
              tStart: line.tStart,
              tEnd: line.tEnd,
              original: line.text,
              simplified: line.text
            }
          }

          try {
            const simplified = await session.prompt(`Simplify: "${line.text}"`)
            return {
              tStart: line.tStart,
              tEnd: line.tEnd,
              original: line.text,
              simplified: simplified.trim()
            }
          } catch (error) {
            return {
              tStart: line.tStart,
              tEnd: line.tEnd,
              original: line.text,
              simplified: line.text
            }
          }
        })
      )

      session.destroy()
      return simplifiedLines
    } else {
      // Fallback to local simplification
      return simplifyCaptions(lines, settings)
    }
  } catch (error) {
    console.error('AI caption simplification error:', error)
    return simplifyCaptions(lines, settings)
  }
}

// Helper functions for AI prompts
function buildSimplificationPrompt(level: CEFRLevel): string {
  const levelDescriptions = {
    A1: 'very simple words, short sentences, present tense',
    A2: 'basic vocabulary, simple grammar, common topics',
    B1: 'everyday vocabulary, clear structure, past/future tenses',
    B2: 'abstract concepts, complex sentences, varied vocabulary',
    C1: 'sophisticated language, nuanced meaning, idioms'
  }

  return `You are a language learning assistant. Simplify text to ${level} CEFR level using ${levelDescriptions[level]}. Keep the original meaning but make it appropriate for ${level} learners. Use shorter sentences and simpler words.`
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

function generateQuizLocal(text: string, settings: UserSettings): QuizResponse {
  // Simple fallback quiz generator
  const questions: QuizQuestion[] = [
    {
      id: 'q1',
      question: `What is the main topic of this ${settings.level} level text?`,
      options: [
        'The text content',
        'Language learning',
        'Something else',
        'Not sure'
      ],
      correctAnswer: 0,
      explanation: 'This question tests basic comprehension.'
    }
  ]
  
  return { questions, originalText: text }
}