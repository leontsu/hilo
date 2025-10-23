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

export type MessageRequest = SimplificationRequest | CaptionSimplificationRequest

export interface MessageResponse {
  success: boolean
  data?: SimplificationResponse | CaptionSimplificationResponse
  error?: string
}