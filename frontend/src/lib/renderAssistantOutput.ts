/**
 * Renders assistant output - handles both JSON and Markdown
 * Prevents raw JSON from being displayed
 */

import { StructureOutput, AnalyzeOutput } from '../types/consultation'
import { renderMarkdown } from './markdown'

export function renderAssistantOutput(
  content: string,
  outputType?: 'structure' | 'analyze' | 'message',
  outputData?: StructureOutput | AnalyzeOutput
): { type: 'markdown' | 'json'; content: string; data?: StructureOutput | AnalyzeOutput } {
  // If we have typed output data, use it
  if (outputData && outputType) {
    return {
      type: 'json',
      content: '',
      data: outputData,
    }
  }

  // Try to parse as JSON
  try {
    // Check if content looks like JSON (starts with { and ends with })
    const trimmed = content.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      
      // If it's a structure output (backend format: type="structured_notes", content={...})
      if (parsed.type === 'structured_notes' || parsed.type === 'zenlink_structure' || parsed.type === 'structure') {
        // Backend returns { type: "structured_notes", content: { chief_complaint, history, ... } }
        const content = parsed.content || {}
        const structureData: StructureOutput = {
          chiefConcern: content.chief_complaint || content.chiefConcern || '',
          history: Array.isArray(content.history) 
            ? content.history.join('\n') 
            : (content.history || ''),
          symptoms: content.symptoms || [],
          medicalContext: content.meds_allergies ? (Array.isArray(content.meds_allergies) ? content.meds_allergies.join(', ') : content.meds_allergies) : (content.medicalContext || ''),
          examination: Array.isArray(content.exam_observations)
            ? content.exam_observations.join('\n')
            : (content.exam_observations || content.examination || ''),
          openItems: content.documentation_gaps?.map((gap: any) => 
            `${gap.label || ''}: ${Array.isArray(gap.items) ? gap.items.join(', ') : ''}`
          ) || content.openItems || [],
          draftNote: content.patient_words ? (Array.isArray(content.patient_words) ? content.patient_words.join(' ') : content.patient_words) : (content.draftNote || ''),
          sections: [],
        }
        console.log('Parsed structure data:', structureData)
        return {
          type: 'json',
          content: '',
          data: structureData,
        }
      }
      
      // If it's an analyze output (backend format: type="zenlink_analyze", structured={...}, clarifications=[...], etc.)
      if (parsed.type === 'zenlink_analyze' || parsed.type === 'analyze') {
        const structured = parsed.structured || parsed.structure || {}
        const structureData: StructureOutput = {
          chiefConcern: structured.chief_complaint || structured.chiefConcern,
          history: Array.isArray(structured.history) 
            ? structured.history.join('\n') 
            : (structured.history || ''),
          symptoms: structured.symptoms || [],
          medicalContext: structured.meds_allergies?.join(', ') || structured.medicalContext,
          examination: Array.isArray(structured.exam_observations)
            ? structured.exam_observations.join('\n')
            : (structured.exam_observations || structured.examination || ''),
          openItems: parsed.documentation_gaps?.map((gap: any) => 
            `${gap.label || ''}: ${Array.isArray(gap.items) ? gap.items.join(', ') : ''}`
          ) || [],
          draftNote: structured.patient_words?.join(' ') || structured.draftNote,
          sections: [],
        }

        // Map clarifications to clinician prompts
        const clinicianPrompts = parsed.clarifications?.map((c: any) => ({
          question: c.title || '',
          rationale: Array.isArray(c.items) ? c.items.join(' ') : '',
        })) || parsed.suggested_questions?.map((q: string) => ({
          question: q,
          rationale: undefined,
        })) || []

        // Map sources to evidence
        const evidence = parsed.sources?.map((s: any) => ({
          title: s.title || '',
          year: s.year ? parseInt(s.year) : undefined,
          url: s.url,
          placeholder: !s.url,
        })) || []

        const analyzeData: AnalyzeOutput = {
          structure: structureData,
          clinicianPrompts,
          possibleDirections: [], // Not in backend response yet
          evidence,
          redFlags: [], // Not in backend response yet
          suggestedChecks: [], // Not in backend response yet
        }
        return {
          type: 'json',
          content: '',
          data: analyzeData,
        }
      }
      
      // If it's markdown wrapped in JSON
      if (parsed.content_markdown || parsed.markdown || parsed.content) {
        const markdown = parsed.content_markdown || parsed.markdown || parsed.content
        return {
          type: 'markdown',
          content: renderMarkdown(markdown),
        }
      }
    }
  } catch (e) {
    // Not JSON, treat as markdown
  }

  // Default: render as markdown
  return {
    type: 'markdown',
    content: renderMarkdown(content),
  }
}
