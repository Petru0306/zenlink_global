/**
 * Client-side AI conversation storage (localStorage).
 * Key: zenlink_ai_conversations_v1
 */

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string; // ISO
  meta?: {
    showCta?: boolean;
    triageState?: 'intake' | 'clarifying' | 'conclusion';
    status?: 'loading' | 'ready'; // For preventing flash of unformatted text
    parsedTurn?: any; // Cached parsed AiTurn to avoid re-parsing
  };
};

export type TriageContext = {
  state: 'intake' | 'clarifying' | 'conclusion';
  round: number;
  answers: Record<string, string>;
  lastQuestions: string[];
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  triage?: TriageContext;
};

const STORAGE_KEY = 'zenlink_ai_conversations_v1';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Load all conversations from localStorage */
export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c: unknown): c is Conversation =>
        typeof c === 'object' &&
        c !== null &&
        typeof (c as Conversation).id === 'string' &&
        typeof (c as Conversation).title === 'string' &&
        Array.isArray((c as Conversation).messages)
    );
  } catch {
    return [];
  }
}

/** Save all conversations to localStorage */
export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // ignore quota / parse errors
  }
}

/** Create a new empty conversation */
export function createConversation(): Conversation {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

/** Add a message to a conversation and update updatedAt + optional title from first user message */
export function addMessage(
  conversation: Conversation,
  role: 'user' | 'assistant',
  content: string
): Conversation {
  const now = new Date().toISOString();
  const message: Message = {
    id: generateId(),
    role,
    content,
    createdAt: now,
  };
  const messages = [...conversation.messages, message];
  let title = conversation.title;
  if (conversation.title === 'New chat' && role === 'user') {
    title = renameTitleFromFirstUserMessage(content);
  }
  return {
    ...conversation,
    title,
    updatedAt: now,
    messages,
  };
}

/** Update the last assistant message in a conversation (for streaming) */
export function updateLastAssistantMessage(
  conversation: Conversation,
  content: string,
  meta?: Message['meta']
): Conversation {
  const now = new Date().toISOString();
  const messages = [...conversation.messages];
  const lastIndex = messages.length - 1;
  
  // Find last assistant message or create one if it doesn't exist
  if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
    // Update existing assistant message
    messages[lastIndex] = {
      ...messages[lastIndex],
      content,
      meta: meta || messages[lastIndex].meta,
    };
  } else {
    // Create new assistant message if last message is not assistant
    const message: Message = {
      id: generateId(),
      role: 'assistant',
      content,
      createdAt: now,
      meta,
    };
    messages.push(message);
  }
  
  return {
    ...conversation,
    updatedAt: now,
    messages,
  };
}

/** Generate a short title from the first user message (e.g. first 4–6 words) */
export function renameTitleFromFirstUserMessage(firstUserMessage: string): string {
  const trimmed = firstUserMessage.trim();
  if (!trimmed) return 'New chat';
  const words = trimmed.split(/\s+/).filter(Boolean);
  const take = Math.min(6, Math.max(4, Math.ceil(words.length / 2)));
  const title = words.slice(0, take).join(' ');
  return title.length > 60 ? title.slice(0, 57) + '...' : title || 'New chat';
}

/** Auto-title conversation from first user message (Doctronic-style) */
export function autoTitleConversation(firstUserMessage: string): string {
  const trimmed = firstUserMessage.trim();
  if (!trimmed) return 'New chat';
  
  // Extract key phrases (common dental issues)
  const lower = trimmed.toLowerCase();
  const patterns = [
    { pattern: /durere.*(dinte|măsea|gingie)/i, title: 'Durere dentară' },
    { pattern: /sensibilitate/i, title: 'Sensibilitate dentară' },
    { pattern: /umflătur/i, title: 'Umflătură' },
    { pattern: /sângerare/i, title: 'Sângerare' },
    { pattern: /febră/i, title: 'Febră' },
    { pattern: /carie/i, title: 'Carie' },
    { pattern: /extracție/i, title: 'Extracție' },
    { pattern: /implant/i, title: 'Implant' },
  ];
  
  for (const { pattern, title } of patterns) {
    if (pattern.test(trimmed)) {
      // Try to add location if mentioned
      if (lower.includes('stâng') || lower.includes('dreapt')) {
        return `${title} ${lower.includes('stâng') ? 'stânga' : 'dreapta'}`;
      }
      if (lower.includes('sus') || lower.includes('jos')) {
        return `${title} ${lower.includes('sus') ? 'sus' : 'jos'}`;
      }
      return title;
    }
  }
  
  // Fallback to first sentence or key words
  const firstSentence = trimmed.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 0 && firstSentence.length <= 50) {
    return firstSentence;
  }
  
  // Last resort: first 4-6 words
  return renameTitleFromFirstUserMessage(trimmed);
}

/** Update conversation in list (replace by id) and persist */
export function updateConversation(
  conversations: Conversation[],
  updated: Conversation
): Conversation[] {
  const next = conversations.map((c) => (c.id === updated.id ? updated : c));
  saveConversations(next);
  return next;
}

/** Add new conversation to list and persist */
export function appendConversation(
  conversations: Conversation[],
  conversation: Conversation
): Conversation[] {
  const next = [conversation, ...conversations];
  saveConversations(next);
  return next;
}

/** Remove conversation by id and persist */
export function deleteConversation(
  conversations: Conversation[],
  id: string
): Conversation[] {
  const next = conversations.filter((c) => c.id !== id);
  saveConversations(next);
  return next;
}
