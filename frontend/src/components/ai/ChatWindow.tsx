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
  onOptionSelect?: (value: string, label: string) => void;
  onFreeTextSubmit?: (text: string) => void;
};

export function ChatWindow({
  title,
  messages,
  isTyping,
  input,
  onInputChange,
  onSend,
  onOptionSelect,
  onFreeTextSubmit,
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
    <div className="flex flex-col h-full w-full bg-[hsl(240,10%,6%)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-white/10 bg-white/[0.02] shrink-0">
        <h2 className="text-xl font-semibold text-white truncate">{title || 'New chat'}</h2>
      </div>

      {/* Message list - full width, more padding */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-8">
        {messages.length === 0 && !isTyping && (
          <div className="text-center text-white/50 text-sm py-12">
            Începe o conversație. Scrie mai jos sau alege o conversație din stânga.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onOptionSelect={onOptionSelect}
            onFreeTextSubmit={onFreeTextSubmit}
          />
        ))}
        {isTyping && (
          <div className="flex justify-start w-full">
            <div className="w-full max-w-[1000px] rounded-2xl px-6 py-5 border bg-white/[0.04] border-white/[0.08]">
              <div className="flex items-center gap-3 text-white/70">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-sm">Asistentul scrie...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      {/* Disclaimer footer */}
      <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] shrink-0">
        <p className="text-xs text-white/50 text-center">
          ⚠️ ZenLink AI oferă informații generale și nu înlocuiește consultul medical.
        </p>
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] shrink-0">
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
