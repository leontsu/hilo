import type { 
  CEFRLevel, 
  OutputLanguage, 
  UserSettings, 
  SimplificationResponse,
  CaptionLine,
  SimplifiedCaptionLine 
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

    // Apply language output if Japanese is requested
    if (settings.outputLanguage === 'ja') {
      // Simple stub for Japanese output - in real implementation this would use proper translation
      simplified = `[簡単] ${simplified}`
    }

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

// Future AI replacement functions (stub for now)
export async function simplifyTextAI(text: string, settings: UserSettings): Promise<SimplificationResponse> {
  // This will be replaced with Chrome Built-in AI implementation
  // For now, fall back to local simplification
  return simplifyText(text, settings)
}

export async function simplifyCaptionsAI(lines: CaptionLine[], settings: UserSettings): Promise<SimplifiedCaptionLine[]> {
  // This will be replaced with Chrome Built-in AI implementation
  // For now, fall back to local simplification
  return simplifyCaptions(lines, settings)
}