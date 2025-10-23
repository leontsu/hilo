import { simplifyText, simplifyCaptions } from '../lib/ai'
import { getSettings } from '../lib/storage'
import type { 
  MessageRequest, 
  MessageResponse, 
  SimplificationRequest, 
  CaptionSimplificationRequest 
} from '../types'

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LevelLens extension installed')
})

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((
  request: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
) => {
  handleMessage(request, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('Background message error:', error)
      sendResponse({
        success: false,
        error: error.message || 'Unknown error occurred'
      })
    })
  
  // Return true to indicate async response
  return true
})

async function handleMessage(
  request: MessageRequest,
  sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  try {
    // Get current user settings
    const settings = await getSettings()
    
    // Check if extension is enabled
    if (!settings.enabled) {
      return {
        success: false,
        error: 'Extension is disabled'
      }
    }

    switch (request.type) {
      case 'SIMPLIFY_TEXT':
        return await handleTextSimplification(request as SimplificationRequest)
      
      case 'SIMPLIFY_CAPTIONS':
        return await handleCaptionSimplification(request as CaptionSimplificationRequest)
      
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
    // Get current settings (override with request settings if provided)
    const currentSettings = await getSettings()
    const settings = { ...currentSettings, ...request.settings }
    
    // Validate input
    if (!request.text || request.text.trim().length === 0) {
      return {
        success: false,
        error: 'No text provided'
      }
    }

    // Simplify the text
    const result = simplifyText(request.text, settings)
    
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

async function handleCaptionSimplification(
  request: CaptionSimplificationRequest
): Promise<MessageResponse> {
  try {
    // Get current settings (override with request settings if provided)
    const currentSettings = await getSettings()
    const settings = { ...currentSettings, ...request.settings }
    
    // Validate input
    if (!request.lines || request.lines.length === 0) {
      return {
        success: false,
        error: 'No caption lines provided'
      }
    }

    // Simplify the captions
    const simplifiedLines = simplifyCaptions(request.lines, settings)
    
    return {
      success: true,
      data: { lines: simplifiedLines }
    }
  } catch (error) {
    console.error('Caption simplification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Caption simplification failed'
    }
  }
}

// Handle tab updates to inject content scripts if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Only inject on supported URLs
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      console.log('Tab updated:', tab.url)
    }
  }
})

// Handle storage changes and notify content scripts
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // Broadcast settings changes to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_CHANGED',
            changes
          }).catch(() => {
            // Ignore errors for tabs that don't have content scripts
          })
        }
      })
    })
  }
})