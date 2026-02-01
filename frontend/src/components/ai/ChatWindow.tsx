import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../lib/aiStorage';

type Props = {
  title: string;
  messages: Message[];
  isTyping: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export function ChatWindow({
  title,
  messages,
  isTyping,
  input,
  onInputChange,
  onSend,
}: Props) {
  const listEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(240,10%,6%)]/40 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-white truncate">{title || 'New chat'}</h2>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && !isTyping && (
          <div className="text-center text-white/50 text-sm py-12">
            Începe o conversație. Scrie mai jos sau alege o conversație din stânga.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm border bg-white/[0.04] border-white/[0.08] text-white/70">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: '300ms' }} />
              </span>
              {' '}Asistentul scrie...
            </div>
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/10 bg-white/[0.02]">
        <div className="flex gap-2 items-end rounded-2xl bg-white/[0.05] border border-white/10 focus-within:border-purple-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrie mesajul tău... (Enter trimite, Shift+Enter linie nouă)"
            rows={1}
            className="flex-1 min-h-[44px] max-h-[200px] resize-none bg-transparent px-4 py-3 text-white text-sm placeholder:text-white/40 focus:outline-none"
            disabled={isTyping}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || isTyping}
            className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            title="Trimite"
            aria-label="Trimite"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
