/**
 * Beautiful rendering component for Structure and Analyze responses
 * Never shows raw JSON - always renders as cards, bullets, chips
 */

import { StructureResponse, AnalyzeResponse } from '../../types/consultation'
import { FileText, AlertCircle, Clock, AlertTriangle, BookOpen, ExternalLink, CheckCircle2 } from 'lucide-react'

interface AiPanelResponseProps {
  response: StructureResponse | AnalyzeResponse
}

export default function AiPanelResponse({ response }: AiPanelResponseProps) {
  if (response.mode === 'structure') {
    return <StructureView response={response} />
  } else {
    return <AnalyzeView response={response} />
  }
}

function StructureView({ response }: { response: StructureResponse }) {
  // Ensure sections array exists
  const sections = response.sections || []
  
  return (
    <div className="space-y-6">
      {/* Title and Summary */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-300" />
          {response.title || 'Structură consultație'}
        </h2>
        {response.summary && (
          <p className="text-sm text-white/80 leading-relaxed">{response.summary}</p>
        )}
      </div>

      {/* Sections */}
      {sections.length > 0 ? (
        sections.map((section, idx) => {
          const bullets = section.bullets || []
          return (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-5">
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

function AnalyzeView({ response }: { response: AnalyzeResponse }) {
  // Check if new format fields exist (ZenLink Insights format)
  const hasNewFormat = 
    (response as any).aspectsToConsider || 
    (response as any).usefulClarificationQuestions || 
    (response as any).possibleGeneralExplanations ||
    (response as any).observedRiskFactors ||
    (response as any).informativeReferences

  return (
    <div className="space-y-6">
      {/* Title and Summary */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-300" />
          {response.title || '🧠 ZenLink Insights'}
        </h2>
        {response.summary && (
          <p className="text-sm text-white/80 leading-relaxed">{response.summary}</p>
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
              <ul className="space-y-2">
                {(response as any).usefulClarificationQuestions.map((question: string, idx: number) => (
                  <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
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
              <ul className="space-y-2">
                {(response as any).observedRiskFactors.map((factor: string, idx: number) => (
                  <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
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
