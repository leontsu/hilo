import React, { useState, useEffect } from 'react'
import type { 
  CEFRTestSession, 
  CEFRTestQuestion, 
  CEFRTestResult, 
  CEFRLevel,
  CEFRTestSessionResponse 
} from '../types'

interface CEFRTestProps {
  onTestComplete: (result: CEFRTestResult) => void
  onSkipTest: () => void
}

interface TestState {
  session: CEFRTestSession | null
  currentQuestion: CEFRTestQuestion | null | undefined
  questionStartTime: number
  selectedAnswer: number | null
  showFeedback: boolean
  isLoading: boolean
  error: string | null
  result: CEFRTestResult | null | undefined
  questionNumber: number
}

const LEVEL_DESCRIPTIONS: Record<CEFRLevel, string> = {
  'A1': 'Beginner - Basic words and phrases',
  'A2': 'Elementary - Simple everyday language',
  'B1': 'Intermediate - Clear standard language',
  'B2': 'Upper Intermediate - Complex topics',
  'C1': 'Advanced - Flexible and effective language'
}

export const CEFRTest: React.FC<CEFRTestProps> = ({ onTestComplete, onSkipTest }) => {
  const [state, setState] = useState<TestState>({
    session: null,
    currentQuestion: null,
    questionStartTime: 0,
    selectedAnswer: null,
    showFeedback: false,
    isLoading: false,
    error: null,
    result: null,
    questionNumber: 1
  })

  // Start the test when component mounts
  useEffect(() => {
    startTest()
  }, [])

  const startTest = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'START_CEFR_TEST' })
      
      if (response.success) {
        const data = response.data as CEFRTestSessionResponse
        setState(prev => ({
          ...prev,
          session: data.session,
          currentQuestion: data.currentQuestion,
          questionStartTime: Date.now(),
          isLoading: false,
          questionNumber: 1
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to start test',
          isLoading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to communicate with background script',
        isLoading: false
      }))
    }
  }

  const selectAnswer = (answerIndex: number) => {
    if (state.showFeedback || !state.currentQuestion) return
    
    setState(prev => ({ ...prev, selectedAnswer: answerIndex }))
  }

  const submitAnswer = async () => {
    if (state.selectedAnswer === null || !state.session || !state.currentQuestion) return

    setState(prev => ({ ...prev, isLoading: true }))
    
    const timeSpent = Date.now() - state.questionStartTime

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SUBMIT_CEFR_TEST_ANSWER',
        sessionId: state.session.id,
        questionId: state.currentQuestion.id,
        selectedAnswer: state.selectedAnswer,
        timeSpent
      })

      if (response.success) {
        const data = response.data as CEFRTestSessionResponse
        
        setState(prev => ({
          ...prev,
          session: data.session,
          showFeedback: true,
          isLoading: false
        }))

        // Show feedback for 2 seconds, then move to next question or show results
        setTimeout(() => {
          if (data.isComplete && data.result) {
            setState(prev => ({
              ...prev,
              result: data.result,
              currentQuestion: null
            }))
            onTestComplete(data.result)
          } else {
            setState(prev => ({
              ...prev,
              currentQuestion: data.currentQuestion,
              selectedAnswer: null,
              showFeedback: false,
              questionStartTime: Date.now(),
              questionNumber: prev.questionNumber + 1
            }))
          }
        }, 2000)
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to submit answer',
          isLoading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to communicate with background script',
        isLoading: false
      }))
    }
  }


  const getProgressPercentage = (): number => {
    const maxQuestions = 6
    return Math.min(100, (state.questionNumber / maxQuestions) * 100)
  }

  // Loading state
  if (state.isLoading && !state.currentQuestion) {
    return (
      <div className="cefr-test-container">
        <div className="test-header">
          <h2>CEFR Level Assessment</h2>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Starting your personalized level test...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (state.error) {
    return (
      <div className="cefr-test-container">
        <div className="test-header">
          <h2>CEFR Level Assessment</h2>
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{state.error}</p>
            <div className="error-actions">
              <button onClick={startTest} className="retry-button">
                Try Again
              </button>
              <button onClick={onSkipTest} className="skip-button">
                Skip Test
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Test complete state
  if (state.result) {
    return (
      <div className="cefr-test-container">
        <div className="test-complete">
          <div className="result-header">
            <div className="result-icon">🎉</div>
            <h2>Test Complete!</h2>
          </div>
          
          <div className="result-summary">
            <div className="final-level">
              <div className="level-badge level-{state.result.level.toLowerCase()}">
                {state.result.level}
              </div>
              <div className="level-description">
                {LEVEL_DESCRIPTIONS[state.result.level]}
              </div>
              <div className="confidence-score">
                Confidence: {Math.round(state.result.confidence * 100)}%
              </div>
            </div>
            
            <div className="result-stats">
              <div className="stat">
                <span className="stat-label">Questions:</span>
                <span className="stat-value">{state.result.totalQuestions}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Correct:</span>
                <span className="stat-value">{state.result.correctAnswers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Accuracy:</span>
                <span className="stat-value">
                  {Math.round((state.result.correctAnswers / state.result.totalQuestions) * 100)}%
                </span>
              </div>
            </div>
          </div>
          
          <p className="result-message">
            Your English level has been set to <strong>{state.result.level}</strong>. 
            You can change this anytime in settings or retake the test.
          </p>
        </div>
      </div>
    )
  }

  // Active test state
  if (!state.currentQuestion) {
    return (
      <div className="cefr-test-container">
        <div className="test-header">
          <h2>CEFR Level Assessment</h2>
          <p>No question available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="cefr-test-container">
      <div className="test-header">
        <h2>🎯 CEFR Level Assessment</h2>
        <div className="test-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <span className="progress-text">
            Question {state.questionNumber} of 6
          </span>
        </div>
        
      </div>

      <div className="question-container">
        <div className="question-category">
          {state.currentQuestion.category.charAt(0).toUpperCase() + state.currentQuestion.category.slice(1)}
        </div>
        
        <div className="question-text">
          {state.currentQuestion.question}
        </div>

        <div className="answer-options">
          {state.currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${
                state.selectedAnswer === index ? 'selected' : ''
              } ${
                state.showFeedback ? (
                  index === state.currentQuestion!.correctAnswer ? 'correct' : 
                  state.selectedAnswer === index ? 'incorrect' : 'disabled'
                ) : ''
              }`}
              onClick={() => selectAnswer(index)}
              disabled={state.showFeedback || state.isLoading}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

        {state.showFeedback && (
          <div className="feedback-container">
            <div className={`feedback ${
              state.selectedAnswer === state.currentQuestion.correctAnswer ? 'correct' : 'incorrect'
            }`}>
              <div className="feedback-icon">
                {state.selectedAnswer === state.currentQuestion.correctAnswer ? '✅' : '❌'}
              </div>
              <div className="feedback-content">
                <div className="feedback-result">
                  {state.selectedAnswer === state.currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                </div>
                {state.currentQuestion.explanation && (
                  <div className="feedback-explanation">
                    {state.currentQuestion.explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!state.showFeedback && (
          <div className="test-actions">
            <button
              onClick={submitAnswer}
              disabled={state.selectedAnswer === null || state.isLoading}
              className="submit-answer-button"
            >
              {state.isLoading ? 'Submitting...' : 'Submit Answer'}
            </button>
            
            <button
              onClick={onSkipTest}
              className="skip-test-button"
            >
              Skip Test
            </button>
          </div>
        )}
      </div>
    </div>
  )
}