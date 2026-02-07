/**
 * Renders ZENLINK ANALYZE mode output - structure + insights + references
 */

import { AnalyzeOutput } from '../../types/consultation'
import AssistantCardStructure from './AssistantCardStructure'
import { Sparkles, HelpCircle, BookOpen, AlertTriangle, Stethoscope, ExternalLink } from 'lucide-react'

interface AssistantCardAnalyzeProps {
  output: AnalyzeOutput
}

export default function AssistantCardAnalyze({ output }: AssistantCardAnalyzeProps) {
  return (
    <div className="space-y-6">
      {/* Structure section (reuse structure component) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Structură consultație</h2>
        </div>
        <AssistantCardStructure output={output.structure} />
      </div>

      {/* Clinician Prompts */}
      {output.clinicianPrompts && output.clinicianPrompts.length > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-purple-300" />
            <h3 className="text-base font-semibold text-purple-200">
              Întrebări pe care le-ai putea considera
            </h3>
          </div>
          <div className="space-y-3">
            {output.clinicianPrompts.map((prompt, idx) => (
              <div key={idx} className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-sm text-white/90 font-medium mb-1">{prompt.question}</p>
                {prompt.rationale && (
                  <p className="text-xs text-white/50 italic">Rationament: {prompt.rationale}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Possible Directions */}
      {output.possibleDirections && output.possibleDirections.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">
              Direcții posibile de explorat (informațional, nu diagnostic)
            </h3>
          </div>
          <div className="space-y-2">
            {output.possibleDirections.map((direction, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">•</span>
                <div className="flex-1">
                  <p className="text-sm text-white/90 font-medium">{direction.area}</p>
                  {direction.note && (
                    <p className="text-xs text-white/60 mt-1">{direction.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence / Sources */}
      {output.evidence && output.evidence.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">Surse / Referințe</h3>
          </div>
          <div className="space-y-2">
            {output.evidence.map((source, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2 rounded-lg ${
                  source.placeholder ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/5'
                }`}
              >
                <span className="text-purple-400 mt-1">•</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white/90 font-medium">{source.title}</p>
                    {source.placeholder && (
                      <span className="text-xs text-yellow-400/70 bg-yellow-500/20 px-2 py-0.5 rounded">
                        Adaugă sursă
                      </span>
                    )}
                  </div>
                  {source.year && (
                    <p className="text-xs text-white/50 mt-1">An: {source.year}</p>
                  )}
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 mt-1 flex items-center gap-1"
                    >
                      Deschide <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {output.redFlags && output.redFlags.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-semibold text-red-200">Red Flags</h3>
          </div>
          <ul className="space-y-2">
            {output.redFlags.map((flag, idx) => (
              <li key={idx} className="text-sm text-white/90 flex items-start gap-2">
                <span className="text-red-400 mt-1">⚠</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Checks */}
      {output.suggestedChecks && output.suggestedChecks.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">
              Verificări clinice de considerat (dacă e clinic potrivit)
            </h3>
          </div>
          <ul className="space-y-2">
            {output.suggestedChecks.map((check, idx) => (
              <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>{check}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
