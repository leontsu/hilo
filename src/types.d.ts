export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export interface UserSettings {
  level: CEFRLevel
  enabled: boolean
  outputLanguage?: string
  cefrTest?: CEFRTestSettings
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

export interface TranslationRequest {
  type: 'TRANSLATE_TEXT'
  text: string
  settings: UserSettings
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

export interface GetCacheStatsRequest {
  type: 'GET_CACHE_STATS'
}

export interface CacheStatsResponse {
  size: number
  maxSize: number
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
  | QuizRequest
  | TranslationRequest
  | AICapabilityRequest
  | GetSettingsRequest
  | GetCacheStatsRequest
  | StartCEFRTestRequest
  | SubmitCEFRTestAnswerRequest
  | GetNextCEFRQuestionRequest
  | FinalizeCEFRTestRequest

// CEFR Level Test types
export interface CEFRTestQuestion {
  id: string
  level: CEFRLevel
  category: 'vocabulary' | 'grammar' | 'reading'
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  difficulty: number // 1-10 scale within the level
}

export interface CEFRTestResponse {
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
  timeSpent: number // milliseconds
  previousLevel: CEFRLevel
  newLevel: CEFRLevel
}

export interface CEFRTestSession {
  id: string
  startTime: number
  endTime?: number
  initialLevel: CEFRLevel
  finalLevel: CEFRLevel
  confidence: number // 0-1 scale
  responses: CEFRTestResponse[]
  completed: boolean
}

export interface CEFRTestResult {
  level: CEFRLevel
  confidence: number
  sessionId: string
  testDate: number
  totalQuestions: number
  correctAnswers: number
  averageTimePerQuestion: number
  categoryScores: {
    vocabulary: number
    grammar: number
    reading: number
  }
  levelProgression: CEFRLevel[] // showing how level changed during test
}

export interface CEFRTestSettings {
  hasCompletedTest: boolean
  lastTestDate?: number
  testResults: CEFRTestResult[]
  skipInitialTest?: boolean
}

export interface StartCEFRTestRequest {
  type: 'START_CEFR_TEST'
}

export interface SubmitCEFRTestAnswerRequest {
  type: 'SUBMIT_CEFR_TEST_ANSWER'
  sessionId: string
  questionId: string
  selectedAnswer: number
  timeSpent: number
}

export interface GetNextCEFRQuestionRequest {
  type: 'GET_NEXT_CEFR_QUESTION'
  sessionId: string
}

export interface FinalizeCEFRTestRequest {
  type: 'FINALIZE_CEFR_TEST'
  sessionId: string
}

export interface CEFRTestSessionResponse {
  session: CEFRTestSession
  currentQuestion?: CEFRTestQuestion
  isComplete: boolean
  result?: CEFRTestResult
}

export interface MessageResponse {
  success: boolean
  data?: SimplificationResponse | QuizResponse | TranslationResponse | AICapabilityResponse | UserSettings | CacheStatsResponse | CEFRTestSessionResponse | { message: string, settings?: UserSettings }
  error?: string
}