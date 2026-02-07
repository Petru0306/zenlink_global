/**
 * ChatGPT-like conversation panel - scrollable message area
 */

import { Message } from '../../types/consultation'
import { renderAssistantOutput } from '../../lib/renderAssistantOutput'
import AssistantCardStructure from './AssistantCardStructure'
import AssistantCardAnalyze from './AssistantCardAnalyze'
import AiPanelResponse from './AiPanelResponse'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface ConversationPanelProps {
  messages: Message[]
  currentDraft?: string
  isProcessing?: boolean
}

export default function ConversationPanel({ messages, currentDraft, isProcessing }: ConversationPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentDraft, isProcessing])

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Empty state */}
        {messages.length === 0 && !currentDraft && (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center py-20">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <p className="text-white/50 text-sm">Apasă "Start Recording" pentru a începe consultația</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant'
          
          // If we have outputData directly, use it; otherwise parse from content
          let rendered
          if (msg.outputData && msg.outputType) {
            rendered = {
              type: 'json' as const,
              content: '',
              data: msg.outputData,
            }
          } else {
            rendered = renderAssistantOutput(msg.content, msg.outputType, msg.outputData)
          }

          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'doctor' ? 'justify-end' : 'justify-start'} flex-col`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-5 ${
                  msg.role === 'doctor'
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {isAssistant && msg.isTyping && !msg.outputData ? (
                  // Show loading state
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <p className="text-white/50 text-sm">Se procesează...</p>
                  </div>
                ) : isAssistant && msg.outputData && (msg.outputData.mode === 'structure' || msg.outputData.mode === 'analyze') ? (
                  // Render new structured response format
                  <AiPanelResponse response={msg.outputData} />
                ) : isAssistant && rendered.type === 'json' && rendered.data ? (
                  // Fallback to legacy format
                  msg.outputType === 'analyze' && rendered.data && 'structure' in rendered.data ? (
                    <AssistantCardAnalyze output={rendered.data as any} />
                  ) : rendered.data ? (
                    <AssistantCardStructure output={rendered.data as any} />
                  ) : (
                    <div className="text-white/50 text-sm">Se procesează...</div>
                  )
                ) : isAssistant && msg.isTyping ? (
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Se procesează...
                  </div>
                ) : (
                  // Render streaming text with nice formatting
                  msg.content && msg.content.length > 0 ? (
                    <div
                      className="text-white/90 whitespace-pre-wrap break-words leading-relaxed"
                      style={{ 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        lineHeight: '1.7'
                      }}
                    >
                      {msg.content.split('\n').map((line, idx) => {
                        // Format headers and bullets nicely
                        if (line.trim().startsWith('📝') || line.trim().startsWith('🧠')) {
                          return (
                            <h2 key={idx} className="text-xl font-semibold text-white mt-4 mb-2 first:mt-0">
                              {line}
                            </h2>
                          )
                        }
                        if (line.trim().match(/^[A-ZĂÂÎȘȚ][^:]+:$/)) {
                          return (
                            <h3 key={idx} className="text-base font-semibold text-white/90 mt-3 mb-1.5">
                              {line}
                            </h3>
                          )
                        }
                        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                          return (
                            <div key={idx} className="text-white/80 ml-4 mb-1">
                              {line}
                            </div>
                          )
                        }
                        return (
                          <div key={idx} className="text-white/80 mb-1.5">
                            {line || '\u00A0'}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div
                      className="markdown-content text-white/90 prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: rendered.content || '' }}
                    />
                  )
                )}
                <p className="text-xs text-white/30 mt-3">
                  {msg.timestamp.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}

        {/* Live draft bubble */}
        {currentDraft && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl p-5 bg-purple-500/10 border border-purple-500/20 border-dashed">
              <p className="text-white/70 italic">{currentDraft}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                <p className="text-xs text-white/30">Se transcrie...</p>
              </div>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <p className="text-white/50 text-sm">ZenLink analizează...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
