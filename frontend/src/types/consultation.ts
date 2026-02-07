/**
 * Types for Consultation Workspace
 */

export type SessionContext = {
  appointmentId: string
  patient: {
    id: string
    displayName: string
    age?: number
    reason: string
  }
  internalPatientKey: string
  timeline: Array<{ at: string; label: string; refId?: string }>
  existingDraft?: any
  messages?: Array<{
    id: number
    role: string
    content: string
    outputType?: string
    createdAt: string
  }>
  segments?: Array<{
    id: number
    text: string
    startTs: number
    endTs?: number
    speaker?: string
    createdAt: string
  }>
}

export type Segment = {
  id: string
  timestamp: Date
  source: 'voice' | 'typed'
  text: string
  editedText?: string
  status: 'draft' | 'finalized'
  startedAt: Date
  endedAt?: Date
}

export type Message = {
  id: string
  role: 'doctor' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isTyping?: boolean
  outputType?: 'structure' | 'analyze' | 'message'
  outputData?: StructureResponse | AnalyzeResponse
}

// New structured response types matching backend schema
export type StructureResponse = {
  mode: 'structure'
  title: string
  summary: string // 2-3 lines
  sections: Array<{
    heading: string // e.g. "Chief complaint", "History", "Symptoms", "Allergies"
    bullets: string[]
    tags?: string[] // highlighted chips
  }>
  timeline?: Array<{ when: string; what: string }>
  missingInfo?: string[] // "clarify pain duration", "confirm trauma timing"
  safetyNote: string // short disclaimer
}

// New StructuredNote schema (exact match with backend)
export type StructuredNote = {
  requestId?: string
  title: string
  language: 'ro' | 'en'
  chiefComplaint: string
  symptoms: string[]
  timeline: string[]
  triggers: string[]
  riskFactors: string[]
  dentalHistory: string[]
  meds: string[]
  allergies: string[]
  observations: string[]
  missingInfo?: string[]
  disclaimer: string
}

export type AnalyzeResponse = {
  mode: 'analyze'
  title: string
  summary: string
  structured?: StructureResponse // embed structured content (legacy)
  insights?: Array<{
    heading: string // "Clarifying questions", "Possible factors (informational)", "Gaps", "Next steps for documentation"
    bullets: string[]
  }>
  suggestedQuestions?: Array<{
    question: string
    options?: string[] // quick-select chips
  }>
  citations?: Array<{
    label: string // e.g. "ADA guideline on dental trauma"
    url: string
    note?: string // 1-liner why relevant
  }>
  safetyNote: string
  // New ZenLink Insights format fields
  aspectsToConsider?: string[]
  usefulClarificationQuestions?: string[]
  possibleGeneralExplanations?: string[]
  observedRiskFactors?: string[]
  informativeReferences?: string[]
}

// Legacy types (kept for backward compatibility)
export type StructureOutput = {
  chiefConcern?: string
  history?: string
  symptoms?: string[]
  medicalContext?: string
  examination?: string
  openItems?: string[]
  draftNote?: string
  sections?: Array<{ title: string; content: string | string[] }>
}

export type AnalyzeOutput = {
  // Everything from StructureOutput
  structure: StructureOutput
  // Additional analyze-specific content
  clinicianPrompts?: Array<{ question: string; rationale?: string }>
  possibleDirections?: Array<{ area: string; note: string }>
  evidence?: Array<{ title: string; year?: number; url?: string; placeholder?: boolean }>
  redFlags?: string[]
  suggestedChecks?: string[]
}

export type PatientContext = {
  name: string
  age?: number
  reason?: string
  allergies?: string
  conditions?: string
  medications?: string
}
