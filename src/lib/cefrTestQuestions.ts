
import type { CEFRTestQuestion, CEFRLevel } from '../types'

// CEFR Level Test Question Database
// Each level contains questions designed to distinguish between adjacent levels

export const CEFR_TEST_QUESTIONS: Record<CEFRLevel, CEFRTestQuestion[]> = {
  // A1 Level Questions (Beginner)
  A1: [
    {
      id: 'a1-vocab-1',
      level: 'A1',
      category: 'vocabulary',
      question: 'What is the opposite of "big"?',
      options: ['small', 'large', 'huge', 'wide'],
      correctAnswer: 0,
      explanation: 'Small is the opposite of big.',
      difficulty: 3
    },
    {
      id: 'a1-vocab-2',
      level: 'A1',
      category: 'vocabulary',
      question: 'What do you use to eat soup?',
      options: ['fork', 'knife', 'spoon', 'plate'],
      correctAnswer: 2,
      explanation: 'A spoon is used to eat soup.',
      difficulty: 2
    },
    {
      id: 'a1-vocab-3',
      level: 'A1',
      category: 'vocabulary',
      question: 'Which is a color?',
      options: ['happy', 'red', 'fast', 'cold'],
      correctAnswer: 1,
      explanation: 'Red is a color.',
      difficulty: 1
    },
    {
      id: 'a1-vocab-4',
      level: 'A1',
      category: 'vocabulary',
      question: 'What do you wear on your feet?',
      options: ['hat', 'shoes', 'shirt', 'gloves'],
      correctAnswer: 1,
      explanation: 'Shoes are worn on feet.',
      difficulty: 2
    },
    {
      id: 'a1-grammar-1',
      level: 'A1',
      category: 'grammar',
      question: 'Choose the correct sentence:',
      options: ['I am happy', 'I be happy', 'I is happy', 'I are happy'],
      correctAnswer: 0,
      explanation: 'Use "am" with "I".',
      difficulty: 2
    },
    {
      id: 'a1-grammar-2',
      level: 'A1',
      category: 'grammar',
      question: 'Complete: "She _____ a student."',
      options: ['am', 'is', 'are', 'be'],
      correctAnswer: 1,
      explanation: 'Use "is" with "she".',
      difficulty: 2
    },
    {
      id: 'a1-grammar-3',
      level: 'A1',
      category: 'grammar',
      question: 'Which is correct?',
      options: ['I have two book', 'I have two books', 'I has two books', 'I have two bookes'],
      correctAnswer: 1,
      explanation: 'Plural of "book" is "books".',
      difficulty: 3
    },
    {
      id: 'a1-grammar-4',
      level: 'A1',
      category: 'grammar',
      question: 'Choose the correct: "This is _____ apple."',
      options: ['a', 'an', 'the', 'some'],
      correctAnswer: 1,
      explanation: 'Use "an" before words starting with vowel sounds.',
      difficulty: 3
    },
    {
      id: 'a1-reading-1',
      level: 'A1',
      category: 'reading',
      question: 'Read: "The cat is on the table." Where is the cat?',
      options: ['under the table', 'on the table', 'near the table', 'behind the table'],
      correctAnswer: 1,
      explanation: 'The text says "on the table".',
      difficulty: 1
    },
    {
      id: 'a1-reading-2',
      level: 'A1',
      category: 'reading',
      question: 'Read: "My name is John. I am 25 years old." How old is John?',
      options: ['24', '25', '26', '27'],
      correctAnswer: 1,
      explanation: 'The text says John is 25 years old.',
      difficulty: 1
    },
    {
      id: 'a1-reading-3',
      level: 'A1',
      category: 'reading',
      question: 'Read: "The shop opens at 9 AM and closes at 6 PM." When does the shop close?',
      options: ['8 PM', '7 PM', '6 PM', '5 PM'],
      correctAnswer: 2,
      explanation: 'The text says the shop closes at 6 PM.',
      difficulty: 2
    }
  ],

  // A2 Level Questions (Elementary)
  A2: [
    {
      id: 'a2-vocab-1',
      level: 'A2',
      category: 'vocabulary',
      question: 'Which word means "to travel"?',
      options: ['journey', 'stay', 'remain', 'wait'],
      correctAnswer: 0,
      explanation: 'Journey means to travel from one place to another.',
      difficulty: 4
    },
    {
      id: 'a2-vocab-2',
      level: 'A2',
      category: 'vocabulary',
      question: 'What does "purchase" mean?',
      options: ['sell', 'buy', 'find', 'lose'],
      correctAnswer: 1,
      explanation: 'Purchase means to buy something.',
      difficulty: 4
    },
    {
      id: 'a2-vocab-3',
      level: 'A2',
      category: 'vocabulary',
      question: 'Which word describes weather?',
      options: ['furniture', 'cloudy', 'birthday', 'kitchen'],
      correctAnswer: 1,
      explanation: 'Cloudy is a weather condition.',
      difficulty: 3
    },
    {
      id: 'a2-vocab-4',
      level: 'A2',
      category: 'vocabulary',
      question: 'What does "repair" mean?',
      options: ['break', 'fix', 'sell', 'hide'],
      correctAnswer: 1,
      explanation: 'Repair means to fix something that is broken.',
      difficulty: 4
    },
    {
      id: 'a2-grammar-1',
      level: 'A2',
      category: 'grammar',
      question: 'Complete: "I _____ to the store yesterday."',
      options: ['go', 'went', 'going', 'will go'],
      correctAnswer: 1,
      explanation: 'Use past tense "went" for yesterday.',
      difficulty: 5
    },
    {
      id: 'a2-grammar-2',
      level: 'A2',
      category: 'grammar',
      question: 'Choose the correct: "She _____ her homework every day."',
      options: ['do', 'does', 'did', 'doing'],
      correctAnswer: 1,
      explanation: 'Use "does" for third person singular in present tense.',
      difficulty: 4
    },
    {
      id: 'a2-grammar-3',
      level: 'A2',
      category: 'grammar',
      question: 'Complete: "I _____ TV when you called."',
      options: ['watch', 'watched', 'was watching', 'will watch'],
      correctAnswer: 2,
      explanation: 'Past continuous "was watching" shows an ongoing action interrupted by another action.',
      difficulty: 5
    },
    {
      id: 'a2-grammar-4',
      level: 'A2',
      category: 'grammar',
      question: 'Which is correct?',
      options: ['How much apples?', 'How many apples?', 'How many apple?', 'How much apple?'],
      correctAnswer: 1,
      explanation: 'Use "many" with countable nouns like apples.',
      difficulty: 4
    },
    {
      id: 'a2-reading-1',
      level: 'A2',
      category: 'reading',
      question: 'Read: "Maria usually eats breakfast at 8 AM, but today she ate at 7 AM because she had an early meeting." Why did Maria eat breakfast early?',
      options: ['She was hungry', 'She had an early meeting', 'She forgot', 'She was late'],
      correctAnswer: 1,
      explanation: 'The text states she had an early meeting.',
      difficulty: 4
    },
    {
      id: 'a2-reading-2',
      level: 'A2',
      category: 'reading',
      question: 'Read: "The concert starts at 7:30 PM. Please arrive 30 minutes early for parking." What time should you arrive?',
      options: ['7:00 PM', '7:30 PM', '8:00 PM', '6:30 PM'],
      correctAnswer: 0,
      explanation: '30 minutes before 7:30 PM is 7:00 PM.',
      difficulty: 4
    },
    {
      id: 'a2-reading-3',
      level: 'A2',
      category: 'reading',
      question: 'Read: "Tom works as a teacher. He enjoys helping students learn new things." What is Tom\'s job?',
      options: ['student', 'teacher', 'doctor', 'worker'],
      correctAnswer: 1,
      explanation: 'The text says Tom works as a teacher.',
      difficulty: 3
    }
  ],

  // B1 Level Questions (Intermediate)
  B1: [
    {
      id: 'b1-vocab-1',
      level: 'B1',
      category: 'vocabulary',
      question: 'What does "substantial" mean?',
      options: ['small', 'considerable', 'weak', 'unclear'],
      correctAnswer: 1,
      explanation: 'Substantial means considerable or large in amount.',
      difficulty: 6
    },
    {
      id: 'b1-vocab-2',
      level: 'B1',
      category: 'vocabulary',
      question: 'What does "implement" mean?',
      options: ['destroy', 'ignore', 'put into effect', 'discuss'],
      correctAnswer: 2,
      explanation: 'Implement means to put a plan or decision into effect.',
      difficulty: 6
    },
    {
      id: 'b1-vocab-3',
      level: 'B1',
      category: 'vocabulary',
      question: 'Which word means "to make something better"?',
      options: ['deteriorate', 'enhance', 'maintain', 'eliminate'],
      correctAnswer: 1,
      explanation: 'Enhance means to improve or make something better.',
      difficulty: 6
    },
    {
      id: 'b1-vocab-4',
      level: 'B1',
      category: 'vocabulary',
      question: 'What does "optimistic" mean?',
      options: ['hopeful', 'angry', 'confused', 'tired'],
      correctAnswer: 0,
      explanation: 'Optimistic means hopeful and confident about the future.',
      difficulty: 5
    },
    {
      id: 'b1-grammar-1',
      level: 'B1',
      category: 'grammar',
      question: 'Choose the correct form: "If I _____ more time, I would exercise regularly."',
      options: ['have', 'had', 'will have', 'having'],
      correctAnswer: 1,
      explanation: 'Second conditional uses "had" in the if clause.',
      difficulty: 7
    },
    {
      id: 'b1-grammar-2',
      level: 'B1',
      category: 'grammar',
      question: 'Complete: "The report _____ by the team yesterday."',
      options: ['completed', 'was completed', 'has completed', 'completes'],
      correctAnswer: 1,
      explanation: 'Use passive voice "was completed" for actions done to the subject.',
      difficulty: 7
    },
    {
      id: 'b1-grammar-3',
      level: 'B1',
      category: 'grammar',
      question: 'Choose the correct: "I _____ English for five years."',
      options: ['study', 'studied', 'have been studying', 'will study'],
      correctAnswer: 2,
      explanation: 'Present perfect continuous shows action continuing from past to present.',
      difficulty: 7
    },
    {
      id: 'b1-grammar-4',
      level: 'B1',
      category: 'grammar',
      question: 'Which is correct?',
      options: ['She suggested to go home', 'She suggested going home', 'She suggested go home', 'She suggested went home'],
      correctAnswer: 1,
      explanation: 'After "suggest", use gerund (-ing form).',
      difficulty: 6
    },
    {
      id: 'b1-reading-1',
      level: 'B1',
      category: 'reading',
      question: 'Read: "Despite the challenges, the team managed to complete the project on time, demonstrating remarkable resilience." What quality did the team show?',
      options: ['speed', 'resilience', 'confusion', 'weakness'],
      correctAnswer: 1,
      explanation: 'The text explicitly mentions "remarkable resilience".',
      difficulty: 6
    },
    {
      id: 'b1-reading-2',
      level: 'B1',
      category: 'reading',
      question: 'Read: "The new policy aims to reduce environmental impact while maintaining economic growth. However, critics argue it may not be sufficient." What do critics think?',
      options: ['The policy is perfect', 'The policy may not be enough', 'The policy is too expensive', 'The policy will fail completely'],
      correctAnswer: 1,
      explanation: 'Critics argue the policy "may not be sufficient" means it might not be enough.',
      difficulty: 6
    },
    {
      id: 'b1-reading-3',
      level: 'B1',
      category: 'reading',
      question: 'Read: "Although the weather forecast predicted rain, the outdoor event proceeded as planned because organizers had prepared adequate shelter." Why did the event continue?',
      options: ['It did not rain', 'They had shelter ready', 'They cancelled it', 'The forecast was wrong'],
      correctAnswer: 1,
      explanation: 'The event continued because organizers had prepared adequate shelter.',
      difficulty: 6
    }
  ],

  // B2 Level Questions (Upper Intermediate)
  B2: [
    {
      id: 'b2-vocab-1',
      level: 'B2',
      category: 'vocabulary',
      question: 'What does "meticulous" mean?',
      options: ['careless', 'extremely careful', 'fast', 'confused'],
      correctAnswer: 1,
      explanation: 'Meticulous means showing great attention to detail; very careful.',
      difficulty: 8
    },
    {
      id: 'b2-vocab-2',
      level: 'B2',
      category: 'vocabulary',
      question: 'What does "pragmatic" mean?',
      options: ['idealistic', 'practical and realistic', 'emotional', 'theoretical'],
      correctAnswer: 1,
      explanation: 'Pragmatic means dealing with things in a practical and realistic way.',
      difficulty: 8
    },
    {
      id: 'b2-vocab-3',
      level: 'B2',
      category: 'vocabulary',
      question: 'Which word means "to make less severe"?',
      options: ['exacerbate', 'mitigate', 'intensify', 'amplify'],
      correctAnswer: 1,
      explanation: 'Mitigate means to make something less severe or serious.',
      difficulty: 8
    },
    {
      id: 'b2-vocab-4',
      level: 'B2',
      category: 'vocabulary',
      question: 'What does "ambiguous" mean?',
      options: ['clear', 'open to multiple interpretations', 'simple', 'obvious'],
      correctAnswer: 1,
      explanation: 'Ambiguous means having more than one possible meaning; unclear.',
      difficulty: 7
    },
    {
      id: 'b2-grammar-1',
      level: 'B2',
      category: 'grammar',
      question: 'Choose the correct form: "_____ the weather been better, we would have gone hiking."',
      options: ['If', 'Had', 'Were', 'Should'],
      correctAnswer: 1,
      explanation: 'Third conditional with inversion: "Had the weather been..."',
      difficulty: 8
    },
    {
      id: 'b2-grammar-2',
      level: 'B2',
      category: 'grammar',
      question: 'Complete: "I wish I _____ more attention during the lecture."',
      options: ['paid', 'had paid', 'pay', 'would pay'],
      correctAnswer: 1,
      explanation: 'Use "had paid" to express regret about a past action.',
      difficulty: 8
    },
    {
      id: 'b2-grammar-3',
      level: 'B2',
      category: 'grammar',
      question: 'Choose the correct: "The meeting _____ for two hours when he arrived."',
      options: ['was going on', 'had been going on', 'went on', 'has been going on'],
      correctAnswer: 1,
      explanation: 'Past perfect continuous shows action that started before another past action.',
      difficulty: 8
    },
    {
      id: 'b2-grammar-4',
      level: 'B2',
      category: 'grammar',
      question: 'Which is correct?',
      options: ['Despite of the rain', 'Despite the rain', 'Despite from the rain', 'Despite to the rain'],
      correctAnswer: 1,
      explanation: 'Despite is followed directly by a noun, without "of".',
      difficulty: 7
    },
    {
      id: 'b2-reading-1',
      level: 'B2',
      category: 'reading',
      question: 'Read: "The proliferation of digital technologies has fundamentally altered the landscape of modern communication, creating both unprecedented opportunities and significant challenges." What is the main idea?',
      options: ['Technology is bad', 'Digital tech has changed communication with mixed results', 'Communication is impossible', 'Only opportunities exist'],
      correctAnswer: 1,
      explanation: 'The text discusses how technology has changed communication, bringing both opportunities and challenges.',
      difficulty: 7
    },
    {
      id: 'b2-reading-2',
      level: 'B2',
      category: 'reading',
      question: 'Read: "The research indicates a correlation between sleep quality and cognitive performance, though causation remains to be established." What does this suggest?',
      options: ['Sleep causes better thinking', 'There is a relationship but not proven cause', 'Sleep has no effect on thinking', 'The research is wrong'],
      correctAnswer: 1,
      explanation: 'Correlation shows relationship, but causation (what causes what) is not yet proven.',
      difficulty: 8
    },
    {
      id: 'b2-reading-3',
      level: 'B2',
      category: 'reading',
      question: 'Read: "The novel\'s protagonist undergoes a profound transformation, evolving from a naive idealist to a cynical realist through a series of disillusioning experiences." How does the character change?',
      options: ['Becomes more hopeful', 'Becomes more realistic and skeptical', 'Stays the same', 'Becomes more confused'],
      correctAnswer: 1,
      explanation: 'The character evolves from naive idealist to cynical realist, becoming more skeptical.',
      difficulty: 8
    }
  ],

  // C1 Level Questions (Advanced)
  C1: [
    {
      id: 'c1-vocab-1',
      level: 'C1',
      category: 'vocabulary',
      question: 'What does "ubiquitous" mean?',
      options: ['rare', 'present everywhere', 'ancient', 'expensive'],
      correctAnswer: 1,
      explanation: 'Ubiquitous means present, appearing, or found everywhere.',
      difficulty: 9
    },
    {
      id: 'c1-vocab-2',
      level: 'C1',
      category: 'vocabulary',
      question: 'What does "perfunctory" mean?',
      options: ['thorough', 'done without care or interest', 'perfect', 'complicated'],
      correctAnswer: 1,
      explanation: 'Perfunctory means carried out with minimal effort or care.',
      difficulty: 9
    },
    {
      id: 'c1-vocab-3',
      level: 'C1',
      category: 'vocabulary',
      question: 'Which word means "to weaken or undermine gradually"?',
      options: ['strengthen', 'erode', 'build', 'support'],
      correctAnswer: 1,
      explanation: 'Erode means to gradually weaken or wear away.',
      difficulty: 9
    },
    {
      id: 'c1-vocab-4',
      level: 'C1',
      category: 'vocabulary',
      question: 'What does "perspicacious" mean?',
      options: ['confused', 'having keen insight', 'lazy', 'obvious'],
      correctAnswer: 1,
      explanation: 'Perspicacious means having acute mental perception and understanding.',
      difficulty: 10
    },
    {
      id: 'c1-grammar-1',
      level: 'C1',
      category: 'grammar',
      question: 'Choose the most appropriate: "_____ the CEO\'s reluctance, the board proceeded with the merger."',
      options: ['Despite', 'Because of', 'Due to', 'Notwithstanding'],
      correctAnswer: 3,
      explanation: 'Notwithstanding is the most formal and sophisticated choice for advanced English.',
      difficulty: 9
    },
    {
      id: 'c1-grammar-2',
      level: 'C1',
      category: 'grammar',
      question: 'Complete: "The committee recommended that the proposal _____ immediately."',
      options: ['is implemented', 'be implemented', 'was implemented', 'will be implemented'],
      correctAnswer: 1,
      explanation: 'Subjunctive mood after "recommend that" requires base form "be implemented".',
      difficulty: 9
    },
    {
      id: 'c1-grammar-3',
      level: 'C1',
      category: 'grammar',
      question: 'Choose the correct: "_____ have I seen such dedication to detail."',
      options: ['Never', 'Rarely', 'Seldom', 'Scarcely'],
      correctAnswer: 1,
      explanation: 'In negative inversion, "rarely" requires auxiliary "have" to follow.',
      difficulty: 10
    },
    {
      id: 'c1-grammar-4',
      level: 'C1',
      category: 'grammar',
      question: 'Which is most sophisticated?',
      options: ['Because it was raining', 'On account of the rain', 'Due to the inclement weather', 'Since it was wet'],
      correctAnswer: 2,
      explanation: '"Inclement weather" is the most formal and sophisticated expression.',
      difficulty: 9
    },
    {
      id: 'c1-reading-1',
      level: 'C1',
      category: 'reading',
      question: 'Read: "The ostensibly straightforward policy implementation was fraught with nuanced complexities that belied its apparent simplicity, requiring stakeholders to navigate an intricate web of competing interests." What is suggested about the policy?',
      options: ['It was simple to implement', 'It appeared simple but was actually complex', 'It failed completely', 'No one understood it'],
      correctAnswer: 1,
      explanation: 'The text indicates the policy seemed simple but was actually complex with many nuances.',
      difficulty: 10
    },
    {
      id: 'c1-reading-2',
      level: 'C1',
      category: 'reading',
      question: 'Read: "The author\'s critique of contemporary society is both trenchant and prescient, offering insights that challenge conventional wisdom while anticipating future societal shifts." What characterizes the author\'s critique?',
      options: ['Mild and predictable', 'Sharp and forward-looking', 'Confusing and outdated', 'Simple and obvious'],
      correctAnswer: 1,
      explanation: 'Trenchant means sharp/incisive, and prescient means forward-looking/prophetic.',
      difficulty: 10
    },
    {
      id: 'c1-reading-3',
      level: 'C1',
      category: 'reading',
      question: 'Read: "The paradigmatic shift in economic theory has rendered erstwhile models obsolete, necessitating a comprehensive recalibration of analytical frameworks." What does this suggest?',
      options: ['Old models still work', 'Economic theory is unchanged', 'Fundamental change requires new approaches', 'Nothing needs to change'],
      correctAnswer: 2,
      explanation: 'A paradigmatic shift making models obsolete necessitates (requires) new analytical frameworks.',
      difficulty: 10
    }
  ]
}

// Function to get questions by level
export function getQuestionsByLevel(level: CEFRLevel): CEFRTestQuestion[] {
  return CEFR_TEST_QUESTIONS[level] || []
}

// Function to get a random question by level
export function getRandomQuestionByLevel(level: CEFRLevel): CEFRTestQuestion | null {
  const questions = getQuestionsByLevel(level)
  if (questions.length === 0) return null
  
  const randomIndex = Math.floor(Math.random() * questions.length)
  return questions[randomIndex]
}

// Function to get questions of specific category
export function getQuestionsByCategory(level: CEFRLevel, category: 'vocabulary' | 'grammar' | 'reading'): CEFRTestQuestion[] {
  const questions = getQuestionsByLevel(level)
  return questions.filter(q => q.category === category)
}

// Function to validate if a level is supported
export function isSupportedLevel(level: string): level is CEFRLevel {
  return ['A1', 'A2', 'B1', 'B2', 'C1'].includes(level)
}

// Get all available levels
export function getAvailableLevels(): CEFRLevel[] {
  return ['A1', 'A2', 'B1', 'B2', 'C1']
}