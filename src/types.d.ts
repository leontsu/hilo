export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
export type OutputLanguage = 'en' | 'ja'

export interface UserSettings {
  level: CEFRLevel
  outputLanguage: OutputLanguage
  enabled: boolean
}

export interface SimplificationRequest {
  type: 'SIMPLIFY_TEXT'
  text: string
  settings: UserSettings
}

export interface SimplificationResponse {
  simplified: string
  summary?: string
  originalText: string
  translation?: string
  quiz?: QuizQuestion[]
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

// Translation types
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

export type MessageRequest = 
  | SimplificationRequest 
  | CaptionSimplificationRequest
  | QuizRequest
  | TranslationRequest

export interface MessageResponse {
  success: boolean
  data?: SimplificationResponse | CaptionSimplificationResponse | QuizResponse | TranslationResponse
  error?: string
}