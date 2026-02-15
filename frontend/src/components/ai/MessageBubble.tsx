import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import type { Message } from '../../lib/aiStorage';
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

  // Filter out HTML comments from display (used for hidden system instructions)
  const contentToDisplay = message.content.replace(/<!--[\s\S]*?-->/g, '').trim();

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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-4 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-4 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="pl-1 text-white/90">{children}</li>,
              h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-3 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-white mt-2 mb-1">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-white/30 pl-3 py-1 my-2 bg-white/5 rounded-r text-white/80 italic text-sm">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-white/20 rounded px-1.5 py-0.5 text-xs font-mono text-white">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-black/30 border border-white/10 rounded-lg p-2 my-2 overflow-x-auto text-xs font-mono">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline underline-offset-2 hover:text-white/80 transition-colors"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong className="font-bold text-purple-400">{children}</strong>,
              table: ({ children }) => (
                <div className="overflow-x-auto my-2 border border-white/10 rounded">
                  <table className="min-w-full divide-y divide-white/10">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-white/10">{children}</thead>,
              tbody: ({ children }) => <tbody className="divide-y divide-white/10">{children}</tbody>,
              tr: ({ children }) => <tr>{children}</tr>,
              th: ({ children }) => (
                <th className="px-2 py-1 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-2 py-1 whitespace-nowrap text-sm text-white/80">
                  {children}
                </td>
              ),
            }}
          >
            {contentToDisplay}
          </ReactMarkdown>
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
      ) : (
        <div
          className={[
            'max-w-[85%] rounded-2xl px-6 py-5 text-sm border animate-in fade-in slide-in-from-bottom-4 duration-300',
            'bg-white/[0.04] border-white/[0.08] text-[hsl(220,12%,90%)]',
          ].join(' ')}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="pl-1 text-white/90">{children}</li>,
              h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-6 mb-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold text-white mt-5 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-white mt-4 mb-2">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-purple-500/50 pl-4 py-1 my-4 bg-white/[0.02] rounded-r text-white/80 italic">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-purple-200">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-[#0a0e1a]/50 border border-white/10 rounded-lg p-3 my-4 overflow-x-auto text-xs font-mono">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
              table: ({ children }) => (
                <div className="overflow-x-auto my-4 border border-white/10 rounded-lg">
                  <table className="min-w-full divide-y divide-white/10">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
              tbody: ({ children }) => <tbody className="divide-y divide-white/10">{children}</tbody>,
              tr: ({ children }) => <tr>{children}</tr>,
              th: ({ children }) => (
                <th className="px-3 py-2 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2 whitespace-nowrap text-sm text-white/80">
                  {children}
                </td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )}

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
