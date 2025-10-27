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
import { createLogger } from './logger.js';

// Create logger for AI service
const logger = createLogger('AIService');

/**
 * Check if Chrome AI APIs are available
 * @returns {Promise<Object>} Availability status and capabilities
 */
export async function checkAIAvailability() {
  const availabilityLogger = logger.createTryCatchLogger('AI Availability Check');
  
  return await availabilityLogger.tryAsync(async () => {
    logger.debug('Checking Chrome AI API availability');
    
    const capabilities = {
      promptAPI: typeof self.ai?.languageModel !== 'undefined',
      summarizerAPI: typeof self.ai?.summarizer !== 'undefined',
      writerAPI: typeof self.ai?.writer !== 'undefined',
      translatorAPI: typeof self.translation !== 'undefined'
    };
    
    const available = Object.values(capabilities).some(v => v);
    
    logger.info('AI availability check completed', { available, capabilities });

    return {
      available,
      capabilities
    };
  }, 'AI availability check failed');
}

/**
 * Simplify text using Chrome Prompt API
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1)
 * @param {string} text - Original text to simplify
 * @param {string} contentType - Optional content type (e.g., 'article', 'youtube-caption')
 * @returns {Promise<string>} Simplified text with vocabulary
 */
export async function simplifyText(level, text, contentType = 'text') {
  const simplifyLogger = logger.createTryCatchLogger('Text Simplification');
  
  return await simplifyLogger.tryAsync(async () => {
    logger.info('Starting text simplification', { 
      level, 
      contentType, 
      textLength: text.length 
    });
    
    // Check if Prompt API is available
    if (!self.ai || !self.ai.languageModel) {
      const errorMsg = 'Chrome Prompt API is not available. Please enable it in chrome://flags';
      logger.warn('Prompt API not available, using fallback', { reason: errorMsg });
      return getFallbackSimplification(level, text);
    }

    logger.debug('Creating language model session');
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
    
    logger.debug('Sending prompt to AI model', { promptLength: prompt.length });

    // Generate response
    const startTime = Date.now();
    const result = await session.prompt(prompt);
    const processingTime = Date.now() - startTime;
    
    logger.info('AI response received', { 
      processingTime, 
      responseLength: result.length 
    });

    // Clean up session
    session.destroy();
    logger.debug('Language model session destroyed');

    return result;

  }, 'Text simplification operation failed');
}

/**
 * Generate quiz questions using Chrome Prompt API
 * @param {string} text - Text to generate quiz from
 * @param {string} level - CEFR level for difficulty adjustment
 * @returns {Promise<string>} Quiz questions with answers
 */
export async function generateQuiz(text, level = 'B1') {
  const quizLogger = logger.createTryCatchLogger('Quiz Generation');
  
  return await quizLogger.tryAsync(async () => {
    logger.info('Starting quiz generation', { 
      level, 
      textLength: text.length 
    });
    
    if (!self.ai || !self.ai.languageModel) {
      const errorMsg = 'Chrome Prompt API is not available. Please enable it in chrome://flags';
      logger.warn('Prompt API not available for quiz, using fallback', { reason: errorMsg });
      return getFallbackQuiz(text);
    }

    logger.debug('Creating quiz generation session');
    const session = await self.ai.languageModel.create({
      systemPrompt: 'You are a helpful language learning assistant that creates comprehension exercises.',
      temperature: 0.8,
      topK: 40
    });

    const prompt = buildQuizPrompt(text, level);
    logger.debug('Sending quiz prompt to AI model', { promptLength: prompt.length });
    
    const startTime = Date.now();
    const result = await session.prompt(prompt);
    const processingTime = Date.now() - startTime;
    
    logger.info('Quiz generation completed', { 
      processingTime, 
      resultLength: result.length 
    });

    session.destroy();
    logger.debug('Quiz generation session destroyed');
    return result;

  }, 'Quiz generation operation failed');
}

/**
 * Translate text using Chrome Translator API or Prompt API
 * @param {string} targetLang - Target language name
 * @param {string} text - Text to translate
 * @returns {Promise<string>} Translated text
 */
export async function translateText(targetLang, text) {
  const translateLogger = logger.createTryCatchLogger('Translation');
  
  return await translateLogger.tryAsync(async () => {
    logger.info('Starting translation', { 
      targetLang, 
      textLength: text.length 
    });
    
    // Try Chrome Translator API first
    if (self.translation && self.translation.canTranslate) {
      logger.debug('Checking Chrome Translator API availability');
      
      const canTranslate = await self.translation.canTranslate({
        sourceLanguage: 'en',
        targetLanguage: targetLang.toLowerCase()
      });
      
      logger.debug('Translator API check result', { canTranslate });

      if (canTranslate === 'readily') {
        logger.debug('Using Chrome Translator API');
        const translator = await self.translation.createTranslator({
          sourceLanguage: 'en',
          targetLanguage: targetLang.toLowerCase()
        });

        const startTime = Date.now();
        const result = await translator.translate(text);
        const processingTime = Date.now() - startTime;
        
        logger.info('Chrome Translator API completed', { 
          processingTime, 
          resultLength: result.length 
        });
        
        return result;
      }
    }

    // Fallback to Prompt API
    if (self.ai && self.ai.languageModel) {
      logger.debug('Falling back to Prompt API for translation');
      
      const session = await self.ai.languageModel.create({
        systemPrompt: 'You are a helpful translation assistant.',
        temperature: 0.5
      });

      const prompt = buildTranslationPrompt(targetLang, text);
      logger.debug('Sending translation prompt', { promptLength: prompt.length });
      
      const startTime = Date.now();
      const result = await session.prompt(prompt);
      const processingTime = Date.now() - startTime;
      
      logger.info('Prompt API translation completed', { 
        processingTime, 
        resultLength: result.length 
      });

      session.destroy();
      logger.debug('Translation session destroyed');
      return result;
    }

    logger.warn('No translation API available, using fallback');
    return getFallbackTranslation(targetLang, text);

  }, 'Translation operation failed');
}

/**
 * Summarize text using Chrome Summarizer API or Prompt API
 * @param {string} level - CEFR level
 * @param {string} text - Text to summarize
 * @param {number} maxSentences - Maximum sentences in summary
 * @returns {Promise<string>} Summarized text
 */
export async function summarizeText(level, text, maxSentences = 5) {
  const summarizeLogger = logger.createTryCatchLogger('Summarization');
  
  return await summarizeLogger.tryAsync(async () => {
    logger.info('Starting text summarization', { 
      level, 
      maxSentences, 
      textLength: text.length 
    });
    
    // Try Chrome Summarizer API first
    if (self.ai && self.ai.summarizer) {
      logger.debug('Checking Chrome Summarizer API');
      
      const canSummarize = await self.ai.summarizer.capabilities();
      logger.debug('Summarizer capabilities', canSummarize);
      
      if (canSummarize.available === 'readily') {
        logger.debug('Using Chrome Summarizer API');
        
        const summarizer = await self.ai.summarizer.create({
          type: 'tl;dr',
          format: 'plain-text',
          length: 'short'
        });

        const startTime = Date.now();
        const result = await summarizer.summarize(text);
        const processingTime = Date.now() - startTime;
        
        logger.info('Chrome Summarizer API completed', { 
          processingTime, 
          resultLength: result.length 
        });
        
        return result;
      }
    }

    // Fallback to Prompt API
    if (self.ai && self.ai.languageModel) {
      logger.debug('Falling back to Prompt API for summarization');
      
      const session = await self.ai.languageModel.create({
        systemPrompt: 'You are a helpful assistant that creates clear summaries.',
        temperature: 0.6
      });

      const prompt = buildSummaryPrompt(level, text, maxSentences);
      logger.debug('Sending summarization prompt', { promptLength: prompt.length });
      
      const startTime = Date.now();
      const result = await session.prompt(prompt);
      const processingTime = Date.now() - startTime;
      
      logger.info('Prompt API summarization completed', { 
        processingTime, 
        resultLength: result.length 
      });

      session.destroy();
      logger.debug('Summarization session destroyed');
      return result;
    }

    throw new Error('No summarization API available');

  }, 'Summarization operation failed');
}

// Fallback functions for development/testing

function getFallbackSimplification(level, text) {
  logger.info('Using fallback simplification', { level, textLength: text.length });
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
  logger.info('Using fallback quiz generation', { textLength: text.length });
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
  logger.info('Using fallback translation', { targetLang, textLength: text.length });
  return `[FALLBACK MODE - Chrome AI not available]

Translation to ${targetLang}:

${text}

Note: Enable Chrome AI APIs in chrome://flags to use real translation.`;
}

