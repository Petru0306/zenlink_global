/**
 * Triage logic for guided dental triage conversation flow
 */

import type { TriageContext } from './aiStorage';

export type TriageState = 'intake' | 'clarifying' | 'conclusion';

const RED_FLAG_KEYWORDS = [
  'febră', 'fever', 'temperatură',
  'umflătură', 'swelling', 'umflat',
  'respirație', 'breathing', 'respir',
  'înghițire', 'swallowing', 'nu pot înghiți',
  'sângerare', 'bleeding', 'sânge',
  'traumatism', 'trauma', 'lovit', 'accident',
  'durere severă', 'severe pain', 'durere intensă',
  'pus', 'puroi', 'infecție', 'infection'
];

/**
 * Check if user message contains red flags (urgent symptoms)
 */
export function hasRedFlags(text: string): boolean {
  const lower = text.toLowerCase();
  return RED_FLAG_KEYWORDS.some(keyword => lower.includes(keyword.toLowerCase()));
}

/**
 * Estimate how many questions were answered in the user message
 */
export function estimateAnswersCount(userMessage: string, lastQuestions: string[]): number {
  if (lastQuestions.length === 0) return 0;
  
  const lower = userMessage.toLowerCase();
  let answered = 0;
  
  // Simple heuristic: check if message is substantial and contains question-related keywords
  const hasSubstance = userMessage.trim().length > 20;
  const questionKeywords = ['da', 'nu', 'nu știu', 'ușor', 'moderat', 'sever', 'durează', 'acum', 'zi', 'săptămână'];
  const hasKeywords = questionKeywords.some(kw => lower.includes(kw));
  
  if (hasSubstance && (hasKeywords || userMessage.length > 50)) {
    // Estimate based on message length and structure
    const sentences = userMessage.split(/[.!?]+/).filter(s => s.trim().length > 5);
    answered = Math.min(sentences.length, lastQuestions.length);
  }
  
  return answered;
}

/**
 * Determine next triage state based on current state and conversation
 */
export function determineNextTriageState(
  current: TriageContext | undefined,
  userMessage: string,
  messageCount: number
): TriageState {
  // If no triage context, start with intake
  if (!current) {
    return 'intake';
  }
  
  // Check for red flags - skip to conclusion with urgent advice
  if (hasRedFlags(userMessage)) {
    return 'conclusion';
  }
  
  // If already in conclusion, stay there
  if (current.state === 'conclusion') {
    return 'conclusion';
  }
  
  // If in intake, move to clarifying after first user message
  if (current.state === 'intake' && messageCount >= 2) {
    return 'clarifying';
  }
  
  // If in clarifying, check if we should conclude
  if (current.state === 'clarifying') {
    const answered = estimateAnswersCount(userMessage, current.lastQuestions);
    const hasEnoughAnswers = answered >= 3 || userMessage.length > 150;
    const maxRounds = 10; // Increased to 10 questions
    
    if (hasEnoughAnswers || current.round >= maxRounds) {
      return 'conclusion';
    }
    
    return 'clarifying'; // Continue asking
  }
  
  return current.state;
}

/**
 * Extract questions from assistant message (for tracking)
 */
export function extractQuestions(text: string): string[] {
  const questions: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Match numbered questions: "1. ...?" or "- ...?"
    const numberedMatch = line.match(/^\s*[0-9]+[.)]\s+(.+[?])/);
    if (numberedMatch) {
      questions.push(numberedMatch[1].trim());
      continue;
    }
    
    // Match bullet questions: "- ...?" or "• ...?"
    const bulletMatch = line.match(/^\s*[-•]\s+(.+[?])/);
    if (bulletMatch) {
      questions.push(bulletMatch[1].trim());
    }
  }
  
  return questions;
}

/**
 * Check if message is in conclusion format (has probabilities or "Rezumat")
 */
export function isConclusionMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('rezumat') ||
    lower.includes('probabilitate') ||
    lower.includes('cel mai probabil') ||
    lower.includes('estimare') ||
    lower.includes('%')
  );
}

/**
 * Update triage context based on new message
 */
export function updateTriageContext(
  current: TriageContext | undefined,
  newState: TriageState,
  assistantMessage?: string
): TriageContext {
  const base: TriageContext = current || {
    state: 'intake',
    round: 0,
    answers: {},
    lastQuestions: [],
  };
  
  if (newState === 'clarifying' && base.state !== 'clarifying') {
    // Starting clarifying phase
    return {
      ...base,
      state: 'clarifying',
      round: 1,
      lastQuestions: assistantMessage ? extractQuestions(assistantMessage) : [],
    };
  }
  
  if (newState === 'clarifying' && base.state === 'clarifying') {
    // Continuing clarifying - increment round
    return {
      ...base,
      round: base.round + 1,
      lastQuestions: assistantMessage ? extractQuestions(assistantMessage) : base.lastQuestions,
    };
  }
  
  if (newState === 'conclusion') {
    return {
      ...base,
      state: 'conclusion',
      round: base.round,
    };
  }
  
  return {
    ...base,
    state: newState,
  };
}
