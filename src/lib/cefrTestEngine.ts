import type { 
  CEFRLevel, 
  CEFRTestSession, 
  CEFRTestQuestion, 
  CEFRTestResponse, 
  CEFRTestResult 
} from '../types'
import { getRandomQuestionByLevel, getQuestionsByLevel } from './cefrTestQuestions'

// CEFR Level mapping for calculations
const LEVEL_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']
const LEVEL_VALUES: Record<CEFRLevel, number> = {
  'A1': 1,
  'A2': 2,
  'B1': 3,
  'B2': 4,
  'C1': 5
}

export class AdaptiveCEFRTestEngine {
  private sessions: Map<string, CEFRTestSession> = new Map()
  private readonly maxQuestions = 6
  private readonly initialLevel: CEFRLevel = 'B1'

  /**
   * Start a new CEFR test session
   */
  startTestSession(): CEFRTestSession {
    const sessionId = this.generateSessionId()
    
    const session: CEFRTestSession = {
      id: sessionId,
      startTime: Date.now(),
      initialLevel: this.initialLevel,
      finalLevel: this.initialLevel,
      confidence: 0,
      responses: [],
      completed: false
    }
    
    this.sessions.set(sessionId, session)
    console.log(`[CEFR Test] Started new session: ${sessionId}`)
    
    return session
  }

  /**
   * Get the next question for a session
   */
  getNextQuestion(sessionId: string): CEFRTestQuestion | null {
    const session = this.sessions.get(sessionId)
    if (!session || session.completed) {
      return null
    }

    // Determine current level to test
    const currentLevel = this.getCurrentTestLevel(session)
    const question = getRandomQuestionByLevel(currentLevel)
    
    if (!question) {
      console.error(`[CEFR Test] No questions available for level: ${currentLevel}`)
      return null
    }

    console.log(`[CEFR Test] Generated question for level ${currentLevel}: ${question.id}`)
    return question
  }

  /**
   * Submit an answer and update the session
   */
  submitAnswer(
    sessionId: string, 
    questionId: string, 
    selectedAnswer: number, 
    timeSpent: number
  ): { 
    session: CEFRTestSession, 
    isCorrect: boolean, 
    levelChanged: boolean,
    isComplete: boolean 
  } {
    const session = this.sessions.get(sessionId)
    if (!session || session.completed) {
      throw new Error('Invalid or completed session')
    }

    // Find the question to determine correctness
    const question = this.findQuestionById(questionId)
    if (!question) {
      throw new Error('Question not found')
    }

    const isCorrect = selectedAnswer === question.correctAnswer
    const previousLevel = session.finalLevel

    // Create response record
    const response: CEFRTestResponse = {
      questionId,
      selectedAnswer,
      isCorrect,
      timeSpent,
      previousLevel,
      newLevel: previousLevel // Will be updated below
    }

    // Update level based on response
    const newLevel = this.calculateNewLevel(session, question, isCorrect)
    response.newLevel = newLevel
    session.finalLevel = newLevel

    // Add response to session
    session.responses.push(response)

    // Check if test should be completed
    const isComplete = this.shouldCompleteTest(session)
    if (isComplete) {
      session.completed = true
      session.endTime = Date.now()
      session.confidence = this.calculateConfidence(session)
    }

    const levelChanged = previousLevel !== newLevel

    console.log(`[CEFR Test] Answer submitted: ${isCorrect ? 'correct' : 'incorrect'}, Level: ${previousLevel} → ${newLevel}`)

    return {
      session,
      isCorrect,
      levelChanged,
      isComplete
    }
  }

  /**
   * Finalize a test session and generate results
   */
  finalizeTest(sessionId: string): CEFRTestResult {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    if (!session.completed) {
      session.completed = true
      session.endTime = Date.now()
      session.confidence = this.calculateConfidence(session)
    }

    const result = this.generateTestResult(session)
    
    // Clean up session
    this.sessions.delete(sessionId)
    
    console.log(`[CEFR Test] Test finalized: Level ${result.level} (${Math.round(result.confidence * 100)}% confidence)`)
    
    return result
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): CEFRTestSession | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Calculate the new level based on the response
   */
  private calculateNewLevel(
    session: CEFRTestSession, 
    question: CEFRTestQuestion, 
    isCorrect: boolean
  ): CEFRLevel {
    const currentLevel = session.finalLevel
    const currentLevelIndex = LEVEL_ORDER.indexOf(currentLevel)
    const recentResponses = session.responses.slice(-2) // Last 2 responses
    
    if (isCorrect) {
      // Correct answer: only move up if consistently correct at current level
      if (question.level === currentLevel || 
          LEVEL_VALUES[question.level] >= LEVEL_VALUES[currentLevel]) {
        
        // Check if user has been consistently correct recently
        const recentCorrect = recentResponses.filter(r => r.isCorrect).length
        const needsConsistency = recentResponses.length >= 2 && recentCorrect >= 2
        
        if (needsConsistency || session.responses.length === 0) {
          const nextLevelIndex = Math.min(currentLevelIndex + 1, LEVEL_ORDER.length - 1)
          return LEVEL_ORDER[nextLevelIndex]
        }
      }
      return currentLevel
    } else {
      // Incorrect answer: only move down if consistently incorrect at current level
      if (question.level === currentLevel ||
          LEVEL_VALUES[question.level] <= LEVEL_VALUES[currentLevel]) {
        
        // Check if user has been consistently incorrect recently
        const recentIncorrect = recentResponses.filter(r => !r.isCorrect).length
        const needsAdjustment = recentResponses.length >= 2 && recentIncorrect >= 2
        
        if (needsAdjustment) {
          const prevLevelIndex = Math.max(currentLevelIndex - 1, 0)
          return LEVEL_ORDER[prevLevelIndex]
        }
      }
      return currentLevel
    }
  }

  /**
   * Determine what level to test next
   */
  private getCurrentTestLevel(session: CEFRTestSession): CEFRLevel {
    if (session.responses.length === 0) {
      return session.initialLevel
    }

    // Use current level with some variation for more accurate testing
    const currentLevel = session.finalLevel
    const recentResponses = session.responses.slice(-2) // Last 2 responses
    
    // If consistently correct at current level, test higher
    if (recentResponses.length >= 2 && 
        recentResponses.every(r => r.isCorrect && LEVEL_VALUES[r.previousLevel] >= LEVEL_VALUES[currentLevel])) {
      const currentIndex = LEVEL_ORDER.indexOf(currentLevel)
      const nextIndex = Math.min(currentIndex + 1, LEVEL_ORDER.length - 1)
      return LEVEL_ORDER[nextIndex]
    }
    
    // If consistently incorrect, test lower
    if (recentResponses.length >= 2 && 
        recentResponses.every(r => !r.isCorrect && LEVEL_VALUES[r.previousLevel] <= LEVEL_VALUES[currentLevel])) {
      const currentIndex = LEVEL_ORDER.indexOf(currentLevel)
      const prevIndex = Math.max(currentIndex - 1, 0)
      return LEVEL_ORDER[prevIndex]
    }

    // Otherwise test at current level
    return currentLevel
  }

  /**
   * Determine if the test should be completed
   */
  private shouldCompleteTest(session: CEFRTestSession): boolean {
    // Complete after maximum questions
    if (session.responses.length >= this.maxQuestions) {
      return true
    }

    // Complete if level has stabilized (same level for last 3 responses)
    if (session.responses.length >= 4) {
      const lastThreeLevels = session.responses.slice(-3).map(r => r.newLevel)
      const isStabilized = lastThreeLevels.every(level => level === lastThreeLevels[0])
      
      if (isStabilized) {
        return true
      }
    }

    return false
  }

  /**
   * Calculate confidence score based on response patterns
   */
  private calculateConfidence(session: CEFRTestSession): number {
    if (session.responses.length === 0) return 0

    const finalLevel = session.finalLevel
    let consistencyScore = 0
    let levelStabilityScore = 0

    // Calculate consistency at final level
    const responsesAtFinalLevel = session.responses.filter(r => 
      r.newLevel === finalLevel || r.previousLevel === finalLevel
    )
    
    if (responsesAtFinalLevel.length > 0) {
      const correctAtLevel = responsesAtFinalLevel.filter(r => r.isCorrect).length
      consistencyScore = correctAtLevel / responsesAtFinalLevel.length
    }

    // Calculate level stability (how much the level changed)
    const uniqueLevels = new Set(session.responses.map(r => r.newLevel))
    levelStabilityScore = Math.max(0, 1 - (uniqueLevels.size - 1) * 0.2)

    // Combine scores
    const confidence = (consistencyScore * 0.7 + levelStabilityScore * 0.3)
    
    return Math.max(0.3, Math.min(1.0, confidence)) // Clamp between 0.3 and 1.0
  }

  /**
   * Generate comprehensive test result
   */
  private generateTestResult(session: CEFRTestSession): CEFRTestResult {
    const totalQuestions = session.responses.length
    const correctAnswers = session.responses.filter(r => r.isCorrect).length
    const totalTime = session.responses.reduce((sum, r) => sum + r.timeSpent, 0)
    const averageTimePerQuestion = totalTime / totalQuestions

    // Calculate category scores
    const categoryScores = {
      vocabulary: this.calculateCategoryScore(session, 'vocabulary'),
      grammar: this.calculateCategoryScore(session, 'grammar'),
      reading: this.calculateCategoryScore(session, 'reading')
    }

    // Track level progression
    const levelProgression = [session.initialLevel, ...session.responses.map(r => r.newLevel)]

    return {
      level: session.finalLevel,
      confidence: session.confidence,
      sessionId: session.id,
      testDate: session.startTime,
      totalQuestions,
      correctAnswers,
      averageTimePerQuestion,
      categoryScores,
      levelProgression
    }
  }

  /**
   * Calculate score for a specific category
   */
  private calculateCategoryScore(session: CEFRTestSession, category: string): number {
    const categoryResponses = session.responses.filter(r => {
      const question = this.findQuestionById(r.questionId)
      return question?.category === category
    })

    if (categoryResponses.length === 0) return 0

    const correct = categoryResponses.filter(r => r.isCorrect).length
    return correct / categoryResponses.length
  }

  /**
   * Find a question by ID (helper method)
   */
  private findQuestionById(questionId: string): CEFRTestQuestion | null {
    // Extract level from question ID (format: level-category-number)
    const levelMatch = questionId.match(/^([a-c][12])-/)
    if (!levelMatch) return null

    const level = levelMatch[1].toUpperCase() as CEFRLevel
    
    // Get all questions for this level and find the matching one
    const questions = getQuestionsByLevel(level)
    
    return questions.find((q: CEFRTestQuestion) => q.id === questionId) || null
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `cefr-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const cefrTestEngine = new AdaptiveCEFRTestEngine()