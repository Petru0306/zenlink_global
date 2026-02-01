/**
 * Structured AI turn format for Doctronic-like triage experience
 */

export type AiTurn = {
  mode: 'question' | 'conclusion' | 'urgent';
  title: string;
  question?: string;
  rationale?: string; // optional 1 short line
  options?: { label: string; value: string; kind?: 'primary' | 'neutral' }[];
  allowFreeText?: boolean; // shows "Altceva…"
  freeTextPlaceholder?: string;
  progress?: { step: number; total: number }; // e.g. 2/5
  highlight?: { label: string; color: 'purple' | 'amber' | 'red' | 'green' }[];
  conclusion?: {
    summary: string; // 1-2 lines
    probabilities: { label: string; percent: number; note: string }[]; // 2-4 items
    nextSteps: { icon: string; title: string; text: string }[]; // 3-5 max
    redFlags: string[]; // 3-6 max
    cta: { label: string; href: string };
  };
  severity?: 'low' | 'medium' | 'high'; // severity meter
};

/**
 * Parse AI response text to extract JSON AiTurn
 */
export function parseAiTurn(text: string): AiTurn | null {
  try {
    // Try to find JSON in the response (might be wrapped in markdown code blocks)
    let jsonStr = text.trim();
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/^```json\s*/i, '');
    jsonStr = jsonStr.replace(/^```\s*/, '');
    jsonStr = jsonStr.replace(/\s*```$/g, '');
    
    // Try to extract JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate structure
    if (parsed.mode && parsed.title) {
      return parsed as AiTurn;
    }
  } catch (e) {
    console.warn('Failed to parse AiTurn JSON:', e);
  }
  
  return null;
}

/**
 * Check if text contains structured AiTurn JSON
 */
export function isStructuredResponse(text: string): boolean {
  return text.includes('"mode"') && (text.includes('"question"') || text.includes('"conclusion"'));
}
