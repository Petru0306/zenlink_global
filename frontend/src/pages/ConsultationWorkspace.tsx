import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type TimelineItem = { at: string; label: string; refId?: string }
type ConsultationDraft = {
  notes: string
  tags: string[]
  findings: string[]
  attachments: string[]
  plan: string
}
type ConsultationContext = {
  appointmentId: string
  patient: {
    id: string
    displayName: string
    age?: number
    reason: string
  }
  internalPatientKey: string
  timeline: TimelineItem[]
  existingDraft?: ConsultationDraft
}

type PatientViewModel = {
  keyIdeas: string[]
  nextSteps: string[]
  watchAtHome: string[]
  faqs: string[]
}

type TranscriptEntry = {
  id: string
  text: string
  timestamp: Date
  speaker?: 'doctor' | 'patient'
}

// Listening indicator component - subtle like Apple's privacy dot
const ListeningIndicator = ({ isListening }: { isListening: boolean }) => {
  if (!isListening) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full bg-[#12121f]/90 border border-white/10 px-3 py-1.5 backdrop-blur-xl shadow-lg">
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs font-medium text-emerald-400/90">ZenLink Listening</span>
      </div>
    </div>
  )
}

// Patient Identity Card with personality placeholder
const PatientIdentityCard = ({
  patient,
  internalPatientKey,
}: {
  patient: ConsultationContext['patient']
  internalPatientKey: string
}) => {
  const ageLabel = patient.age ? `${patient.age}` : '—'
  const initials = patient.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20">
          <span className="text-lg font-semibold text-purple-200">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{patient.displayName}</h3>
          <p className="text-sm text-white/50 mt-0.5">{ageLabel} ani</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/40">Motiv</span>
          <span className="text-white/80">{patient.reason}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/40">ID</span>
          <span className="font-mono text-xs text-white/60">{internalPatientKey}</span>
        </div>
      </div>

      {/* Personality Analysis Placeholder */}
      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
          <span className="text-xs text-white/40">Analiză personalitate</span>
        </div>
        <p className="mt-2 text-xs text-white/30 italic">
          Disponibilă după consultație...
        </p>
      </div>
    </div>
  )
}

// Redesigned Timeline
const TimelinePanel = ({ events }: { events: Array<{ at: string; label: string }> }) => {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Istoric</span>
      </div>
      
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-xs text-white/30">Prima consultație</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-purple-500/30 via-purple-500/10 to-transparent" />
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={`${event.at}-${event.label}`} className="relative flex gap-3 pl-5">
                <div className={`absolute left-0 top-1.5 h-[9px] w-[9px] rounded-full border-2 ${
                  index === 0 
                    ? 'border-purple-500 bg-purple-500/30' 
                    : 'border-white/20 bg-[#0a0a14]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/40">{event.at}</p>
                  <p className="text-sm text-white/80 mt-0.5 truncate">{event.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Main consultation area with waveform visualization
const ConsultationArea = ({
  isListening,
  detectedTopics,
  isConsultClosed,
}: {
  isListening: boolean
  detectedTopics: string[]
  isConsultClosed: boolean
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-8">
      {/* Waveform visualization */}
      <div className="relative w-full max-w-md h-24 flex items-center justify-center mb-8">
        {isConsultClosed ? (
          <div className="flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        ) : isListening ? (
          <div className="flex items-center gap-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-purple-500 to-indigo-400 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 bg-white/20 rounded-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* Status text */}
      <p className={`text-sm font-medium ${isConsultClosed ? 'text-emerald-400' : isListening ? 'text-white/70' : 'text-white/30'}`}>
        {isConsultClosed ? 'Consultația s-a încheiat' : isListening ? 'Se înregistrează consultația...' : 'În așteptare'}
      </p>

      {/* Detected topics/tags */}
      {detectedTopics.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {detectedTopics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300"
            >
              <span className="h-1 w-1 rounded-full bg-purple-400" />
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Live transcription panel (bottom)
const TranscriptionPanel = ({
  entries,
  isVisible,
}: {
  entries: TranscriptEntry[]
  isVisible: boolean
}) => {
  if (!isVisible || entries.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-4xl px-6 pb-6">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c18]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-white/50">Transcriere live</span>
            </div>
            <span className="text-[10px] text-white/30 font-mono">
              {entries.length} intrări
            </span>
          </div>
          <div className="max-h-32 overflow-y-auto p-4 space-y-2 scrollbar-thin">
            {entries.slice(-5).map((entry) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <span className="text-[10px] text-white/30 font-mono whitespace-nowrap pt-0.5">
                  {entry.timestamp.toLocaleTimeString('ro-RO', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
                <p className="text-white/70 leading-relaxed">{entry.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ZenLink Clarity Panel
const ClarityPanel = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  summary,
  gaps,
  evidence,
  options,
}: {
  isOpen: boolean
  onClose: () => void
  activeTab: 'summary' | 'gaps' | 'evidence' | 'options'
  onTabChange: (tab: 'summary' | 'gaps' | 'evidence' | 'options') => void
  summary: string[]
  gaps: string[]
  evidence: Array<{ statement: string; sources: string[] }>
  options: string[]
}) => {
  if (!isOpen) return null

  const tabs = [
    { id: 'summary' as const, label: 'Rezumat', icon: '📋' },
    { id: 'gaps' as const, label: 'Lipsuri', icon: '❓' },
    { id: 'evidence' as const, label: 'Evidențe', icon: '📚' },
    { id: 'options' as const, label: 'Opțiuni', icon: '💡' },
  ]

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md">
      <div className="h-full bg-[#0c0c18]/98 backdrop-blur-xl border-l border-white/[0.06] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
              <span className="text-sm">🔍</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Clarity Check</h3>
              <p className="text-[10px] text-white/40">ZenLink Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 py-3 border-b border-white/[0.06] flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeTab === 'summary' && (
            summary.map((item, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-sm text-white/80 leading-relaxed">{item}</p>
              </div>
            ))
          )}
          {activeTab === 'gaps' && (
            gaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-white/50">Nu sunt lipsuri identificate</p>
              </div>
            ) : (
              gaps.map((gap, i) => (
                <div key={i} className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-amber-400">!</span>
                  </div>
                  <p className="text-sm text-white/80">{gap}</p>
                </div>
              ))
            )
          )}
          {activeTab === 'evidence' && (
            evidence.length === 0 ? (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-sm text-white/50 italic">No source → not shown</p>
              </div>
            ) : (
              evidence.map((entry, i) => (
                <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-sm text-white/80 font-medium">{entry.statement}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">Surse:</span>
                    <span className="text-xs text-purple-400">{entry.sources.join(', ')}</span>
                  </div>
                </div>
              ))
            )
          )}
          {activeTab === 'options' && (
            options.map((option, i) => (
              <div key={i} className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-4 flex gap-3">
                <div className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-indigo-400">→</span>
                </div>
                <p className="text-sm text-white/80">{option}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Patient Clarity Sheet Panel
const PatientViewPanel = ({
  isOpen,
  onClose,
  patientView,
  patientName,
}: {
  isOpen: boolean
  onClose: () => void
  patientView: PatientViewModel | null
  patientName: string
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="w-full max-w-lg rounded-3xl bg-[#0c0c18] border border-white/[0.06] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-300/70 font-medium uppercase tracking-wider">Clarity Sheet</p>
              <h3 className="text-lg font-semibold text-white mt-1">Ce am înțeles azi</h3>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-white/50 mt-2">Pentru: {patientName}</p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {!patientView ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-white/40">Clarity Sheet-ul va fi generat</p>
              <p className="text-xs text-white/30 mt-1">după finalizarea consultației</p>
            </div>
          ) : (
            <>
              <Section title="3 Idei Principale" icon="💡" items={patientView.keyIdeas} />
              <Section title="Pașii Următori" icon="📋" items={patientView.nextSteps} />
              <Section title="De Urmărit Acasă" icon="👁" items={patientView.watchAtHome} />
              <Section title="Întrebări Frecvente" icon="❓" items={patientView.faqs} />
            </>
          )}
        </div>

        {/* Footer */}
        {patientView && (
          <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
            <button className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium text-white/70 transition-colors">
              Descarcă PDF
            </button>
            <button className="flex-1 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-sm font-medium text-purple-300 transition-colors">
              Trimite link
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const Section = ({ title, icon, items }: { title: string; icon: string; items: string[] }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <span>{icon}</span>
      <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{title}</span>
    </div>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          <p className="text-sm text-white/80">{item}</p>
        </div>
      ))}
    </div>
  </div>
)

// Action Button Component
const ActionButton = ({
  onClick,
  disabled,
  variant = 'default',
  children,
  icon,
}: {
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'danger'
  children: React.ReactNode
  icon?: React.ReactNode
}) => {
  const variants = {
    default: 'bg-white/5 hover:bg-white/10 text-white/80 border-white/[0.06]',
    primary: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/30',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:pointer-events-none ${variants[variant]}`}
    >
      {icon}
      {children}
    </button>
  )
}

export default function ConsultationWorkspace() {
  const { appointmentId = '' } = useParams()
  const navigate = useNavigate()
  const [context, setContext] = useState<ConsultationContext | null>(null)
  const [draft, setDraft] = useState<ConsultationDraft>({
    notes: '',
    tags: [],
    findings: [],
    attachments: [],
    plan: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isListening, setIsListening] = useState(true) // Start listening by default
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([])
  const [detectedTopics, setDetectedTopics] = useState<string[]>([])
  const [showZenLinkPanel, setShowZenLinkPanel] = useState(false)
  const [showPatientView, setShowPatientView] = useState(false)
  const [activeZenLinkTab, setActiveZenLinkTab] = useState<'summary' | 'gaps' | 'evidence' | 'options'>('summary')
  const [patientView, setPatientView] = useState<PatientViewModel | null>(null)
  const [isConsultClosed, setIsConsultClosed] = useState(false)

  const apiBase = 'http://localhost:8080'

  // Live transcription will be implemented with real speech-to-text API
  // Currently non-functional - placeholder for future implementation

  useEffect(() => {
    if (!appointmentId) return
    setIsLoading(true)
    setError(null)
    setIsHydrated(false)

    fetch(`${apiBase}/api/appointments/${appointmentId}/consultation-context`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Nu am putut încărca contextul consultației.')
        }
        return res.json()
      })
      .then((data: ConsultationContext) => {
        setContext(data)
        if (data.existingDraft) {
          setDraft({
            notes: data.existingDraft.notes || '',
            tags: data.existingDraft.tags || [],
            findings: data.existingDraft.findings || [],
            attachments: data.existingDraft.attachments || [],
            plan: data.existingDraft.plan || '',
          })
        }
        setIsHydrated(true)
      })
      .catch((err) => {
        setError(err.message || 'Eroare la încărcare.')
      })
      .finally(() => setIsLoading(false))
  }, [appointmentId])

  // Auto-save draft
  useEffect(() => {
    if (!appointmentId || !isHydrated || isConsultClosed) return
    
    const timer = setTimeout(() => {
      fetch(`${apiBase}/api/appointments/${appointmentId}/consultation-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          notes: transcriptEntries.map((e) => e.text).join('\n'),
          tags: detectedTopics,
        }),
      }).catch(() => {})
    }, 2500)

    return () => clearTimeout(timer)
  }, [appointmentId, draft, transcriptEntries, detectedTopics, isHydrated, isConsultClosed])

  const generatePatientView = useCallback(() => {
    const keyIdeas = [
      detectedTopics.length
        ? `Simptome identificate: ${detectedTopics.join(', ')}`
        : 'Consultația a fost documentată.',
      'Examinare clinică completă efectuată.',
      'Plan de tratament stabilit.',
    ]
    const nextSteps = [
      'Urmați recomandările medicului.',
      'Programați control dacă este necesar.',
    ]
    const watchAtHome = [
      'Monitorizați durerea și sensibilitatea.',
      'Contactați clinica pentru simptome noi.',
    ]
    const faqs = [
      'Când revin? Conform indicațiilor.',
      'Ce fac dacă simptomele persistă? Contactați clinica.',
    ]
    setPatientView({ keyIdeas, nextSteps, watchAtHome, faqs })
    setShowPatientView(true)
  }, [detectedTopics])

  const handleCloseConsult = useCallback(() => {
    setIsConsultClosed(true)
    setIsListening(false)
  }, [])

  const timelineEvents = useMemo(() => context?.timeline || [], [context])

  // ZenLink analysis data
  const zenlinkSummary = useMemo(() => {
    if (transcriptEntries.length === 0) return ['Consultația este în curs...']
    return transcriptEntries.slice(-5).map((e) => e.text)
  }, [transcriptEntries])

  const zenlinkGaps = useMemo(() => {
    const gaps: string[] = []
    if (transcriptEntries.length < 3) gaps.push('Conversație încă în desfășurare')
    if (!detectedTopics.includes('Durere') && transcriptEntries.some((e) => e.text.toLowerCase().includes('durere')))
      gaps.push('Întrebați despre intensitatea durerii (1-10)')
    if (transcriptEntries.length > 0 && !transcriptEntries.some((e) => e.text.includes('medicament')))
      gaps.push('Nu s-a discutat despre medicație curentă')
    return gaps
  }, [transcriptEntries, detectedTopics])

  const zenlinkEvidence = useMemo(() => {
    const evidence: Array<{ statement: string; sources: string[] }> = []
    if (detectedTopics.length) {
      evidence.push({
        statement: `Simptome detectate: ${detectedTopics.join(', ')}`,
        sources: ['Transcriere automată'],
      })
    }
    return evidence
  }, [detectedTopics])

  const zenlinkOptions = useMemo(() => {
    const options: string[] = []
    if (detectedTopics.includes('Durere')) {
      options.push('Verifică tipul și durata durerii')
    }
    if (detectedTopics.includes('Sensibilitate')) {
      options.push('Test de sensibilitate termică recomandat')
    }
    if (options.length === 0) {
      options.push('Continuați consultația pentru mai multe opțiuni')
    }
    return options
  }, [detectedTopics])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          <p className="text-sm text-white/50">Se încarcă consultația...</p>
        </div>
      </div>
    )
  }

  if (error || !context) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400">{error || 'Consultația nu este disponibilă.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            ← Înapoi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      {/* Listening Indicator */}
      <ListeningIndicator isListening={isListening && !isConsultClosed} />

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">
                Consultație #{appointmentId}
              </p>
              <h1 className="text-2xl font-semibold text-white">Consultation Workspace</h1>
            </div>
            
            {/* Actions - Smart placement in header */}
            <div className="flex items-center gap-3">
              <ActionButton
                onClick={() => setShowZenLinkPanel(true)}
                disabled={isConsultClosed}
                variant="primary"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Verifică (ZenLink)
              </ActionButton>
              <ActionButton
                onClick={generatePatientView}
                disabled={isConsultClosed}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Clarity Sheet
              </ActionButton>
              <ActionButton
                onClick={handleCloseConsult}
                disabled={isConsultClosed}
                variant="danger"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              >
                {isConsultClosed ? 'Închis' : 'Închide'}
              </ActionButton>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <PatientIdentityCard
                patient={context.patient}
                internalPatientKey={context.internalPatientKey}
              />
              <TimelinePanel events={timelineEvents} />
            </div>

            {/* Main Area */}
            <div className="col-span-12 lg:col-span-9">
              <ConsultationArea
                isListening={isListening && !isConsultClosed}
                detectedTopics={detectedTopics}
                isConsultClosed={isConsultClosed}
              />

              {/* Consultation Status Card */}
              {isConsultClosed && (
                <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Consultație finalizată</h3>
                  <p className="text-sm text-white/50 mt-1">
                    Toate datele au fost salvate. Puteți genera Clarity Sheet-ul.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transcription Panel (Bottom) */}
      <TranscriptionPanel
        entries={transcriptEntries}
        isVisible={isListening && !isConsultClosed}
      />

      {/* ZenLink Clarity Panel (Right Slide) */}
      <ClarityPanel
        isOpen={showZenLinkPanel}
        onClose={() => setShowZenLinkPanel(false)}
        activeTab={activeZenLinkTab}
        onTabChange={setActiveZenLinkTab}
        summary={zenlinkSummary}
        gaps={zenlinkGaps}
        evidence={zenlinkEvidence}
        options={zenlinkOptions}
      />

      {/* Patient View Modal */}
      <PatientViewPanel
        isOpen={showPatientView}
        onClose={() => setShowPatientView(false)}
        patientView={patientView}
        patientName={context.patient.displayName}
      />
    </div>
  )
}
