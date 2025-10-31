import { 
  simplifyTextAIFast,
  generateQuizAI, 
  checkAICapabilities,
  getCacheStats
} from '../lib/ai'
import { 
  getSettings, 
  incrementSimplification, 
  incrementQuiz,
  saveTestResult 
} from '../lib/storage'
import { cefrTestEngine } from '../lib/cefrTestEngine'
import { 
  validateTextInput, 
  validateSettings, 
  checkRateLimit, 
  sanitizeText,
  decodeHtmlEntities 
} from '../lib/validation'
import type { 
  MessageRequest, 
  MessageResponse, 
  SimplificationRequest, 
  QuizRequest,
  SubmitCEFRTestAnswerRequest,
  GetNextCEFRQuestionRequest,
  FinalizeCEFRTestRequest
} from '../types'

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Hilo extension installed')
})

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((
  request: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
) => {
  console.log('Hilo Background: Received message:', request.type, request)
  
  handleMessage(request, sender)
    .then(response => {
      console.log('Hilo Background: Sending response:', response)
      sendResponse(response)
    })
    .catch(error => {
      console.error('Background message error:', error)
      const errorResponse = {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
      console.log('Hilo Background: Sending error response:', errorResponse)
      sendResponse(errorResponse)
    })
  
  // Return true to indicate async response
  return true
})

async function handleMessage(
  request: MessageRequest,
  _sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  try {
    // Get current user settings
    const settings = await getSettings()
    
    // Allow GET_SETTINGS even when extension is disabled
    if (request.type === 'GET_SETTINGS') {
      return {
        success: true,
        data: settings
      }
    }
    
    // Check if extension is enabled for other requests
    if (!settings.enabled) {
      return {
        success: false,
        error: 'Extension is disabled'
      }
    }

    switch (request.type) {
      case 'SIMPLIFY_TEXT':
        return await handleTextSimplification(request as SimplificationRequest)
      
      case 'GENERATE_QUIZ':
        return await handleQuizGeneration(request as QuizRequest)
      
      case 'CHECK_AI_CAPABILITIES':
        return await handleAICapabilityCheck()
      
      case 'ADJUST_PAGE':
        // Page adjustments are handled directly by content script
        return { success: true, data: { message: 'Page adjustment request acknowledged' } }
      
      case 'GET_CACHE_STATS':
        return {
          success: true,
          data: getCacheStats()
        }

      case 'START_CEFR_TEST':
        return await handleStartCEFRTest()

      case 'SUBMIT_CEFR_TEST_ANSWER':
        return await handleSubmitCEFRTestAnswer(request as SubmitCEFRTestAnswerRequest)

      case 'GET_NEXT_CEFR_QUESTION':
        return await handleGetNextCEFRQuestion(request as GetNextCEFRQuestionRequest)

      case 'FINALIZE_CEFR_TEST':
        return await handleFinalizeCEFRTest(request as FinalizeCEFRTestRequest)
      
      default:
        return {
          success: false,
          error: 'Unknown request type'
        }
    }
  } catch (error) {
    console.error('Error handling message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function handleTextSimplification(
  request: SimplificationRequest
): Promise<MessageResponse> {
  try {
    // Rate limiting check
    const identifier = `simplify_${Date.now()}`
    const rateCheck = checkRateLimit(identifier)
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait before making more requests.'
      }
    }

    // Validate and sanitize input text
    const textValidation = validateTextInput(request.text)
    if (!textValidation.isValid) {
      return {
        success: false,
        error: textValidation.error
      }
    }

    // Get current settings (override with request settings if provided)
    const currentSettings = await getSettings()
    const settingsValidation = validateSettings(request.settings)
    if (!settingsValidation.isValid) {
      return {
        success: false,
        error: settingsValidation.error
      }
    }
    
    const settings = { ...currentSettings, ...request.settings }
    const sanitizedText = sanitizeText(request.text)

    // Simplify the text using fast AI with caching
    const result = await simplifyTextAIFast(sanitizedText, settings)
    
    // Decode HTML entities in the simplified text
    if (result.simplified) {
      result.simplified = decodeHtmlEntities(result.simplified)
    }
    if (result.summary) {
      result.summary = decodeHtmlEntities(result.summary)
    }
    
    // Track usage statistics
    const wordCount = sanitizedText.split(/\s+/).filter(word => word.length > 0).length
    await incrementSimplification(wordCount)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Text simplification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Simplification failed'
    }
  }
}

// Handle tab updates to inject content scripts if needed
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Only inject on supported URLs
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      console.log('Tab updated:', tab.url)
    }
  }
})

async function handleQuizGeneration(
  request: QuizRequest
): Promise<MessageResponse> {
  try {
    // Get current settings (override with request settings if provided)
    const currentSettings = await getSettings()
    const settings = { ...currentSettings, ...request.settings }
    
    // Validate input
    if (!request.text || request.text.trim().length === 0) {
      return {
        success: false,
        error: 'No text provided for quiz generation'
      }
    }

    // Generate quiz using AI
    const result = await generateQuizAI(request.text, settings)
    
    // Track usage statistics
    await incrementQuiz()
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Quiz generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Quiz generation failed'
    }
  }
}

async function handleAICapabilityCheck(): Promise<MessageResponse> {
  try {
    const capabilities = await checkAICapabilities()
    
    return {
      success: true,
      data: { capabilities }
    }
  } catch (error) {
    console.error('AI capability check error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI capability check failed'
    }
  }
}

// CEFR Test handlers
async function handleStartCEFRTest(): Promise<MessageResponse> {
  try {
    const session = cefrTestEngine.startTestSession()
    const currentQuestion = cefrTestEngine.getNextQuestion(session.id)
    
    return {
      success: true,
      data: {
        session,
        currentQuestion: currentQuestion || undefined,
        isComplete: false
      }
    }
  } catch (error) {
    console.error('Error starting CEFR test:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start CEFR test'
    }
  }
}

async function handleSubmitCEFRTestAnswer(request: SubmitCEFRTestAnswerRequest): Promise<MessageResponse> {
  try {
    const result = cefrTestEngine.submitAnswer(
      request.sessionId,
      request.questionId,
      request.selectedAnswer,
      request.timeSpent
    )
    
    let currentQuestion = undefined
    let testResult = undefined
    
    if (!result.isComplete) {
      const nextQuestion = cefrTestEngine.getNextQuestion(request.sessionId)
      currentQuestion = nextQuestion || undefined
    } else {
      testResult = cefrTestEngine.finalizeTest(request.sessionId)
      await saveTestResult(testResult)
    }
    
    return {
      success: true,
      data: {
        session: result.session,
        currentQuestion,
        isComplete: result.isComplete,
        result: testResult
      }
    }
  } catch (error) {
    console.error('Error submitting CEFR test answer:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit answer'
    }
  }
}

async function handleGetNextCEFRQuestion(request: GetNextCEFRQuestionRequest): Promise<MessageResponse> {
  try {
    const session = cefrTestEngine.getSession(request.sessionId)
    if (!session) {
      return {
        success: false,
        error: 'Session not found'
      }
    }
    
    const nextQuestion = cefrTestEngine.getNextQuestion(request.sessionId)
    
    return {
      success: true,
      data: {
        session,
        currentQuestion: nextQuestion || undefined,
        isComplete: session.completed
      }
    }
  } catch (error) {
    console.error('Error getting next CEFR question:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get next question'
    }
  }
}

async function handleFinalizeCEFRTest(request: FinalizeCEFRTestRequest): Promise<MessageResponse> {
  try {
    const testResult = cefrTestEngine.finalizeTest(request.sessionId)
    await saveTestResult(testResult)
    
    return {
      success: true,
      data: {
        session: undefined as any,
        currentQuestion: undefined,
        isComplete: true,
        result: testResult
      }
    }
  } catch (error) {
    console.error('Error finalizing CEFR test:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to finalize test'
    }
  }
}

// Handle storage changes and notify content scripts
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    console.log('Hilo: Storage changed, broadcasting to all tabs:', changes)
    // Broadcast settings changes to all tabs
    chrome.tabs.query({}, (tabs) => {
      console.log(`Hilo: Broadcasting SETTINGS_CHANGED to ${tabs.length} tabs`)
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_CHANGED',
            changes
          }).catch((error) => {
            // Ignore errors for tabs that don't have content scripts
            console.log(`Hilo: Could not send message to tab ${tab.id}:`, error.message)
          })
        }
      })
    })
  }
})