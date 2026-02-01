/**
 * AI chat client: unified client wrapper for OpenAI GPT-5 nano.
 * All AI features use this single client to call the backend endpoint.
 */

import type { Message } from '../lib/aiStorage';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

/**
 * Convert frontend Message format to backend AiMessage format
 */
function toBackendMessages(messages: Message[]): Array<{ role: string; content: string }> {
  return messages
    .filter((m) => m && m.role && m.content)
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));
}

/**
 * Send chat messages with streaming support - updates callback as text arrives.
 * This provides a ChatGPT-like progressive typing effect.
 */
export async function sendMessageStreaming(
  _conversationId: string,
  messages: Message[],
  onChunk: (chunk: string) => void,
  triageState?: string
): Promise<string> {
  if (!messages || messages.length === 0) {
    throw new Error('Messages cannot be empty');
  }

  // Convert to backend format
  const backendMessages = toBackendMessages(messages);
  
  console.log('AI Client: Sending streaming request to', `${BACKEND_BASE_URL}/api/ai/chat/stream-simple`);

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/ai/chat/stream-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: backendMessages,
        triageState: triageState || undefined,
      }),
    });
    
    console.log('AI Client: Streaming response status', response.status, response.statusText);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text().catch(() => '');
      } catch (e) {
        errorText = '';
      }
      
      console.error('AI API streaming error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Prea multe cereri. Te rog încearcă din nou mai târziu.');
      }
      if (response.status === 401) {
        throw new Error('Eroare de autentificare. Verifică configurația API key.');
      }
      if (response.status === 404) {
        throw new Error('Modelul nu a fost găsit. Verifică numele modelului în configurație.');
      }
      if (response.status === 500) {
        throw new Error('Eroare internă a serverului. Te rog încearcă din nou.');
      }
      if (response.status === 0 || response.status === 503) {
        throw new Error('Backend-ul nu este disponibil. Verifică dacă serverul rulează pe http://localhost:8080');
      }
      throw new Error(errorText || `Eroare HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // Read stream progressively
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        onChunk(chunk);
      }
    } finally {
      reader.releaseLock();
    }

    return fullText;
  } catch (error: any) {
    const message = error?.message || 'Eroare necunoscută la comunicarea cu AI';
    console.error('AI client streaming error:', error);
    throw new Error(message);
  }
}

/**
 * Send chat messages to the unified AI endpoint and return assistant reply.
 * This is the single entry point for all AI features (preview widget, AI page, etc.)
 * @deprecated Use sendMessageStreaming for better UX
 */
export async function sendMessage(
  _conversationId: string,
  messages: Message[]
): Promise<string> {
  if (!messages || messages.length === 0) {
    throw new Error('Messages cannot be empty');
  }

  // Convert to backend format
  const backendMessages = toBackendMessages(messages);
  
  console.log('AI Client: Sending request to', `${BACKEND_BASE_URL}/api/ai/chat`);
  console.log('AI Client: Request body', { messages: backendMessages });

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: backendMessages,
      }),
    });
    
    console.log('AI Client: Response status', response.status, response.statusText);

    if (!response.ok) {

      let errorText = '';
      try {
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.error) {
          errorText = errorData.error;
        } else {
          errorText = await response.text().catch(() => '');
        }
      } catch (e) {
        errorText = await response.text().catch(() => '');
      }
      
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Prea multe cereri. Te rog încearcă din nou mai târziu.');
      }
      if (response.status === 401) {
        throw new Error('Eroare de autentificare. Verifică configurația API key.');
      }
      if (response.status === 404) {
        throw new Error('Modelul nu a fost găsit. Verifică numele modelului în configurație.');
      }
      if (response.status === 500) {
        throw new Error('Eroare internă a serverului. Te rog încearcă din nou.');
      }
      if (response.status === 0 || response.status === 503) {
        throw new Error('Backend-ul nu este disponibil. Verifică dacă serverul rulează pe http://localhost:8080');
      }
      throw new Error(errorText || `Eroare HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.text || 'No response from AI';
  } catch (error: any) {
    const message = error?.message || 'Eroare necunoscută la comunicarea cu AI';
    console.error('AI client error:', error);
    throw new Error(message);
  }
}
