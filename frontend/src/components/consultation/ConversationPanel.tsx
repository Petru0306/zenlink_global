/**
 * ChatGPT-like conversation panel - scrollable message area
 */

import { Message } from '../../types/consultation'
import { renderAssistantOutput } from '../../lib/renderAssistantOutput'
import AssistantCardStructure from './AssistantCardStructure'
import AssistantCardAnalyze from './AssistantCardAnalyze'
import AiPanelResponse from './AiPanelResponse'
import { Loader2, Copy, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface ConversationPanelProps {
  messages: Message[]
  currentDraft?: string
  isProcessing?: boolean
  onUpdateMessage?: (messageId: string, updatedData: any) => void
}

export default function ConversationPanel({ messages, currentDraft, isProcessing, onUpdateMessage }: ConversationPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentDraft, isProcessing])

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getTextToCopy = (msg: Message): string => {
    if (msg.outputData && (msg.outputData.mode === 'structure' || msg.outputData.mode === 'analyze')) {
      // For structured responses, create a readable text version
      const data = msg.outputData
      let text = `${data.title || 'ZenLink Response'}\n\n`
      if (data.summary) text += `${data.summary}\n\n`
      
      if (data.mode === 'structure' && 'sections' in data) {
        data.sections?.forEach((section: any) => {
          text += `${section.heading}\n`
          section.bullets?.forEach((bullet: string) => {
            text += `  • ${bullet}\n`
          })
          text += '\n'
        })
      } else if (data.mode === 'analyze') {
        const analyzeData = data as any
        if (analyzeData.aspectsToConsider?.length) {
          text += `Aspecte de luat în considerare:\n`
          analyzeData.aspectsToConsider.forEach((item: string) => {
            text += `  • ${item}\n`
          })
          text += '\n'
        }
        if (analyzeData.usefulClarificationQuestions?.length) {
          text += `Întrebări utile:\n`
          analyzeData.usefulClarificationQuestions.forEach((item: string) => {
            text += `  • ${item}\n`
          })
          text += '\n'
        }
        if (analyzeData.possibleGeneralExplanations?.length) {
          text += `Posibile explicații:\n`
          analyzeData.possibleGeneralExplanations.forEach((item: string) => {
            text += `  • ${item}\n`
          })
          text += '\n'
        }
      }
      return text.trim()
    }
    return msg.content || ''
  }

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
          let parsedOutputData = msg.outputData
          
          // Try to parse from content if outputData is missing but we have outputType
          if (!parsedOutputData && msg.outputType && msg.content) {
            try {
              const trimmed = msg.content.trim()
              if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                const parsed = JSON.parse(trimmed)
                if (parsed.mode === 'structure' || parsed.mode === 'analyze') {
                  parsedOutputData = parsed
                }
              }
            } catch (e) {
              // Not JSON, continue with normal rendering
            }
          }
          
          if (parsedOutputData && (parsedOutputData.mode === 'structure' || parsedOutputData.mode === 'analyze')) {
            rendered = {
              type: 'json' as const,
              content: '',
              data: parsedOutputData,
            }
          } else {
            rendered = renderAssistantOutput(msg.content, msg.outputType, msg.outputData)
          }

          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'doctor' ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div
                className={`${msg.role === 'doctor' ? 'max-w-[65%]' : 'max-w-[90%]'} rounded-2xl p-4 relative group ${
                  msg.role === 'doctor'
                    ? 'bg-purple-600/30 border border-purple-500/40'
                    : 'bg-white/10 border border-white/20'
                }`}
              >
                {/* Copy button - for both doctor and assistant messages with content */}
                {(msg.content || msg.outputData) && (
                  <button
                    onClick={() => handleCopy(getTextToCopy(msg), msg.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30"
                    title="Copiază"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white/60" />
                    )}
                  </button>
                )}
                {isAssistant && msg.isTyping && !msg.outputData ? (
                  // Show loading state
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <p className="text-white/50 text-sm">Se procesează...</p>
                  </div>
                ) : isAssistant && parsedOutputData && (parsedOutputData.mode === 'structure' || parsedOutputData.mode === 'analyze') ? (
                  // Render new structured response format
                  (() => {
                    console.log('🟢 Rendering AiPanelResponse for message:', msg.id, 'with mode:', parsedOutputData.mode)
                    return (
                      <AiPanelResponse 
                        response={parsedOutputData} 
                        messageId={msg.id}
                        onUpdate={(updated) => {
                          if (onUpdateMessage) {
                            onUpdateMessage(msg.id, updated)
                          }
                        }}
                      />
                    )
                  })()
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
                
                {/* Debug: Show if we have outputData */}
                {isAssistant && msg.outputData && (
                  <div className="text-xs text-purple-300/50 mt-2">
                    Mode: {msg.outputData.mode || 'unknown'}
                  </div>
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
          <div className="flex justify-end w-full">
            <div className="max-w-[65%] rounded-2xl p-4 bg-purple-600/20 border border-purple-500/30 border-dashed">
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
          <div className="flex justify-start w-full">
            <div className="max-w-[90%] rounded-2xl p-4 bg-white/10 border border-white/20">
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
