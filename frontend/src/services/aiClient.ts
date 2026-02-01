/**
 * AI chat client: mock implementation now; swap for real GPT API later.
 * Stable interface: sendMessage(conversationId, messages) => Promise<string>
 */

import type { Message } from '../lib/aiStorage';

const TYPING_DELAY_MS_MIN = 600;
const TYPING_DELAY_MS_MAX = 900;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Mock dental/healthcare assistant reply: paraphrases question and gives structured answer with disclaimer */
function mockReply(userMessage: string): string {
  const lower = userMessage.trim().toLowerCase();
  let body = '';

  if (lower.includes('durere') || lower.includes('pain') || lower.includes('doare')) {
    body = `Înțeleg că te interesează aspecte legate de durere dentară.\n\n**Recomandări generale:**\n- Menține o igienă orală bună (periușă, ață dentară).\n- Evită alimente prea reci sau prea calde dacă simți sensibilitate.\n- Pentru dureri persistente, programează o consultație la dentist cât mai curând.\n\n`;
  } else if (lower.includes('alb') || lower.includes('whitening') || lower.includes('albit')) {
    body = `Întrebarea ta despre albitul dentar este foarte relevantă.\n\n**Informații generale:**\n- Albitul profesional se face la cabinet sau cu seturi acasă (sub supraveghere).\n- Rezultatele variază în funcție de tipul de colorație și de obiceiurile tale.\n- Evită cafeaua, vinul roșu și fumatul pentru a menține efectul mai mult timp.\n\n`;
  } else if (lower.includes('prevent') || lower.includes('îngrijire') || lower.includes('preven')) {
    body = `Prevenția este esențială pentru sănătatea dentară.\n\n**Sfaturi de prevenție:**\n- Periaj de 2 ori pe zi, minimum 2 minute.\n- Ață dentară zilnic.\n- Control la dentist la fiecare 6–12 luni.\n- Dietă săracă în zahăr și băuturi acidulate.\n\n`;
  } else {
    body = `Înțeleg întrebarea ta despre sănătatea dentară.\n\n**Informații generale:**\n- Igiena orală zilnică (periușă + ață) este baza prevenției.\n- Consultă întotdeauna un dentist pentru un diagnostic precis și plan de tratament.\n- ZenLink te poate ajuta să găsești medici și clinici potrivite.\n\n`;
  }

  return `${body}---\n*Acest răspuns nu constituie sfat medical; pentru diagnostic și tratament consultă un dentist.*`;
}

/**
 * Send user message and return assistant reply.
 * For now: mock response after 600–900ms.
 * Later: replace with real API call (OpenAI/ChatGPT); keep this signature.
 */
export async function sendMessage(
  _conversationId: string,
  messages: Message[]
): Promise<string> {
  // Simulate typing delay
  await delay(Math.floor(randomBetween(TYPING_DELAY_MS_MIN, TYPING_DELAY_MS_MAX)));

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const userText = lastUser?.content?.trim() || 'Ce sfaturi aveți pentru sănătatea dentară?';
  return mockReply(userText);
}
