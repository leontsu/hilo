/**
 * Hilo - Chrome Extension Prompt Templates
 * For use with Chrome Built-in AI APIs (Prompt API, Summarizer API, Writer API, Translator API)
 * 
 * CEFR Levels: A1 (Beginner), A2 (Elementary), B1 (Intermediate), B2 (Upper Intermediate), C1 (Advanced)
 */

/**
 * Builds a simplification prompt for text rewriting based on learner level
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1)
 * @param {string} text - Original text to simplify
 * @returns {string} Formatted prompt for Chrome Prompt API
 */
export const buildSimplificationPrompt = (level, text) => `
You are a language learning assistant helping simplify text for ${level} level English learners.

TASK:
Rewrite the following text to match ${level} CEFR proficiency:
- Use appropriate vocabulary and sentence structures for ${level} level
- Keep the original meaning and key information intact
- Break down complex sentences into simpler ones
- Replace difficult words with simpler alternatives when possible

After the simplified text, include:
1. A "Vocabulary" section with 3-5 difficult words from the ORIGINAL text
2. For each word: definition, part of speech, and one example sentence

FORMAT:
[Simplified Text]

---
VOCABULARY:
• word (part of speech): definition
  Example: [example sentence]

ORIGINAL TEXT:
${text}
`;

/**
 * Builds a quiz generation prompt based on simplified text
 * @param {string} text - Simplified text to generate quiz from
 * @param {string} level - Optional CEFR level for difficulty adjustment
 * @returns {string} Formatted prompt for Chrome Prompt API
 */
export const buildQuizPrompt = (text, level = 'B1') => `
You are a language learning assistant creating comprehension exercises.

TASK:
Based on the text below, generate 3 quiz questions appropriate for ${level} level learners:
1. Two fill-in-the-blank questions testing vocabulary or grammar
2. One multiple-choice question about a synonym or word meaning

For each question, provide:
- The question text
- The correct answer
- A brief one-line explanation

FORMAT:
QUESTION 1 (Fill-in-the-blank):
[Question with _____ for the blank]
Answer: [correct answer]
Explanation: [why this is correct]

QUESTION 2 (Fill-in-the-blank):
[Question with _____ for the blank]
Answer: [correct answer]
Explanation: [why this is correct]

QUESTION 3 (Synonym/Multiple choice):
[Question asking about word meaning]
a) [option]
b) [option]
c) [option]
d) [option]
Answer: [correct letter and word]
Explanation: [why this is correct]

TEXT:
${text}
`;

/**
 * Builds a translation prompt for simplified text
 * @param {string} targetLang - Target language name (e.g., "Spanish", "French", "Japanese")
 * @param {string} text - Simplified text to translate
 * @returns {string} Formatted prompt for Chrome Translator/Prompt API
 */
export const buildTranslationPrompt = (targetLang, text) => `
You are a language learning assistant providing translations for learners.

TASK:
Translate the following simplified English text into ${targetLang}.

REQUIREMENTS:
- Keep the same level of simplicity and clarity
- Maintain similar sentence length and structure
- Use natural, conversational ${targetLang}
- Preserve the tone and style of the original

SIMPLIFIED TEXT:
${text}
`;

/**
 * Builds a context-aware simplification prompt for web content
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1)
 * @param {string} text - Original text to simplify
 * @param {string} contentType - Type of content (e.g., "article", "youtube-caption", "website")
 * @returns {string} Formatted prompt for Chrome Prompt API
 */
export const buildContextualSimplificationPrompt = (level, text, contentType = 'text') => `
You are a language learning assistant helping simplify ${contentType} content for ${level} level English learners.

TASK:
Rewrite the following ${contentType} to match ${level} CEFR proficiency:
- Use appropriate vocabulary for ${level} learners
- Simplify complex grammar structures
- Keep the main ideas and important details
- Make it easy to understand while staying accurate
${contentType === 'youtube-caption' ? '- Fix any speech-to-text errors or unclear phrasing' : ''}

After the simplified text, provide:
• 3-5 key vocabulary words with simple definitions
• Each word should include one example sentence

ORIGINAL ${contentType.toUpperCase()}:
${text}
`;

/**
 * Builds a summary prompt for longer content
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1)
 * @param {string} text - Original text to summarize
 * @param {number} maxSentences - Maximum number of sentences in summary (default: 5)
 * @returns {string} Formatted prompt for Chrome Summarizer API
 */
export const buildSummaryPrompt = (level, text, maxSentences = 5) => `
You are a language learning assistant creating summaries for ${level} level English learners.

TASK:
Summarize the following text in ${maxSentences} sentences or less, using simple language appropriate for ${level} learners:
- Focus on the main ideas only
- Use short, clear sentences
- Use vocabulary appropriate for ${level} level
- Make it easy to understand

TEXT:
${text}
`;

// Utility function to validate CEFR level
export const isValidLevel = (level) => {
  const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  return validLevels.includes(level.toUpperCase());
};

// Level descriptions for UI or validation
export const CEFR_LEVELS = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper Intermediate',
  C1: 'Advanced'
};

