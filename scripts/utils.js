/**
 * Utility Functions
 * Shared helper functions for Hilo extension
 */

/**
 * Validate CEFR level
 * @param {string} level - Level to validate
 * @returns {boolean} True if valid
 */
export function isValidLevel(level) {
  const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  return validLevels.includes(level.toUpperCase());
}

/**
 * Get level description
 * @param {string} level - CEFR level
 * @returns {string} Level description
 */
export function getLevelDescription(level) {
  const descriptions = {
    A1: 'Beginner',
    A2: 'Elementary',
    B1: 'Intermediate',
    B2: 'Upper Intermediate',
    C1: 'Advanced'
  };
  return descriptions[level.toUpperCase()] || 'Unknown';
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
export function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimate reading time (words per minute)
 * @param {string} text - Text to estimate
 * @param {number} wpm - Words per minute (default: 200)
 * @returns {number} Reading time in minutes
 */
export function estimateReadingTime(text, wpm = 200) {
  const words = countWords(text);
  return Math.ceil(words / wpm);
}

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Check if URL is a YouTube page
 * @param {string} url - URL to check
 * @returns {boolean} True if YouTube
 */
export function isYouTubeURL(url) {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
export function extractYouTubeVideoId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtu\.be\/([^?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Sanitize text (remove HTML tags, extra whitespace)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');
  
  // Replace multiple whitespace with single space
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Trim
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Split text into sentences
 * @param {string} text - Text to split
 * @returns {Array<string>} Array of sentences
 */
export function splitIntoSentences(text) {
  // Simple sentence splitting (can be improved)
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Calculate text complexity score (basic heuristic)
 * @param {string} text - Text to analyze
 * @returns {number} Complexity score (0-100)
 */
export function calculateComplexity(text) {
  const words = text.split(/\s+/);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const sentences = splitIntoSentences(text);
  const avgSentenceLength = words.length / sentences.length;
  
  // Simple heuristic: longer words and sentences = more complex
  const wordScore = Math.min(avgWordLength * 10, 50);
  const sentenceScore = Math.min(avgSentenceLength * 2, 50);
  
  return Math.round(wordScore + sentenceScore);
}

/**
 * Suggest appropriate CEFR level based on text complexity
 * @param {string} text - Text to analyze
 * @returns {string} Suggested CEFR level
 */
export function suggestLevel(text) {
  const complexity = calculateComplexity(text);
  
  if (complexity < 30) return 'A1';
  if (complexity < 45) return 'A2';
  if (complexity < 60) return 'B1';
  if (complexity < 75) return 'B2';
  return 'C1';
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Log extension activity (for debugging)
 * @param {string} action - Action name
 * @param {Object} data - Additional data
 */
export function logActivity(action, data = {}) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Hilo] ${action}`, data);
  }
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

