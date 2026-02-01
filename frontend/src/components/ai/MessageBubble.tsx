import { useNavigate } from 'react-router-dom';
import type { Message } from '../../lib/aiStorage';
import { renderMarkdown } from '../../lib/markdown';
import { parseAiTurn, isStructuredResponse } from '../../lib/aiTurn';
import { StructuredMessage } from './StructuredMessage';

type Props = {
  message: Message;
  onOptionSelect?: (value: string, label: string) => void;
  onFreeTextSubmit?: (text: string) => void;
};

export function MessageBubble({ message, onOptionSelect, onFreeTextSubmit }: Props) {
  const navigate = useNavigate();
  const isUser = message.role === 'user';
  const showCta = message.meta?.showCta === true;
  const isLoading = message.meta?.status === 'loading';
  
  // Use cached parsed turn if available, otherwise parse
  const structuredTurn = !isUser && !isLoading
    ? (message.meta?.parsedTurn || (isStructuredResponse(message.content) ? parseAiTurn(message.content) : null))
    : null;
  
  // Only render markdown if not structured and not loading
  const renderedContent = !isUser && !isLoading && !structuredTurn
    ? renderMarkdown(message.content)
    : null;
  
  return (
    <div
      className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'} mb-8`}
    >
      {isUser ? (
        <div
          className={[
            'max-w-[70%] rounded-2xl px-5 py-3.5 text-sm border',
            'bg-white/[0.08] border-white/10 text-white whitespace-pre-wrap',
          ].join(' ')}
        >
          {message.content}
        </div>
      ) : isLoading ? (
        // Loading skeleton - no raw text flash
        <div className="w-full max-w-[1000px]">
          <div className="rounded-2xl px-6 py-5 bg-white/[0.04] border border-white/[0.08] animate-pulse">
            <div className="space-y-4">
              <div className="h-6 bg-white/10 rounded w-1/3"></div>
              <div className="h-4 bg-white/10 rounded w-2/3"></div>
              <div className="flex gap-3 mt-4">
                <div className="h-10 bg-white/10 rounded-xl w-24"></div>
                <div className="h-10 bg-white/10 rounded-xl w-24"></div>
                <div className="h-10 bg-white/10 rounded-xl w-24"></div>
              </div>
            </div>
          </div>
        </div>
      ) : structuredTurn ? (
        <div className="w-full max-w-[1000px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl px-6 py-5 bg-white/[0.04] border border-white/[0.08] text-[hsl(220,12%,90%)]">
            <StructuredMessage
              turn={structuredTurn}
              onOptionSelect={onOptionSelect}
              onFreeTextSubmit={onFreeTextSubmit}
            />
          </div>
        </div>
      ) : renderedContent ? (
        <div
          className={[
            'max-w-[70%] rounded-2xl px-5 py-4 text-sm border animate-in fade-in slide-in-from-bottom-4 duration-300',
            'bg-white/[0.04] border-white/[0.08] text-[hsl(220,12%,90%)]',
          ].join(' ')}
        >
          <div 
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
            style={{
              color: 'hsl(220,12%,90%)',
            }}
          />
        </div>
      ) : null}
      
      {showCta && !isUser && !structuredTurn && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2 max-w-[85%]">
          <button
            onClick={() => navigate('/doctori')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>📅</span>
            <span>Programează-te la un medic</span>
          </button>
          <button
            onClick={() => navigate('/doctori')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>🔎</span>
            <span>Vezi doctorii</span>
          </button>
        </div>
      )}
    </div>
  );
}
