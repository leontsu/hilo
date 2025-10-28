// Input validation and security utilities

import type { CEFRLevel, UserSettings } from '../types'

// Constants for validation
export const VALIDATION_LIMITS = {
  MIN_TEXT_LENGTH: 1,
  MAX_TEXT_LENGTH: 10000,
  MAX_QUIZ_QUESTIONS: 5,
  MIN_QUIZ_OPTIONS: 2,
  MAX_QUIZ_OPTIONS: 6,
  RATE_LIMIT_REQUESTS: 10,
  RATE_LIMIT_WINDOW: 60000 // 1 minute
} as const

// Valid CEFR levels
const VALID_CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Sanitizes text input to prevent XSS and injection attacks
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string')
  }
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Validates text input for processing
 */
export function validateTextInput(text: string): { isValid: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Text input is required' }
  }

  const trimmedText = text.trim()
  
  if (trimmedText.length < VALIDATION_LIMITS.MIN_TEXT_LENGTH) {
    return { isValid: false, error: 'Text is too short' }
  }
  
  if (trimmedText.length > VALIDATION_LIMITS.MAX_TEXT_LENGTH) {
    return { isValid: false, error: 'Text is too long (max 10,000 characters)' }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedText)) {
      return { isValid: false, error: 'Text contains invalid content' }
    }
  }

  return { isValid: true }
}

/**
 * Validates user settings
 */
export function validateSettings(settings: Partial<UserSettings>): { isValid: boolean; error?: string } {
  if (settings.level && !VALID_CEFR_LEVELS.includes(settings.level)) {
    return { isValid: false, error: 'Invalid CEFR level' }
  }

  if (settings.enabled !== undefined && typeof settings.enabled !== 'boolean') {
    return { isValid: false, error: 'Enabled setting must be boolean' }
  }

  return { isValid: true }
}

/**
 * Rate limiting check
 */
export function checkRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Reset or initialize
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + VALIDATION_LIMITS.RATE_LIMIT_WINDOW
    })
    return { allowed: true }
  }

  if (entry.count >= VALIDATION_LIMITS.RATE_LIMIT_REQUESTS) {
    return { allowed: false, resetTime: entry.resetTime }
  }

  entry.count++
  return { allowed: true }
}

/**
 * Validates quiz question format
 */
export function validateQuizQuestion(question: any): { isValid: boolean; error?: string } {
  if (!question || typeof question !== 'object') {
    return { isValid: false, error: 'Question must be an object' }
  }

  if (!question.question || typeof question.question !== 'string') {
    return { isValid: false, error: 'Question text is required' }
  }

  if (!Array.isArray(question.options)) {
    return { isValid: false, error: 'Options must be an array' }
  }

  if (question.options.length < VALIDATION_LIMITS.MIN_QUIZ_OPTIONS ||
      question.options.length > VALIDATION_LIMITS.MAX_QUIZ_OPTIONS) {
    return { isValid: false, error: `Options must be between ${VALIDATION_LIMITS.MIN_QUIZ_OPTIONS} and ${VALIDATION_LIMITS.MAX_QUIZ_OPTIONS}` }
  }

  if (typeof question.correctAnswer !== 'number' ||
      question.correctAnswer < 0 ||
      question.correctAnswer >= question.options.length) {
    return { isValid: false, error: 'Invalid correct answer index' }
  }

  return { isValid: true }
}

/**
 * Escapes HTML for safe display
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Decodes HTML entities back to regular characters
 */
export function decodeHtmlEntities(text: string): string {
  if (typeof text !== 'string') {
    return text
  }
  
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')
}

/**
 * Validates URL for content scripts
 */
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}