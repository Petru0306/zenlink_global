/**
 * Beautiful rendering component for Structure and Analyze responses
 * Never shows raw JSON - always renders as cards, bullets, chips
 */

import { StructureResponse, AnalyzeResponse } from '../../types/consultation'
import { FileText, AlertCircle, Clock, AlertTriangle, BookOpen, ExternalLink, CheckCircle2, Copy, Check, Edit2, Save } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AiPanelResponseProps {
  response: StructureResponse | AnalyzeResponse
  messageId?: string
  onUpdate?: (updatedResponse: StructureResponse | AnalyzeResponse) => void
}

export default function AiPanelResponse({ response, messageId, onUpdate }: AiPanelResponseProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedResponse, setEditedResponse] = useState<StructureResponse | AnalyzeResponse>(response)
  
  // Debug: Log when component renders
  useEffect(() => {
    console.log('🔵 AiPanelResponse rendered:', { 
      messageId, 
      mode: response.mode, 
      hasTitle: !!response.title,
      hasOnUpdate: !!onUpdate
    })
  }, [messageId, response, onUpdate])

  const getTextToCopy = (): string => {
    let text = `${response.title || 'ZenLink Response'}\n\n`
    if (response.summary) text += `${response.summary}\n\n`
    
    if (response.mode === 'structure') {
      const struct = response as StructureResponse
      struct.sections?.forEach((section) => {
        text += `${section.heading}\n`
        section.bullets?.forEach((bullet) => {
          text += `  • ${bullet}\n`
        })
        text += '\n'
      })
      if (struct.timeline?.length) {
        text += `Cronologie:\n`
        struct.timeline.forEach((item) => {
          text += `  ${item.when}: ${item.what}\n`
        })
        text += '\n'
      }
      if (struct.missingInfo?.length) {
        text += `Informații de clarificat:\n`
        struct.missingInfo.forEach((info) => {
          text += `  • ${info}\n`
        })
      }
    } else {
      const analyze = response as any
      if (analyze.aspectsToConsider?.length) {
        text += `Aspecte de luat în considerare:\n`
        analyze.aspectsToConsider.forEach((item: string) => {
          text += `  • ${item}\n`
        })
        text += '\n'
      }
      if (analyze.usefulClarificationQuestions?.length) {
        text += `Întrebări utile:\n`
        analyze.usefulClarificationQuestions.forEach((item: string) => {
          text += `  • ${item}\n`
        })
        text += '\n'
      }
      if (analyze.possibleGeneralExplanations?.length) {
        text += `Posibile explicații:\n`
        analyze.possibleGeneralExplanations.forEach((item: string) => {
          text += `  • ${item}\n`
        })
        text += '\n'
      }
      if (analyze.observedRiskFactors?.length) {
        text += `Factori de risc observați:\n`
        analyze.observedRiskFactors.forEach((item: string) => {
          text += `  • ${item}\n`
        })
        text += '\n'
      }
    }
    return text.trim()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getTextToCopy())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedResponse)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedResponse(response)
    setIsEditing(false)
  }

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 z-10">
        {!isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-all shadow-sm"
              title="Editează"
            >
              <Edit2 className="w-4 h-4 text-purple-300" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all shadow-sm"
              title="Copiază"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/70" />
              )}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 transition-all shadow-sm"
              title="Salvează"
            >
              <Save className="w-4 h-4 text-green-400" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all shadow-sm"
              title="Anulează"
            >
              <span className="text-red-400 text-sm font-semibold">✕</span>
            </button>
          </>
        )}
      </div>
      {response.mode === 'structure' ? (
        <StructureView 
          response={isEditing ? editedResponse as StructureResponse : response as StructureResponse} 
          isEditing={isEditing}
          onUpdate={(updated) => setEditedResponse(updated)}
        />
      ) : (
        <AnalyzeView 
          response={isEditing ? editedResponse as AnalyzeResponse : response as AnalyzeResponse} 
          isEditing={isEditing}
          onUpdate={(updated) => setEditedResponse(updated)}
        />
      )}
    </div>
  )
}

function StructureView({ 
  response, 
  isEditing = false, 
  onUpdate 
}: { 
  response: StructureResponse
  isEditing?: boolean
  onUpdate?: (updated: StructureResponse) => void
}) {
  // Ensure sections array exists
  const sections = response.sections || []
  
  const updateSection = (sectionIndex: number, field: 'heading' | 'bullets', value: string | string[]) => {
    if (!onUpdate) return
    const updated = { ...response }
    updated.sections = [...(updated.sections || [])]
    updated.sections[sectionIndex] = {
      ...updated.sections[sectionIndex],
      [field]: value
    }
    onUpdate(updated)
  }
  
  const updateBullet = (sectionIndex: number, bulletIndex: number, value: string) => {
    if (!onUpdate) return
    const updated = { ...response }
    updated.sections = [...(updated.sections || [])]
    const bullets = [...(updated.sections[sectionIndex].bullets || [])]
    bullets[bulletIndex] = value
    updated.sections[sectionIndex] = {
      ...updated.sections[sectionIndex],
      bullets
    }
    onUpdate(updated)
  }
  
  const addBullet = (sectionIndex: number) => {
    if (!onUpdate) return
    const updated = { ...response }
    updated.sections = [...(updated.sections || [])]
    const bullets = [...(updated.sections[sectionIndex].bullets || [])]
    bullets.push('')
    updated.sections[sectionIndex] = {
      ...updated.sections[sectionIndex],
      bullets
    }
    onUpdate(updated)
  }
  
  const removeBullet = (sectionIndex: number, bulletIndex: number) => {
    if (!onUpdate) return
    const updated = { ...response }
    updated.sections = [...(updated.sections || [])]
    const bullets = [...(updated.sections[sectionIndex].bullets || [])]
    bullets.splice(bulletIndex, 1)
    updated.sections[sectionIndex] = {
      ...updated.sections[sectionIndex],
      bullets
    }
    onUpdate(updated)
  }
  
  return (
    <div className="space-y-6">
      {/* Title and Summary */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
        {isEditing ? (
          <>
            <input
              type="text"
              value={response.title || ''}
              onChange={(e) => onUpdate && onUpdate({ ...response, title: e.target.value })}
              className="text-xl font-semibold text-white mb-3 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
              placeholder="Titlu"
            />
            <textarea
              value={response.summary || ''}
              onChange={(e) => onUpdate && onUpdate({ ...response, summary: e.target.value })}
              className="text-sm text-white/80 leading-relaxed w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50 resize-none"
              placeholder="Rezumat"
              rows={3}
            />
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-300" />
              {response.title || 'Structură consultație'}
            </h2>
            {response.summary && (
              <p className="text-sm text-white/80 leading-relaxed">{response.summary}</p>
            )}
          </>
        )}
      </div>

      {/* Sections */}
      {sections.length > 0 ? (
        sections.map((section, idx) => {
          const bullets = section.bullets || []
          return (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-5">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={section.heading || ''}
                    onChange={(e) => updateSection(idx, 'heading', e.target.value)}
                    className="text-base font-semibold text-white mb-3 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
                    placeholder="Titlu secțiune"
                  />
                  <div className="space-y-2">
                    {bullets.map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1.5">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateBullet(idx, bulletIdx, e.target.value)}
                          className="flex-1 text-sm text-white/80 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500/50"
                          placeholder="Bullet point"
                        />
                        <button
                          onClick={() => removeBullet(idx, bulletIdx)}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addBullet(idx)}
                      className="text-sm text-purple-300 hover:text-purple-200 mt-2 flex items-center gap-1"
                    >
                      + Adaugă bullet
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    {section.heading || `Secțiune ${idx + 1}`}
                  </h3>
                  {bullets.length > 0 ? (
                    <ul className="space-y-2">
                      {bullets.map((bullet, bulletIdx) => (
                        <li key={bulletIdx} className="text-sm text-white/80 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span className="flex-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-white/60 italic">Fără detalii disponibile</p>
                  )}
                </>
              )}
              {section.tags && section.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {section.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })
      ) : (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="text-sm text-red-200">
            Eroare: Nu s-au putut extrage secțiuni structurate. Te rugăm să încerci din nou.
          </p>
        </div>
      )}

      {/* Timeline */}
      {response.timeline && response.timeline.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Cronologie
          </h3>
          <div className="space-y-2">
            {response.timeline.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <span className="text-purple-400 font-medium shrink-0">{item.when}</span>
                <span className="text-white/80">{item.what}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Info */}
      {response.missingInfo && response.missingInfo.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <h3 className="text-base font-semibold text-yellow-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Informații de clarificat
          </h3>
          <ul className="space-y-2">
            {response.missingInfo.map((info, idx) => (
              <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>{info}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Note */}
      {response.safetyNote && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 italic">{response.safetyNote}</p>
        </div>
      )}
    </div>
  )
}

function AnalyzeView({ 
  response, 
  isEditing = false, 
  onUpdate 
}: { 
  response: AnalyzeResponse
  isEditing?: boolean
  onUpdate?: (updated: AnalyzeResponse) => void
}) {
  // Check if new format fields exist (ZenLink Insights format)
  const hasNewFormat = 
    (response as any).aspectsToConsider || 
    (response as any).usefulClarificationQuestions || 
    (response as any).possibleGeneralExplanations ||
    (response as any).observedRiskFactors ||
    (response as any).informativeReferences
  
  const updateArrayField = (field: string, index: number, value: string) => {
    if (!onUpdate) return
    const updated = { ...response } as any
    const array = [...(updated[field] || [])]
    array[index] = value
    updated[field] = array
    onUpdate(updated)
  }
  
  const addArrayItem = (field: string) => {
    if (!onUpdate) return
    const updated = { ...response } as any
    updated[field] = [...(updated[field] || []), '']
    onUpdate(updated)
  }
  
  const removeArrayItem = (field: string, index: number) => {
    if (!onUpdate) return
    const updated = { ...response } as any
    const array = [...(updated[field] || [])]
    array.splice(index, 1)
    updated[field] = array
    onUpdate(updated)
  }

  return (
    <div className="space-y-6">
      {/* Title and Summary */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
        {isEditing ? (
          <>
            <input
              type="text"
              value={response.title || ''}
              onChange={(e) => onUpdate && onUpdate({ ...response, title: e.target.value })}
              className="text-xl font-semibold text-white mb-3 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
              placeholder="Titlu"
            />
            <textarea
              value={response.summary || ''}
              onChange={(e) => onUpdate && onUpdate({ ...response, summary: e.target.value })}
              className="text-sm text-white/80 leading-relaxed w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50 resize-none"
              placeholder="Rezumat"
              rows={3}
            />
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-300" />
              {response.title || '🧠 ZenLink Insights'}
            </h2>
            {response.summary && (
              <p className="text-sm text-white/80 leading-relaxed">{response.summary}</p>
            )}
          </>
        )}
      </div>

      {hasNewFormat ? (
        // New ZenLink Insights format
        <>
          {/* Aspects to Consider */}
          {(response as any).aspectsToConsider && (response as any).aspectsToConsider.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-400" />
                Aspecte de luat în considerare
              </h3>
              <ul className="space-y-2">
                {(response as any).aspectsToConsider.map((aspect: string, idx: number) => (
                  <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{aspect}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Useful Clarification Questions */}
          {(response as any).usefulClarificationQuestions && (response as any).usefulClarificationQuestions.length > 0 && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
              <h3 className="text-base font-semibold text-purple-200 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-300" />
                Întrebări utile pentru clarificare
              </h3>
              {isEditing ? (
                <div className="space-y-2">
                  {(response as any).usefulClarificationQuestions.map((question: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1.5">•</span>
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => updateArrayField('usefulClarificationQuestions', idx, e.target.value)}
                        className="flex-1 text-sm text-white/80 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500/50"
                        placeholder="Întrebare de clarificare"
                      />
                      <button
                        onClick={() => removeArrayItem('usefulClarificationQuestions', idx)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem('usefulClarificationQuestions')}
                    className="text-sm text-purple-300 hover:text-purple-200 mt-2 flex items-center gap-1"
                  >
                    + Adaugă întrebare
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(response as any).usefulClarificationQuestions.map((question: string, idx: number) => (
                    <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Possible General Explanations */}
          {(response as any).possibleGeneralExplanations && (response as any).possibleGeneralExplanations.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Posibile explicații generale (informativ)
              </h3>
              <ul className="space-y-2">
                {(response as any).possibleGeneralExplanations.map((explanation: string, idx: number) => (
                  <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Observed Risk Factors */}
          {(response as any).observedRiskFactors && (response as any).observedRiskFactors.length > 0 && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
              <h3 className="text-base font-semibold text-yellow-200 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Factori de risc observați
              </h3>
              {isEditing ? (
                <div className="space-y-2">
                  {(response as any).observedRiskFactors.map((factor: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1.5">•</span>
                      <input
                        type="text"
                        value={factor}
                        onChange={(e) => updateArrayField('observedRiskFactors', idx, e.target.value)}
                        className="flex-1 text-sm text-white/80 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500/50"
                        placeholder="Factor de risc"
                      />
                      <button
                        onClick={() => removeArrayItem('observedRiskFactors', idx)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem('observedRiskFactors')}
                    className="text-sm text-purple-300 hover:text-purple-200 mt-2 flex items-center gap-1"
                  >
                    + Adaugă factor de risc
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(response as any).observedRiskFactors.map((factor: string, idx: number) => (
                    <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Informative References */}
          {(response as any).informativeReferences && (response as any).informativeReferences.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Referințe informative
              </h3>
              <ul className="space-y-2">
                {(response as any).informativeReferences.map((ref: string, idx: number) => (
                  <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        // Legacy format (backward compatibility)
        <>
          {/* Structured Content */}
          {response.structured && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Structură consultație</h3>
              <StructureView response={response.structured} />
            </div>
          )}

          {/* Insights */}
          {response.insights && response.insights.map((insight, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-base font-semibold text-white mb-3">{insight.heading}</h3>
              <ul className="space-y-2">
                {insight.bullets.map((bullet, bulletIdx) => (
                  <li key={bulletIdx} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Suggested Questions */}
          {response.suggestedQuestions && response.suggestedQuestions.length > 0 && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
              <h3 className="text-base font-semibold text-purple-200 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-300" />
                Întrebări pe care le-ai putea considera
              </h3>
              <div className="space-y-3">
                {response.suggestedQuestions.map((sq, idx) => (
                  <div key={idx} className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <p className="text-sm text-white/90 font-medium mb-2">{sq.question}</p>
                    {sq.options && sq.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sq.options.map((option, optIdx) => (
                          <span
                            key={optIdx}
                            className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citations */}
          {response.citations && response.citations.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Referințe / Surse
              </h3>
              <div className="space-y-2">
                {response.citations.map((citation, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-purple-400 mt-1">•</span>
                    <div className="flex-1">
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-300 hover:text-purple-200 font-medium flex items-center gap-2"
                      >
                        {citation.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {citation.note && (
                        <p className="text-xs text-white/50 mt-1">{citation.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Safety Note */}
      {response.safetyNote && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60 italic">{response.safetyNote}</p>
        </div>
      )}
    </div>
  )
}
