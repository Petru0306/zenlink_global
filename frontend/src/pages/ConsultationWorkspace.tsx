import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WebSpeechTranscriptionProvider } from '../lib/transcription/WebSpeechTranscriptionProvider'
import { Mic, Pause, CheckCircle2, FileText, X, Send, Loader2, Download } from 'lucide-react'
import { renderMarkdown } from '../lib/markdown'
// Removed triage UI imports - Consultation Workspace uses doctor copilot only

// Types
type ConsultationContext = {
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
}

type Message = {
  id: string
  role: 'doctor' | 'assistant' | 'draft'
  content: string
  timestamp: Date
  isTyping?: boolean
  copilotData?: {
    type: 'doctor_copilot'
    title?: string
    language?: string
    segments_used?: number
    suggested_actions?: Array<{ id: string; label: string; icon: string }>
  }
}

type Segment = {
  id: string
  startedAt: Date
  endedAt?: Date
  text: string
}

type PatientContext = {
  name: string
  age?: number
  reason?: string
  allergies?: string
  conditions?: string
  medications?: string
}

export default function ConsultationWorkspace() {
  const { appointmentId = '' } = useParams()
  const navigate = useNavigate()
  const apiBase = 'http://localhost:8080'
  
  // State
  const [context, setContext] = useState<ConsultationContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Transcription
  const [transcriptionProvider, setTranscriptionProvider] = useState<WebSpeechTranscriptionProvider | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [currentDraft, setCurrentDraft] = useState('')
  const [languageMode, setLanguageMode] = useState<'auto' | 'ro' | 'en'>('auto')
  const [transcriptionSupported, setTranscriptionSupported] = useState(true)
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'listening' | 'paused' | 'error'>('idle')
  const [recordingError, setRecordingError] = useState<string | null>(null)
  
  // Segments and transcript
  const [segments, setSegments] = useState<Segment[]>([])
  const [fullTranscript, setFullTranscript] = useState('')
  const [rollingSummary, setRollingSummary] = useState('')
  
  // Ref to access current segments synchronously
  const segmentsRef = useRef<Segment[]>([])
  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])
  
  // Ref to store handleAnalyze to avoid circular dependency
  const handleAnalyzeRef = useRef<(() => Promise<void>) | null>(null)
  
  // Messages (ChatGPT-like conversation)
  const [messages, setMessages] = useState<Message[]>([])
  const [manualInput, setManualInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null)
  
  // Patient context
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null)
  
  // Final outputs
  const [claritySheet, setClaritySheet] = useState<any>(null)
  const [doctorSummary, setDoctorSummary] = useState<any>(null)
  const [showClaritySheet, setShowClaritySheet] = useState(false)
  const [activeSheetTab, setActiveSheetTab] = useState<'patient' | 'doctor'>('patient')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentDraft])

  // Initialize transcription provider - only once
  useEffect(() => {
    const provider = new WebSpeechTranscriptionProvider()
    if (!provider.isSupported()) {
      setTranscriptionSupported(false)
      return
    }
    
    provider.onPartial((text) => {
      setCurrentDraft(text)
    })
    
    provider.onFinal((text) => {
      // Update segment with final text - use functional update to get latest state
      if (text.trim()) {
        setSegments(prev => {
          // Get current segment ID from the most recent segment
          const latestSegment = prev[prev.length - 1]
          if (!latestSegment || !latestSegment.text) {
            // If no segment or empty, try to find by checking if we're recording
            return prev
          }
          
          // Update the latest segment (should be the current one)
          return prev.map((seg, index) => 
            index === prev.length - 1 && seg.text !== undefined
              ? { ...seg, text: (seg.text ? seg.text + ' ' : '') + text.trim() }
              : seg
          )
        })
      }
    })
    
    provider.onError((error) => {
      console.error('Transcription error:', error)
      setIsRecording(false)
      setRecordingStatus('error')
      setRecordingError(error.message)
    })
    
    setTranscriptionProvider(provider)
    
    return () => {
      provider.stop()
    }
  }, []) // Initialize only once
  
  // Update full transcript when segments change
  useEffect(() => {
    const allText = segments
      .filter(s => s.text.trim())
      .map(s => s.text)
      .join(' ')
    setFullTranscript(allText)
  }, [segments])

  // Load consultation context
  useEffect(() => {
    if (!appointmentId) return
    setIsLoading(true)
    setError(null)

    fetch(`${apiBase}/api/appointments/${appointmentId}/consultation-context`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Nu am putut încărca contextul consultației.')
        }
        return res.json()
      })
      .then((data: ConsultationContext) => {
        setContext(data)
        
        // Build patient context
        const pc: PatientContext = {
          name: data.patient.displayName,
          age: data.patient.age,
          reason: data.patient.reason,
        }
        setPatientContext(pc)
      })
      .catch((err) => {
        setError(err.message || 'Eroare la încărcare.')
      })
      .finally(() => setIsLoading(false))
  }, [appointmentId])

  // Start recording
  const handleStartRecording = useCallback(async () => {
    if (!transcriptionProvider) {
      alert('Speech recognition not supported. Please type notes.')
      return
    }
    
    // If already recording, don't start again
    if (isRecording) {
      console.log('Already recording, skipping start')
      return
    }
    
    let segmentId: string | null = null
    
    try {
      setRecordingError(null)
      setRecordingStatus('listening')
      
      // Create new segment first
      segmentId = `seg-${Date.now()}`
      const newSegment: Segment = {
        id: segmentId,
        startedAt: new Date(),
        text: '',
      }
      setSegments(prev => [...prev, newSegment])
      setCurrentDraft('') // Clear any previous draft
      
      // Start recognition
      await transcriptionProvider.start()
      setIsRecording(true)
      
      console.log('Recording started, segment:', segmentId)
    } catch (error: any) {
      console.error('Failed to start recording:', error)
      setRecordingStatus('error')
      const errorMsg = error.message || 'Failed to start recording'
      setRecordingError(errorMsg.includes('not-allowed') || errorMsg.includes('denied') 
        ? 'Error: mic access denied' 
        : errorMsg)
      setIsRecording(false)
      // Remove the segment we just created
      if (segmentId) {
        setSegments(prev => prev.filter(seg => seg.id !== segmentId))
      }
    }
  }, [transcriptionProvider, isRecording])

  // Pause recording with flush
  const handlePause = useCallback(async (autoAnalyze: boolean = false) => {
    if (!transcriptionProvider) return
    
    setRecordingStatus('paused')
    setIsRecording(false)
    
    // Get current draft before flushing
    const draftText = currentDraft
    
    // Flush and get all accumulated text from provider
    const flushedText = await transcriptionProvider.flushAndStop()
    
    // Calculate finalText using CURRENT segments state (from ref for synchronous access)
    const currentSegments = segmentsRef.current
    let finalText = ''
    let segmentId: string | null = null
    
    if (currentSegments.length === 0) {
      // If no segments, but we have text, create one
      if (flushedText.trim() || draftText.trim()) {
        finalText = (flushedText + ' ' + draftText).trim()
        if (finalText) {
          segmentId = `seg-${Date.now()}`
          const newSegment: Segment = {
            id: segmentId,
            startedAt: new Date(),
            endedAt: new Date(),
            text: finalText,
          }
          setSegments([newSegment])
        }
      }
    } else {
      // Combine existing text, flushed text, and current draft
      const latestSegment = currentSegments[currentSegments.length - 1]
      if (latestSegment) {
        segmentId = latestSegment.id
        const existingText = latestSegment.text || ''
        finalText = (existingText + ' ' + flushedText + ' ' + draftText).trim()
        
        if (finalText) {
          // Update the latest segment
          setSegments(prev => prev.map((seg, index) => 
            index === prev.length - 1
              ? { ...seg, text: finalText, endedAt: new Date() }
              : seg
          ))
        } else {
          // Empty segment - remove it
          setSegments(prev => prev.filter((_, index) => index !== prev.length - 1))
        }
      }
    }
    
    // Add the transcribed text as a doctor message in the conversation
    // NOW we can use finalText directly since we calculated it BEFORE setSegments
    if (finalText && finalText.trim()) {
      const doctorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'doctor',
        content: finalText,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, doctorMessage])
      console.log('✅ Added doctor message:', finalText.substring(0, 50) + '...')
      
      // If autoAnalyze is true, automatically send to AI
      if (autoAnalyze && appointmentId && patientContext && handleAnalyzeRef.current) {
        setTimeout(async () => {
          await handleAnalyzeRef.current?.()
        }, 300)
      }
    } else {
      console.log('⚠️ No text. flushedText length:', flushedText.length, 'draftText length:', draftText.length)
    }
    
    setCurrentDraft('')
    setRecordingStatus('idle')
  }, [transcriptionProvider, currentDraft, appointmentId, patientContext])

  // Verifică (ZenLink) - Analyze segment
  const handleAnalyze = useCallback(async () => {
    if (!appointmentId || !patientContext) {
      console.error('Missing appointmentId or patientContext')
      return
    }
    
    // Guard against double clicks
    if (isAnalyzing) {
      console.log('Already analyzing, ignoring click')
      return
    }
    
    setIsAnalyzing(true)
    
    try {
      // If recording, pause and flush first - wait for completion
      if (isRecording) {
        await handlePause(false)
        // Wait a bit for state to settle
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // Get the last doctor message from conversation (most recent transcribed text)
      let segmentText = ''
      let lastSegments: string[] = []
      
      // Use functional update to get latest messages
      setMessages(prev => {
        const doctorMessages = prev.filter(m => m.role === 'doctor').map(m => m.content)
        if (doctorMessages.length > 0) {
          segmentText = doctorMessages[doctorMessages.length - 1]
          // Get last 3 excluding current
          lastSegments = doctorMessages.slice(0, -1).slice(-3)
        }
        return prev
      })
      
      // If no message found, try to get from segments
      if (!segmentText) {
        const currentSegments = segmentsRef.current
        const segmentsWithText = currentSegments.filter(s => s.text && typeof s.text === 'string' && s.text.trim().length > 0) as Segment[]
        const lastSegment = segmentsWithText[segmentsWithText.length - 1]
        if (lastSegment) {
          segmentText = lastSegment.text
          // Get last 3 segments for context
          const otherSegments = segmentsWithText.slice(0, -1).slice(-3)
          lastSegments = otherSegments.map(s => s.text)
        }
      }
      
      if (!segmentText || !segmentText.trim()) {
        alert('Nu există text de analizat. Încearcă să înregistrezi ceva mai întâi.')
        setIsAnalyzing(false)
        return
      }
      
      const requestBody = {
        patientContext: patientContext,
        lastSegments: lastSegments,
        lastSegment: segmentText,
        rollingSummary: rollingSummary,
      }
      
      console.log('Sending analyze request to:', `${apiBase}/api/appointments/${appointmentId}/segment-analyze`)
      console.log('Request body:', requestBody)
      
      const response = await fetch(`${apiBase}/api/appointments/${appointmentId}/segment-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Analyze error:', response.status, errorText)
        throw new Error(`Failed to analyze: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Analyze response:', data)
      
      // Update rolling summary
      if (data.updatedRollingSummary) {
        setRollingSummary(data.updatedRollingSummary)
      }
      
      // Parse doctor copilot response - NEVER show question mode
      let finalContent = data.assistantMarkdown || data.assistantResponse || 'Analiză completă.'
      let copilotData = null
      
      // Check if response is already in doctor_copilot format
      if (data.type === 'doctor_copilot' && data.content_markdown) {
        finalContent = data.content_markdown
        copilotData = {
          type: 'doctor_copilot' as const,
          title: data.title,
          language: data.language,
          segments_used: data.segments_used,
          suggested_actions: data.suggested_actions || [],
        }
      } else {
        // Try to parse as JSON if it's a string
        try {
          const responseText = data.assistantMarkdown || data.assistantResponse || ''
          const parsed = typeof responseText === 'string' ? JSON.parse(responseText) : responseText
          
          // REJECT old question/urgent/conclusion mode formats - convert to doctor_copilot
          if (parsed && (parsed.mode === 'question' || parsed.mode === 'urgent' || parsed.mode === 'conclusion')) {
            console.warn('Received old format (mode:', parsed.mode, '), converting to doctor_copilot format.')
            
            // Convert to markdown based on format
            let markdown = ''
            
            if (parsed.mode === 'urgent' || parsed.mode === 'conclusion') {
              const conclusion = parsed.conclusion
              if (conclusion) {
                if (conclusion.summary) {
                  markdown += `## ✅ Rezumat\n\n${conclusion.summary}\n\n`
                }
                
                if (conclusion.probabilities && Array.isArray(conclusion.probabilities)) {
                  markdown += `## 🧠 Posibile cauze (orientativ)\n\n`
                  conclusion.probabilities.forEach((prob: any) => {
                    markdown += `1. **${prob.label || 'Cauză'}** (probabilitate ~${prob.percent || '?'}%)`
                    if (prob.note) {
                      markdown += `: ${prob.note}`
                    }
                    markdown += `\n`
                  })
                  markdown += `\n`
                }
                
                if (conclusion.nextSteps && Array.isArray(conclusion.nextSteps)) {
                  markdown += `## 🧩 Ce să faci / next steps\n\n`
                  conclusion.nextSteps.forEach((step: any) => {
                    markdown += `- `
                    if (step.title) {
                      markdown += `**${step.title}**: `
                    }
                    if (step.text) {
                      markdown += step.text
                    }
                    markdown += `\n`
                  })
                  markdown += `\n`
                }
                
                if (conclusion.redFlags && Array.isArray(conclusion.redFlags)) {
                  markdown += `## ⚠️ Red flags\n\n`
                  conclusion.redFlags.forEach((flag: string) => {
                    markdown += `- ${flag}\n`
                  })
                  markdown += `\n`
                }
              }
            } else if (parsed.mode === 'question') {
              markdown = `## 📋 Analiză segment\n\n` +
                `**Problema:** ${parsed.title || 'Durere de măsea'}\n\n` +
                `**Întrebare recomandată:** ${parsed.question || 'N/A'}\n\n` +
                `**Rationament:** ${parsed.rationale || 'N/A'}\n\n` +
                `⚠️ **Notă:** Formatul vechi de întrebare a fost detectat. Te rugăm să folosești acțiunile de mai jos pentru detalii.`
            }
            
            finalContent = markdown
            copilotData = {
              type: 'doctor_copilot' as const,
              title: parsed.title || 'Analiză segment',
              language: 'ro',
              segments_used: 1,
              suggested_actions: [
                { id: 'followup_questions', label: 'Întrebări de clarificare', icon: 'help-circle' },
                { id: 'differential', label: 'Posibile cauze', icon: 'stethoscope' },
                { id: 'red_flags', label: 'Red flags', icon: 'alert-triangle' },
                { id: 'research', label: 'Research rapid (surse)', icon: 'book-open' },
              ],
            }
          } else if (parsed && parsed.type === 'doctor_copilot' && parsed.content_markdown) {
            finalContent = parsed.content_markdown
            copilotData = {
              type: 'doctor_copilot' as const,
              title: parsed.title,
              language: parsed.language,
              segments_used: parsed.segments_used,
              suggested_actions: parsed.suggested_actions || [],
            }
          }
        } catch (e) {
          // Not JSON, use as-is (markdown)
          console.log('Response is not JSON, using as markdown')
        }
      }
      
      // Add assistant message - always render as markdown, never triage UI
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: finalContent,
        timestamp: new Date(),
        copilotData: copilotData || undefined,
      }
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error: any) {
      console.error('Error analyzing segment:', error)
      // Add error message to chat
      const errorMessage: Message = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: 'Eroare la analiză: ' + (error.message || 'Unknown error'),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAnalyzing(false)
    }
  }, [appointmentId, patientContext, rollingSummary, isRecording, handlePause])
  
  // Store handleAnalyze in ref to avoid circular dependency
  useEffect(() => {
    handleAnalyzeRef.current = handleAnalyze
  }, [handleAnalyze])

  // Finalize consultation
  const handleFinalize = useCallback(async () => {
    if (!appointmentId || !patientContext) {
      alert('Lipsește appointmentId sau patientContext.')
      return
    }
    
    // Stop recording if active
    if (isRecording) {
      await handlePause(false)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    setIsFinalizing(true)
    
    try {
      // Get all segments with text - use ref for synchronous access
      const currentSegments = segmentsRef.current
      const allSegmentsWithText = currentSegments.filter(s => s.text && s.text.trim())
      
      // Also check messages for text
      const doctorMessages = messages.filter(m => m.role === 'doctor').map(m => m.content)
      const hasText = allSegmentsWithText.length > 0 || doctorMessages.length > 0
      
      if (!hasText) {
        alert('Nu există date de finalizat. Încearcă să înregistrezi ceva mai întâi.')
        setIsFinalizing(false)
        return
      }
      
      // Build full transcript from segments OR messages
      let completeTranscript = ''
      if (allSegmentsWithText.length > 0) {
        completeTranscript = allSegmentsWithText.map(s => s.text).join(' ')
      } else if (doctorMessages.length > 0) {
        completeTranscript = doctorMessages.join(' ')
      }
      
      const requestBody = {
        patientContext: patientContext,
        fullTranscript: completeTranscript,
        segments: allSegmentsWithText.map(s => ({
          id: s.id,
          startedAt: s.startedAt.toISOString(),
          endedAt: s.endedAt?.toISOString() || new Date().toISOString(),
          text: s.text,
        })),
      }
      
      console.log('Sending finalize request:', requestBody)
      
      const response = await fetch(`${apiBase}/api/appointments/${appointmentId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Finalize error:', response.status, errorText)
        throw new Error(`Failed to finalize: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Finalize response:', data)
      
      setClaritySheet(data.patientClaritySheet)
      setDoctorSummary(data.doctorSummary)
      setShowClaritySheet(true)
      setActiveSheetTab('patient')
      
      // Add finalization message
      const finalMessage: Message = {
        id: `msg-final-${Date.now()}`,
        role: 'assistant',
        content: '✅ Consultație finalizată! Clarity Sheet-urile au fost generate.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, finalMessage])
      
    } catch (error: any) {
      console.error('Error finalizing:', error)
      alert('Eroare la finalizare: ' + (error.message || 'Unknown error'))
    } finally {
      setIsFinalizing(false)
    }
  }, [appointmentId, patientContext, isRecording, handlePause])

  // Handle copilot action
  const handleCopilotAction = useCallback(async (actionId: string) => {
    if (!appointmentId || !patientContext || isActionLoading) return
    
    setIsActionLoading(actionId)
    
    try {
      // Get context
      const currentSegments = segmentsRef.current
      const segmentsWithText = currentSegments.filter(s => s.text && s.text.trim())
      const lastSegments = segmentsWithText.slice(-3).map(s => s.text)
      
      const requestBody = {
        actionId,
        patientContext: patientContext,
        lastSegments: lastSegments,
        rollingSummary: rollingSummary,
      }
      
      console.log('Sending copilot action request to:', `${apiBase}/api/appointments/${appointmentId}/copilot-action`)
      console.log('Request body:', requestBody)
      
      const response = await fetch(`${apiBase}/api/appointments/${appointmentId}/copilot-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      
      console.log('Copilot action response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Copilot action error:', response.status, errorText)
        throw new Error(`Failed to execute action: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Copilot action response data:', data)
      
      // Parse response
      let finalContent = data.content_markdown || data.assistantMarkdown || data.assistantResponse || 'Răspuns generat.'
      let copilotData = null
      
      if (data.type === 'doctor_copilot' && data.content_markdown) {
        finalContent = data.content_markdown
        copilotData = {
          type: 'doctor_copilot' as const,
          title: data.title,
          language: data.language,
          segments_used: data.segments_used,
          suggested_actions: data.suggested_actions || [],
        }
      }
      
      // Add assistant message
      const assistantMessage: Message = {
        id: `msg-action-${Date.now()}`,
        role: 'assistant',
        content: finalContent,
        timestamp: new Date(),
        copilotData: copilotData || undefined,
      }
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error: any) {
      console.error('Error executing copilot action:', error)
      const errorMessage: Message = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: 'Eroare la executarea acțiunii: ' + (error.message || 'Unknown error'),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsActionLoading(null)
    }
  }, [appointmentId, patientContext, rollingSummary, isActionLoading])
  
  // Send manual message to copilot
  const handleSendMessage = useCallback(async () => {
    if (!manualInput.trim() || isSendingMessage || !appointmentId || !patientContext) return
    
    const doctorMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'doctor',
      content: manualInput,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, doctorMessage])
    const userInput = manualInput
    setManualInput('')
    setIsSendingMessage(true)
    
    try {
      // Get context
      const currentSegments = segmentsRef.current
      const segmentsWithText = currentSegments.filter(s => s.text && s.text.trim())
      const lastSegments = segmentsWithText.slice(-3).map(s => s.text)
      
      const requestBody = {
        userMessage: userInput,
        patientContext: patientContext,
        lastSegments: lastSegments,
        rollingSummary: rollingSummary,
      }
      
      const response = await fetch(`${apiBase}/api/appointments/${appointmentId}/copilot-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Parse response
      let finalContent = data.content_markdown || data.assistantMarkdown || data.assistantResponse || 'Răspuns generat.'
      let copilotData = null
      
      if (data.type === 'doctor_copilot' && data.content_markdown) {
        finalContent = data.content_markdown
        copilotData = {
          type: 'doctor_copilot' as const,
          title: data.title,
          language: data.language,
          segments_used: data.segments_used,
          suggested_actions: data.suggested_actions || [],
        }
      }
      
      // Add assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: finalContent,
        timestamp: new Date(),
        copilotData: copilotData || undefined,
      }
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error: any) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: 'Eroare la trimiterea mesajului: ' + (error.message || 'Unknown error'),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSendingMessage(false)
    }
  }, [manualInput, isSendingMessage, appointmentId, patientContext, rollingSummary])
  
  // Helper to get icon for action
  const getActionIcon = (iconName: string) => {
    const icons: Record<string, string> = {
      'help-circle': '❓',
      'stethoscope': '🩺',
      'alert-triangle': '⚠️',
      'book-open': '📚',
    }
    return icons[iconName] || '•'
  }

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
            <X className="w-8 h-8 text-red-400" />
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
    <div className="h-screen bg-[#0a0a14] text-white flex flex-col overflow-hidden">
      {/* Header - Sticky */}
      <div className="shrink-0 border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">
                Consultație #{appointmentId}
              </p>
              <h1 className="text-2xl font-semibold text-white">Consultation Workspace</h1>
            </div>
            
            <div className="flex items-center gap-3">
          {/* Language toggle */}
          <select
            value={languageMode}
            onChange={(e) => {
              const mode = e.target.value as 'auto' | 'ro' | 'en'
              setLanguageMode(mode)
              transcriptionProvider?.setLanguage(mode)
            }}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="auto">Auto (RO/EN)</option>
            <option value="ro">Română</option>
            <option value="en">English</option>
          </select>
          
          {/* Recording controls */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={!transcriptionSupported || isAnalyzing || isFinalizing}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              Start Recording
            </button>
          ) : (
            <button
              onClick={() => handlePause(false)}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          
          {/* Verifică button - also pauses if recording */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isFinalizing}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizând...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Verifică (ZenLink)
              </>
            )}
          </button>
          
          {/* Finalize button */}
          <button
            onClick={handleFinalize}
            disabled={segments.length === 0 || isAnalyzing || isFinalizing}
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finalizând...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Finalize
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content - ChatGPT-like conversation */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left sidebar - Patient info */}
        <div className="shrink-0 w-80 border-r border-white/10 p-6 space-y-6 overflow-y-auto">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center">
                <span className="text-lg font-semibold text-purple-200">
                  {context.patient.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{context.patient.displayName}</h3>
                <p className="text-sm text-white/50">{context.patient.age ? `${context.patient.age} ani` : '—'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Motiv</span>
                <span className="text-white/80">{context.patient.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">ID</span>
                <span className="font-mono text-xs text-white/60">{context.internalPatientKey}</span>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Statistici</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Segmente</span>
                <span className="text-white font-semibold">{segments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Mesaje</span>
                <span className="text-white font-semibold">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Transcript</span>
                <span className="text-white font-semibold">{fullTranscript.length} caractere</span>
              </div>
            </div>
          </div>
            </div>

        {/* Center - Conversation area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {messages.length === 0 && !currentDraft && segments.filter(s => s.text && s.text.trim()).length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                  <Mic className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-white/50 text-sm">Apasă "Start Recording" pentru a începe consultația</p>
              </div>
            )}
            
            {messages.map((msg) => {
              // Always render assistant messages as markdown (never triage UI)
              const isAssistant = msg.role === 'assistant'
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'doctor' ? 'justify-end' : 'justify-start'} flex-col`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === 'doctor'
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    {isAssistant ? (
                      <>
                        {msg.copilotData?.title && (
                          <h3 className="text-lg font-semibold text-white mb-3">{msg.copilotData.title}</h3>
                        )}
                        <div 
                          className="markdown-content text-white/90"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                      </>
                    ) : (
                      <p className="text-white/90">{msg.content}</p>
                    )}
                    <p className="text-xs text-white/30 mt-2">
                      {msg.timestamp.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  {/* Copilot actions bar */}
                  {isAssistant && msg.copilotData?.suggested_actions && msg.copilotData.suggested_actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 max-w-[80%]">
                      {msg.copilotData.suggested_actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleCopilotAction(action.id)}
                          disabled={isActionLoading === action.id || isAnalyzing || isSendingMessage}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-sm font-medium text-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isActionLoading === action.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span>{getActionIcon(action.icon)}</span>
                          )}
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* Live draft bubble */}
            {currentDraft && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl p-4 bg-purple-500/10 border border-purple-500/20 border-dashed">
                  <p className="text-white/70 italic">{currentDraft}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                    <p className="text-xs text-white/30">Se transcrie...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Typing indicator */}
            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <p className="text-white/50 text-sm">ZenLink analizează...</p>
                  </div>
                </div>
                </div>
              )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input area - Sticky bottom */}
          <div className="shrink-0 border-t border-white/10 p-4 bg-[#0a0a14]">
            <div className="flex items-end gap-3">
              <div className="flex-1 rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 transition-colors">
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isSendingMessage) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Scrie o întrebare sau mesaj manual..."
                  rows={1}
                  className="w-full bg-transparent px-4 py-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!manualInput.trim() || isSendingMessage}
                className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
              >
                {isSendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Trimite
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recording Status Pill */}
      {(isRecording || recordingStatus !== 'idle') && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-3 rounded-full bg-[#12121f]/90 border px-4 py-2.5 backdrop-blur-xl shadow-lg ${
            recordingStatus === 'error' 
              ? 'border-red-500/30' 
              : recordingStatus === 'paused'
              ? 'border-yellow-500/30'
              : 'border-white/10'
          }`}>
            {recordingStatus === 'listening' && (
              <>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-purple-500 to-indigo-400 rounded-full animate-pulse"
                      style={{
                        height: `${10 + Math.sin(i * 0.8) * 15 + Math.random() * 10}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-emerald-400">Listening…</span>
              </>
            )}
            {recordingStatus === 'paused' && (
              <>
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">Paused</span>
              </>
            )}
            {recordingStatus === 'error' && (
              <>
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-xs font-medium text-red-400">
                  {recordingError || 'Error: mic access denied'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Clarity Sheet Modal */}
      {showClaritySheet && (claritySheet || doctorSummary) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="w-full max-w-3xl rounded-3xl bg-[#0c0c18] border border-white/10 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-300/70 font-medium uppercase tracking-wider">Consultație Finalizată</p>
                  <h3 className="text-lg font-semibold text-white mt-1">
                    {activeSheetTab === 'patient' ? 'Clarity Sheet (Pacient)' : 'Rezumat (Doctor)'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowClaritySheet(false)}
                  className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <p className="text-sm text-white/50 mt-2">Pentru: {context.patient.displayName}</p>
            </div>
            
            {/* Tabs */}
            <div className="px-6 pt-4 border-b border-white/10 flex gap-2">
              <button
                onClick={() => setActiveSheetTab('patient')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeSheetTab === 'patient'
                    ? 'bg-white/10 text-white border-b-2 border-purple-500'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                Clarity Sheet (Pacient)
              </button>
              <button
                onClick={() => setActiveSheetTab('doctor')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeSheetTab === 'doctor'
                    ? 'bg-white/10 text-white border-b-2 border-purple-500'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                Rezumat (Doctor)
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeSheetTab === 'patient' && claritySheet && (
                <>
                  {claritySheet.whatWeDiscussed && (
                    <Section title="Ce am discutat" content={claritySheet.whatWeDiscussed} />
                  )}
                  {claritySheet.whatDoctorFound && (
                    <Section title="Ce a găsit doctorul" content={claritySheet.whatDoctorFound} />
                  )}
                  {claritySheet.plan && claritySheet.plan.length > 0 && (
                    <Section title="Plan / Pașii următori" items={claritySheet.plan} />
                  )}
                  {claritySheet.homeCareInstructions && claritySheet.homeCareInstructions.length > 0 && (
                    <Section title="Îngrijire acasă" items={claritySheet.homeCareInstructions} />
                  )}
                  {claritySheet.whenToSeekUrgentCare && (
                    <Section title="Când să căutați îngrijire urgentă" content={claritySheet.whenToSeekUrgentCare} />
                  )}
                  {claritySheet.followUp && (
                    <Section title="Urmărire / Programare" content={claritySheet.followUp} />
                  )}
                </>
              )}
              
              {activeSheetTab === 'doctor' && doctorSummary && (
                <>
                  {doctorSummary.chiefComplaint && (
                    <Section title="Motivul consultației" content={doctorSummary.chiefComplaint} />
                  )}
                  {doctorSummary.historyOfPresentIllness && (
                    <Section title="Istoricul problemei" content={doctorSummary.historyOfPresentIllness} />
                  )}
                  {doctorSummary.examinationFindings && (
                    <Section title="Constatări la examinare" content={doctorSummary.examinationFindings} />
                  )}
                  {doctorSummary.assessment && (
                    <Section title="Evaluare" content={doctorSummary.assessment} />
                  )}
                  {doctorSummary.plan && (
                    <Section title="Plan" content={doctorSummary.plan} />
                  )}
                  {doctorSummary.clinicalNotes && doctorSummary.clinicalNotes.length > 0 && (
                    <Section title="Note clinice" items={doctorSummary.clinicalNotes} />
                  )}
                </>
              )}
            </div>
            
            {/* Download buttons */}
            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button
                onClick={async () => {
                  const content = activeSheetTab === 'patient' ? claritySheet : doctorSummary
                  const title = activeSheetTab === 'patient' ? 'Clarity Sheet (Pacient)' : 'Rezumat (Doctor)'
                  
                  const html = formatSheetAsHTML(content, activeSheetTab === 'patient')
                  await generatePDF(html, title, context.patient.displayName, appointmentId)
                }}
                className="flex-1 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-sm font-medium text-purple-300 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descarcă PDF {activeSheetTab === 'patient' ? 'Clarity Sheet' : 'Rezumat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Section = ({ title, content, items }: { title: string; content?: string; items?: string[] }) => (
  <div>
    <h4 className="text-sm font-semibold text-white/80 mb-3">{title}</h4>
    {content && <p className="text-sm text-white/70 leading-relaxed">{content}</p>}
    {items && (
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-white/70 flex items-start gap-2">
            <span className="text-purple-400 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
)

// Helper function to generate PDF from HTML content
async function generatePDF(htmlContent: string, title: string, patientName: string, appointmentId: string) {
  // Create a temporary container
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '210mm' // A4 width
  container.style.padding = '20mm'
  container.style.fontFamily = 'Arial, sans-serif'
  container.style.color = '#000'
  container.style.backgroundColor = '#fff'
  container.innerHTML = `
    <div style="margin-bottom: 20px; border-bottom: 2px solid #9333ea; padding-bottom: 15px;">
      <h1 style="color: #9333ea; margin: 0; font-size: 24px;">ZenLink</h1>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">${title}</p>
    </div>
    <div style="margin-bottom: 20px; font-size: 11px; color: #666;">
      <p style="margin: 5px 0;"><strong>Pacient:</strong> ${patientName}</p>
      <p style="margin: 5px 0;"><strong>Consultație ID:</strong> ${appointmentId}</p>
      <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('ro-RO')}</p>
    </div>
    <div style="line-height: 1.6; font-size: 12px;">
      ${htmlContent}
    </div>
  `
  document.body.appendChild(container)
  
  try {
    // Use window.print() approach - simpler and works well
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              @media print {
                @page { margin: 20mm; }
                body { margin: 0; padding: 0; }
              }
              body {
                font-family: Arial, sans-serif;
                color: #000;
                background: #fff;
                padding: 20mm;
                max-width: 210mm;
                margin: 0 auto;
              }
              h1 { color: #9333ea; font-size: 24px; margin: 0 0 10px 0; }
              h2 { color: #9333ea; font-size: 18px; margin: 20px 0 10px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
              h3 { color: #9333ea; font-size: 16px; margin: 15px 0 8px 0; }
              h4 { color: #9333ea; font-size: 14px; margin: 12px 0 6px 0; }
              p { margin: 8px 0; line-height: 1.6; }
              ul, ol { margin: 8px 0; padding-left: 25px; }
              li { margin: 4px 0; line-height: 1.5; }
              .header { border-bottom: 2px solid #9333ea; padding-bottom: 15px; margin-bottom: 20px; }
              .metadata { font-size: 11px; color: #666; margin-bottom: 20px; }
              .content { line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>ZenLink</h1>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">${title}</p>
            </div>
            <div class="metadata">
              <p style="margin: 5px 0;"><strong>Pacient:</strong> ${patientName}</p>
              <p style="margin: 5px 0;"><strong>Consultație ID:</strong> ${appointmentId}</p>
              <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('ro-RO')}</p>
            </div>
            <div class="content">
              ${htmlContent}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.print()
        // After printing, close the window
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 500)
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    alert('Eroare la generarea PDF-ului. Încearcă din nou.')
  } finally {
    document.body.removeChild(container)
  }
}

// Helper function to format sheet as HTML for PDF
function formatSheetAsHTML(sheet: any, isPatient: boolean): string {
  let html = ''
  
  if (isPatient) {
    if (sheet.whatWeDiscussed) {
      html += `<h2>Ce am discutat</h2><p>${escapeHtml(sheet.whatWeDiscussed)}</p>`
    }
    if (sheet.whatDoctorFound) {
      html += `<h2>Ce a găsit doctorul</h2><p>${escapeHtml(sheet.whatDoctorFound)}</p>`
    }
    if (sheet.plan && sheet.plan.length > 0) {
      html += `<h2>Plan / Pașii următori</h2><ul>`
      sheet.plan.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
      html += `</ul>`
    }
    if (sheet.homeCareInstructions && sheet.homeCareInstructions.length > 0) {
      html += `<h2>Îngrijire acasă</h2><ul>`
      sheet.homeCareInstructions.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
      html += `</ul>`
    }
    if (sheet.whenToSeekUrgentCare) {
      html += `<h2>Când să căutați îngrijire urgentă</h2><p>${escapeHtml(sheet.whenToSeekUrgentCare)}</p>`
    }
    if (sheet.followUp) {
      html += `<h2>Urmărire / Programare</h2><p>${escapeHtml(sheet.followUp)}</p>`
    }
  } else {
    if (sheet.chiefComplaint) {
      html += `<h2>Motivul consultației</h2><p>${escapeHtml(sheet.chiefComplaint)}</p>`
    }
    if (sheet.historyOfPresentIllness) {
      html += `<h2>Istoricul problemei</h2><p>${escapeHtml(sheet.historyOfPresentIllness)}</p>`
    }
    if (sheet.examinationFindings) {
      html += `<h2>Constatări la examinare</h2><p>${escapeHtml(sheet.examinationFindings)}</p>`
    }
    if (sheet.assessment) {
      html += `<h2>Evaluare</h2><p>${escapeHtml(sheet.assessment)}</p>`
    }
    if (sheet.plan) {
      html += `<h2>Plan</h2><p>${escapeHtml(sheet.plan)}</p>`
    }
    if (sheet.clinicalNotes && sheet.clinicalNotes.length > 0) {
      html += `<h2>Note clinice</h2><ul>`
      sheet.clinicalNotes.forEach((item: string) => {
        html += `<li>${escapeHtml(item)}</li>`
      })
      html += `</ul>`
    }
  }
  
  return html
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

