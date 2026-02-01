/**
 * Client-side AI conversation storage (localStorage).
 * Key: zenlink_ai_conversations_v1
 */

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string; // ISO
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
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

/** Generate a short title from the first user message (e.g. first 4–6 words) */
export function renameTitleFromFirstUserMessage(firstUserMessage: string): string {
  const trimmed = firstUserMessage.trim();
  if (!trimmed) return 'New chat';
  const words = trimmed.split(/\s+/).filter(Boolean);
  const take = Math.min(6, Math.max(4, Math.ceil(words.length / 2)));
  const title = words.slice(0, take).join(' ');
  return title.length > 60 ? title.slice(0, 57) + '...' : title || 'New chat';
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
