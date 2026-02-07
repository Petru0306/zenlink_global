/**
 * Renders STRUCTURE mode output - organized clinical notes
 */

import { StructureOutput } from '../../types/consultation'
import { FileText, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react'

interface AssistantCardStructureProps {
  output: StructureOutput
}

export default function AssistantCardStructure({ output }: AssistantCardStructureProps) {
  return (
    <div className="space-y-6">
      {/* Chief Concern */}
      {output.chiefConcern && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Motivul consultației</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{output.chiefConcern}</p>
        </div>
      )}

      {/* History / Timeline */}
      {output.history && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Istoric / Cronologie</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{output.history}</p>
        </div>
      )}

      {/* Symptoms & Triggers */}
      {output.symptoms && output.symptoms.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Simptome & Triggeri</h3>
          </div>
          <ul className="space-y-2">
            {output.symptoms.map((symptom, idx) => (
              <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Medical Context */}
      {output.medicalContext && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Context medical (dacă menționat)</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{output.medicalContext}</p>
        </div>
      )}

      {/* Examination / Observations */}
      {output.examination && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Examinare / Observații</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{output.examination}</p>
        </div>
      )}

      {/* Open Items */}
      {output.openItems && output.openItems.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Puncte de documentat</h3>
          </div>
          <ul className="space-y-2">
            {output.openItems.map((item, idx) => (
              <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Draft Note */}
      {output.draftNote && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-purple-300" />
            <h3 className="text-sm font-semibold text-purple-200">Notă draft (gata de copiat)</h3>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <pre className="text-sm text-white/90 whitespace-pre-wrap font-mono leading-relaxed">
              {output.draftNote}
            </pre>
          </div>
        </div>
      )}

      {/* Generic Sections */}
      {output.sections && output.sections.length > 0 && (
        <>
          {output.sections.map((section, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">{section.title}</h3>
              {typeof section.content === 'string' ? (
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{section.content}</p>
              ) : (
                <ul className="space-y-2">
                  {section.content.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-sm text-white/80 flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
