/**
 * AI Service - Wrapper for Chrome Built-in AI APIs
 * Handles Prompt API, Summarizer API, Writer API, and Translator API
 */

import {
  buildSimplificationPrompt,
  buildQuizPrompt,
  buildTranslationPrompt,
  buildContextualSimplificationPrompt,
  buildSummaryPrompt
} from '../prompts.js';

/**
 * Check if Chrome AI APIs are available
 * @returns {Promise<Object>} Availability status and capabilities
 */
export async function checkAIAvailability() {
  try {
    const capabilities = {
      promptAPI: typeof self.ai?.languageModel !== 'undefined',
      summarizerAPI: typeof self.ai?.summarizer !== 'undefined',
      writerAPI: typeof self.ai?.writer !== 'undefined',
      translatorAPI: typeof self.translation !== 'undefined'
    };

    return {
      available: Object.values(capabilities).some(v => v),
      capabilities
    };
  } catch (error) {
    console.error('Error checking AI availability:', error);
    return { available: false, error: error.message };
  }
}

/**
 * Simplify text using Chrome Prompt API
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1)
 * @param {string} text - Original text to simplify
 * @param {string} contentType - Optional content type (e.g., 'article', 'youtube-caption')
 * @returns {Promise<string>} Simplified text with vocabulary
 */
export async function simplifyText(level, text, contentType = 'text') {
  try {
    // Check if Prompt API is available
    if (!self.ai || !self.ai.languageModel) {
      throw new Error('Chrome Prompt API is not available. Please enable it in chrome://flags');
    }

    // Create language model session
    const session = await self.ai.languageModel.create({
      systemPrompt: 'You are a helpful language learning assistant that simplifies text for English learners.',
      temperature: 0.7,
      topK: 40
    });

    // Build prompt
    const prompt = contentType === 'text' 
      ? buildSimplificationPrompt(level, text)
      : buildContextualSimplificationPrompt(level, text, contentType);

    // Generate response
    const result = await session.prompt(prompt);

    // Clean up session
    session.destroy();

    return result;

  } catch (error) {
    console.error('Simplification error:', error);
    
    // Fallback for development/testing
    if (error.message.includes('not available')) {
      return getFallbackSimplification(level, text);
    }
    
    throw error;
  }
}

/**
 * Generate quiz questions using Chrome Prompt API
 * @param {string} text - Text to generate quiz from
 * @param {string} level - CEFR level for difficulty adjustment
 * @returns {Promise<string>} Quiz questions with answers
 */
export async function generateQuiz(text, level = 'B1') {
  try {
    if (!self.ai || !self.ai.languageModel) {
      throw new Error('Chrome Prompt API is not available. Please enable it in chrome://flags');
    }

    const session = await self.ai.languageModel.create({
      systemPrompt: 'You are a helpful language learning assistant that creates comprehension exercises.',
      temperature: 0.8,
      topK: 40
    });

    const prompt = buildQuizPrompt(text, level);
    const result = await session.prompt(prompt);

    session.destroy();
    return result;

  } catch (error) {
    console.error('Quiz generation error:', error);
    
    if (error.message.includes('not available')) {
      return getFallbackQuiz(text);
    }
    
    throw error;
  }
}

/**
 * Translate text using Chrome Translator API or Prompt API
 * @param {string} targetLang - Target language name
 * @param {string} text - Text to translate
 * @returns {Promise<string>} Translated text
 */
export async function translateText(targetLang, text) {
  try {
    // Try Chrome Translator API first
    if (self.translation && self.translation.canTranslate) {
      const canTranslate = await self.translation.canTranslate({
        sourceLanguage: 'en',
        targetLanguage: targetLang.toLowerCase()
      });

      if (canTranslate === 'readily') {
        const translator = await self.translation.createTranslator({
          sourceLanguage: 'en',
          targetLanguage: targetLang.toLowerCase()
        });

        const result = await translator.translate(text);
        return result;
      }
    }

    // Fallback to Prompt API
    if (self.ai && self.ai.languageModel) {
      const session = await self.ai.languageModel.create({
        systemPrompt: 'You are a helpful translation assistant.',
        temperature: 0.5
      });

      const prompt = buildTranslationPrompt(targetLang, text);
      const result = await session.prompt(prompt);

      session.destroy();
      return result;
    }

    throw new Error('No translation API available');

  } catch (error) {
    console.error('Translation error:', error);
    
    if (error.message.includes('not available')) {
      return getFallbackTranslation(targetLang, text);
    }
    
    throw error;
  }
}

/**
 * Summarize text using Chrome Summarizer API or Prompt API
 * @param {string} level - CEFR level
 * @param {string} text - Text to summarize
 * @param {number} maxSentences - Maximum sentences in summary
 * @returns {Promise<string>} Summarized text
 */
export async function summarizeText(level, text, maxSentences = 5) {
  try {
    // Try Chrome Summarizer API first
    if (self.ai && self.ai.summarizer) {
      const canSummarize = await self.ai.summarizer.capabilities();
      
      if (canSummarize.available === 'readily') {
        const summarizer = await self.ai.summarizer.create({
          type: 'tl;dr',
          format: 'plain-text',
          length: 'short'
        });

        const result = await summarizer.summarize(text);
        return result;
      }
    }

    // Fallback to Prompt API
    if (self.ai && self.ai.languageModel) {
      const session = await self.ai.languageModel.create({
        systemPrompt: 'You are a helpful assistant that creates clear summaries.',
        temperature: 0.6
      });

      const prompt = buildSummaryPrompt(level, text, maxSentences);
      const result = await session.prompt(prompt);

      session.destroy();
      return result;
    }

    throw new Error('No summarization API available');

  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
}

// Fallback functions for development/testing

function getFallbackSimplification(level, text) {
  return `[FALLBACK MODE - Chrome AI not available]

Simplified for ${level} level:

${text}

---
VOCABULARY:
• Example word (noun): A sample word for demonstration
  Example: This is an example sentence.

Note: Enable Chrome AI APIs in chrome://flags to use real AI simplification.`;
}

function getFallbackQuiz(text) {
  return `[FALLBACK MODE - Chrome AI not available]

QUESTION 1 (Fill-in-the-blank):
The main idea of the text is _____.
Answer: [main concept]
Explanation: This tests understanding of the main point.

QUESTION 2 (Fill-in-the-blank):
An important detail mentioned is _____.
Answer: [key detail]
Explanation: This checks if you caught an important detail.

QUESTION 3 (Synonym/Multiple choice):
What does "example" mean in this context?
a) Sample
b) Problem
c) Solution
d) Question
Answer: a) Sample
Explanation: "Example" means a representative sample or instance.

Note: Enable Chrome AI APIs in chrome://flags to use real AI quiz generation.`;
}

function getFallbackTranslation(targetLang, text) {
  return `[FALLBACK MODE - Chrome AI not available]

Translation to ${targetLang}:

${text}

Note: Enable Chrome AI APIs in chrome://flags to use real translation.`;
}

