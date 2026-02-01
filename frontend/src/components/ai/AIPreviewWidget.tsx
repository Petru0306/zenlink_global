import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowRight } from 'lucide-react';
import { sendMessage as sendAiMessage } from '../../services/aiClient';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../lib/aiStorage';

const MAX_MESSAGES = 4; // After this, redirect to full AI page
const EXAMPLE_MESSAGES: Message[] = [
  {
    id: 'ex1',
    role: 'assistant',
    content: 'Bună! Sunt asistentul AI ZenLink. Te pot ajuta cu întrebări despre sănătatea dentară, pregătirea pentru consultații și îngrijirea post-tratament. Cu ce te pot ajuta astăzi?',
  },
  {
    id: 'ex2',
    role: 'user',
    content: 'Ce cauzează sensibilitatea dentară?',
  },
  {
    id: 'ex3',
    role: 'assistant',
    content: 'Sensibilitatea dentară poate apărea din mai multe motive:\n\n• Eroziunea smalțului dentar\n• Retracția gingiilor\n• Caria dentară\n• Periuțarea prea agresivă\n• Consumul excesiv de alimente acide\n\nPentru un diagnostic precis, recomandăm o consultație la dentist.',
  },
];

const SUGGESTION_PROMPTS = [
  'Ce cauzează sensibilitatea dentară?',
  'Cât de des ar trebui să fac un control dentar?',
  'Ce să fac după o extracție dentară?',
];

type Props = {
  onContinueToFull?: () => void;
};

export function AIPreviewWidget({ onContinueToFull }: Props) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(EXAMPLE_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const listEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setMessageCount((prev) => prev + 1);
    setIsTyping(true);

    // Check if we've reached the limit
    if (messageCount + 1 >= MAX_MESSAGES) {
      setTimeout(() => {
        setIsTyping(false);
        const continueMessage: Message = {
          id: `msg-${Date.now()}-continue`,
          role: 'assistant',
          content: 'Ai atins limita de mesaje în preview. Continuă conversația în interfața completă AI Assistant pentru răspunsuri nelimitate!',
        };
        setMessages((prev) => [...prev, continueMessage]);
      }, 800);
      return;
    }

    try {
      // Call real AI service
      const reply = await sendAiMessage('preview', newMessages);
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Eroare la răspuns. Încearcă din nou sau continuă în interfața completă.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, isTyping, messageCount]);

  const handleSuggestionClick = useCallback(
    async (prompt: string) => {
      if (isTyping || messageCount >= MAX_MESSAGES) return;

      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: prompt,
      };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');
      setMessageCount((prev) => prev + 1);
      setIsTyping(true);

      // Check if we've reached the limit
      if (messageCount + 1 >= MAX_MESSAGES) {
        setTimeout(() => {
          setIsTyping(false);
          const continueMessage: Message = {
            id: `msg-${Date.now()}-continue`,
            role: 'assistant',
            content: 'Ai atins limita de mesaje în preview. Continuă conversația în interfața completă AI Assistant pentru răspunsuri nelimitate!',
          };
          setMessages((prev) => [...prev, continueMessage]);
        }, 800);
        return;
      }

      try {
        // Call real AI service
        const reply = await sendAiMessage('preview', newMessages);
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: reply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: 'Eroare la răspuns. Încearcă din nou sau continuă în interfața completă.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, isTyping, messageCount]
  );

  const handleContinueToFull = useCallback(() => {
    if (onContinueToFull) {
      onContinueToFull();
    } else {
      navigate('/ai');
    }
  }, [navigate, onContinueToFull]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showContinuePrompt = messageCount >= MAX_MESSAGES;

  return (
    <div className="relative w-full h-full flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-600/10 to-purple-500/10 backdrop-blur-sm shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300">
      {/* Subtle gradient border glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />

      {/* Chat container */}
      <div className="relative flex-1 flex flex-col min-h-0 bg-[hsl(240,10%,6%)]/40">
        {/* Messages area */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm border bg-white/[0.04] border-white/[0.08] text-white/70">
                <span className="inline-flex gap-1">
                  <span
                    className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"
                    style={{ animationDelay: '300ms' }}
                  />
                </span>
                {' '}Asistentul scrie...
              </div>
            </div>
          )}

          {showContinuePrompt && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/30">
              <p className="text-white/90 text-sm mb-3">
                Continuă conversația în AI Assistant →
              </p>
              <button
                onClick={handleContinueToFull}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-medium transition-all hover:scale-105"
              >
                <span>Deschide AI Assistant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div ref={listEndRef} />
        </div>

        {/* Suggestion chips - only show if not at limit */}
        {!showContinuePrompt && messageCount < 2 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {SUGGESTION_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(prompt)}
                disabled={isTyping}
                className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 text-white/80 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex gap-2 items-end rounded-2xl bg-white/[0.05] border border-white/10 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask ZenLink AI about symptoms, treatments, or dental care…"
              rows={1}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-transparent px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none"
              disabled={isTyping || showContinuePrompt}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isTyping || showContinuePrompt}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
              title="Trimite"
              aria-label="Trimite"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety/compliance line */}
        <div className="px-4 pb-3">
          <p className="text-[10px] text-white/40 text-center">
            ZenLink AI offers informational guidance and does not replace professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
