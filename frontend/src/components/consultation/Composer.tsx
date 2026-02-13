/**
 * ChatGPT-like composer - sticky bottom input with mic controls
 */

import { useState, useRef, useEffect } from 'react'
import { Mic, Pause, Send, Loader2, List, Sparkles, FileText } from 'lucide-react'

interface ComposerProps {
  draftText: string
  onDraftChange: (text: string) => void
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onSendNote?: () => void
  onStructure: () => void
  onAnalyze: () => void
  onFinalize?: () => void
  isStructuring: boolean
  isAnalyzing: boolean
  isFinalizing?: boolean
  disabled?: boolean
  appointmentId?: string
  segments?: any[]
  messages?: any[]
}

export default function Composer({
  draftText,
  onDraftChange,
  isRecording,
  onStartRecording,
  onStopRecording,
  onSendNote,
  onStructure,
  onAnalyze,
  onFinalize,
  isStructuring,
  isAnalyzing,
  isFinalizing = false,
  disabled = false,
  appointmentId,
  segments = [],
  messages = [],
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 200 // max 200px
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [draftText])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter = Analyze (or send note if available)
    // Shift+Enter = newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (onSendNote && draftText.trim()) {
        onSendNote()
      } else if (draftText.trim() && !isAnalyzing && !isStructuring) {
        onAnalyze()
      }
    }
  }

  return (
    <div 
      className="shrink-0 border-t border-white/10 bg-[#0a0a14] relative z-20 w-full" 
      style={{ 
        flexShrink: 0,
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        position: 'relative'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 min-h-[100px] w-full">
        <div className="flex items-end gap-3">
          {/* Consultation info - left of mic */}
          <div className="shrink-0">
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">
              Consultație #{appointmentId}
            </p>
            <h1 className="text-lg font-semibold text-white">Consultation Workspace</h1>
          </div>
          
          {/* Mic button */}
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={disabled || isStructuring || isAnalyzing}
            className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400'
                : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <div className="relative">
                <Pause className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              </div>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Textarea - wider */}
          <div className="flex-[2.5] rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={draftText}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? 'Se înregistrează...'
                  : 'Scrie note sau apasă mic pentru voice-to-text...'
              }
              rows={1}
              disabled={disabled || isStructuring || isAnalyzing}
              className="w-full bg-transparent px-4 py-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none overflow-y-auto max-h-[200px] disabled:opacity-50"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Structure button - can be clicked anytime (analyzes full conversation) */}
            <button
              onClick={onStructure}
              disabled={disabled || isStructuring || isAnalyzing}
              className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStructuring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Structurând...</span>
                </>
              ) : (
                <>
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Structure</span>
                </>
              )}
            </button>

            {/* Analyze button - can be clicked anytime (analyzes full conversation) */}
            <button
              onClick={onAnalyze}
              disabled={disabled || isStructuring || isAnalyzing}
              className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Analizând...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">ZenLink Analyze</span>
                </>
              )}
            </button>

            {/* Finalize button - next to Analyze */}
            {onFinalize && (
              <button
                onClick={onFinalize}
                disabled={
                  (segments.length === 0 && messages.length === 0 && !draftText.trim()) ||
                  isStructuring ||
                  isAnalyzing ||
                  isFinalizing ||
                  disabled
                }
                className="px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFinalizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Finalizând...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Finalize</span>
                  </>
                )}
              </button>
            )}

            {/* Optional: Send note button */}
            {onSendNote && (
              <button
                onClick={onSendNote}
                disabled={!draftText.trim() || disabled || isStructuring || isAnalyzing}
                className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
