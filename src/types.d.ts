export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export interface UserSettings {
  level: CEFRLevel
  enabled: boolean
  outputLanguage?: string
}

export interface UsageStatistics {
  totalSimplifications: number
  totalQuizzes: number
  totalWords: number
  todaySimplifications: number
  todayQuizzes: number
  todayWords: number
  lastResetDate: string
}

export interface SimplificationRequest {
  type: 'SIMPLIFY_TEXT'
  text: string
  settings: UserSettings
}

export interface PageAdjustmentRequest {
  type: 'ADJUST_PAGE'
  settings: UserSettings
}

export interface SimplificationResponse {
  simplified: string
  summary?: string
  originalText: string
  quiz?: QuizQuestion[]
  translation?: string
}

export interface CaptionSimplificationRequest {
  type: 'SIMPLIFY_CAPTIONS'
  lines: CaptionLine[]
  settings: UserSettings
}

export interface CaptionLine {
  tStart: number
  tEnd: number
  text: string
}

export interface CaptionSimplificationResponse {
  lines: SimplifiedCaptionLine[]
}

export interface SimplifiedCaptionLine {
  tStart: number
  tEnd: number
  original: string
  simplified: string
}

// Quiz types
export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface QuizRequest {
  type: 'GENERATE_QUIZ'
  text: string
  settings: UserSettings
}

export interface QuizResponse {
  questions: QuizQuestion[]
  originalText: string
}

export interface TranslationResponse {
  translatedText: string
  originalText: string
  sourceLanguage: string
  targetLanguage: string
}

// AI Service types
export interface AICapabilities {
  languageModel: boolean
  summarizer: boolean
  translator: boolean
  writer: boolean
}

export interface AICapabilityRequest {
  type: 'CHECK_AI_CAPABILITIES'
}

export interface AICapabilityResponse {
  capabilities: AICapabilities
}

export interface GetSettingsRequest {
  type: 'GET_SETTINGS'
}

// Chrome AI API types
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        create: (options?: any) => Promise<any>
        capabilities: () => Promise<any>
      }
      summarizer?: {
        create: (options?: any) => Promise<any>
        capabilities: () => Promise<any>
      }
      writer?: {
        create: (options?: any) => Promise<any>
        capabilities: () => Promise<any>
      }
    }
  }
  
  // Global Chrome AI APIs
  const LanguageModel: {
    create: (options?: any) => Promise<any>
    availability: () => Promise<string>
  }
  
  const Summarizer: {
    create: (options?: any) => Promise<any>
    availability: () => Promise<string>
  }
  
  const Writer: {
    create: (options?: any) => Promise<any>
    availability: () => Promise<string>
  }
  
  const Rewriter: {
    create: (options?: any) => Promise<any>
    availability: () => Promise<string>
  }
  
  const Proofreader: {
    create: (options?: any) => Promise<any>
    availability: () => Promise<string>
  }
}

export type MessageRequest = 
  | SimplificationRequest 
  | PageAdjustmentRequest
  | CaptionSimplificationRequest
  | QuizRequest
  | AICapabilityRequest
  | GetSettingsRequest

export interface MessageResponse {
  success: boolean
  data?: SimplificationResponse | CaptionSimplificationResponse | QuizResponse | AICapabilityResponse | UserSettings
  error?: string
}