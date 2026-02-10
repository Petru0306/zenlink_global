/**
 * Main Consultation Workspace Page - ChatGPT-like interface for doctors
 * Redesigned end-to-end with proper state management and UI
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WebSpeechTranscriptionProvider } from '../lib/transcription/WebSpeechTranscriptionProvider'
import { Mic, FileText, X, Download, Loader2, List, Sparkles, CheckCircle2 } from 'lucide-react'
import ConsultationLayout from '../components/consultation/ConsultationLayout'
import ConversationPanel from '../components/consultation/ConversationPanel'
import Composer from '../components/consultation/Composer'
import { generatePDF, formatSheetAsHTML } from '../lib/pdf/exportClaritySheet'
import { renderAssistantOutput } from '../lib/renderAssistantOutput'
import { psychProfileService, type PsychProfileResponse } from '../services/psychProfileService'
import type {
  SessionContext,
  Segment,
  Message,
  StructureOutput,
  AnalyzeOutput,
  StructureResponse,
  AnalyzeResponse,
  PatientContext,
} from '../types/consultation'

export default function ConsultationWorkspacePage() {
  const { appointmentId = '' } = useParams()
  const navigate = useNavigate()
  const apiBase = 'http://localhost:8080'

  // Disable body/html scroll when component mounts
  useEffect(() => {
    document.body.classList.add('consultation-workspace-active')
    document.documentElement.classList.add('consultation-workspace-active')
    
    return () => {
      document.body.classList.remove('consultation-workspace-active')
      document.documentElement.classList.remove('consultation-workspace-active')
    }
  }, [])

  // Session context (constant after load)
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Transcription
  const [transcriptionProvider, setTranscriptionProvider] = useState<WebSpeechTranscriptionProvider | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcriptionSupported, setTranscriptionSupported] = useState(true)
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'listening' | 'paused' | 'error'>('idle')
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [languageMode, setLanguageMode] = useState<'auto' | 'ro' | 'en'>('auto')

  // State model: segments, fullTranscript, draftText
  const [segments, setSegments] = useState<Segment[]>([])
  const [fullTranscript, setFullTranscript] = useState('')
  const [draftText, setDraftText] = useState('')
  const segmentsRef = useRef<Segment[]>([])

  // Messages (conversation)
  const [messages, setMessages] = useState<Message[]>([])

  // Processing states
  const [isStructuring, setIsStructuring] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  // Final outputs
  const [claritySheet, setClaritySheet] = useState<any>(null)
  const [doctorSummary, setDoctorSummary] = useState<any>(null)
  const [showClaritySheet, setShowClaritySheet] = useState(false)
  const [activeSheetTab, setActiveSheetTab] = useState<'patient' | 'doctor'>('patient')

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Patient context
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null)
  const [patientPsychProfile, setPatientPsychProfile] = useState<PsychProfileResponse | null>(null)
  const [patientMedicalData, setPatientMedicalData] = useState<{
    allergies?: string
    conditions?: string
    medications?: string
  } | null>(null)

  // Update segments ref
  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])

  // Update full transcript when segments change
  useEffect(() => {
    const allText = segments
      .filter((s) => s.text.trim())
      .map((s) => s.editedText || s.text)
      .join(' ')
    setFullTranscript(allText)
  }, [segments])

  // Initialize transcription provider
  useEffect(() => {
    const provider = new WebSpeechTranscriptionProvider()
    if (!provider.isSupported()) {
      setTranscriptionSupported(false)
      return
    }

    provider.onPartial((text) => {
      setDraftText(text)
    })

    provider.onFinal((text) => {
      // Update current segment with final text
      if (text.trim()) {
        setSegments((prev) => {
          const latestSegment = prev[prev.length - 1]
          if (!latestSegment || latestSegment.status === 'finalized') {
            return prev
          }
          return prev.map((seg, index) =>
            index === prev.length - 1 && seg.status === 'draft'
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
  }, [])

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
      .then((data: SessionContext) => {
        setSessionContext(data)
        const pc: PatientContext = {
          name: data.patient.displayName,
          age: data.patient.age,
          reason: data.patient.reason,
        }
        setPatientContext(pc)

        // Load patient psych profile and medical data
        if (data.patient.id) {
          // Load psych profile for patient
          fetch(`${apiBase}/api/patients/${data.patient.id}/psych-profile`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            },
          })
            .then((res) => {
              if (res.ok) {
                return res.json()
              }
              return null
            })
            .then((profile: PsychProfileResponse | null) => {
              if (profile) {
                setPatientPsychProfile(profile)
              }
            })
            .catch((err) => {
              console.log('Could not load psych profile:', err)
            })

          // Load medical data (allergies, conditions, medications)
          // TODO: Add endpoint for patient medical data
          // For now, we'll set empty values
          setPatientMedicalData({
            allergies: undefined,
            conditions: undefined,
            medications: undefined,
          })
        }

        // Restore saved messages
        if (data.messages && data.messages.length > 0) {
          const restoredMessages: Message[] = data.messages.map((msg) => ({
            id: `msg-${msg.id}`,
            role: msg.role as 'doctor' | 'assistant' | 'system',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            outputType: msg.outputType as 'structure' | 'analyze' | 'message' | undefined,
          }))
          setMessages(restoredMessages)
          console.log('✅ Restored', restoredMessages.length, 'messages')
        }

        // Restore saved segments
        if (data.segments && data.segments.length > 0) {
          const restoredSegments: Segment[] = data.segments.map((seg) => ({
            id: `seg-${seg.id}`,
            timestamp: new Date(seg.createdAt),
            source: 'voice' as const,
            text: seg.text,
            editedText: seg.text,
            status: 'finalized' as const,
            startedAt: new Date(seg.startTs),
            endedAt: seg.endTs ? new Date(seg.endTs) : undefined,
          }))
          setSegments(restoredSegments)
          console.log('✅ Restored', restoredSegments.length, 'segments')
        }
      })
      .catch((err) => {
        setError(err.message || 'Eroare la încărcare.')
      })
      .finally(() => setIsLoading(false))
  }, [appointmentId])

  // Start recording
  const handleStartRecording = useCallback(async () => {
    if (!transcriptionProvider || isRecording) return

    try {
      setRecordingError(null)
      setRecordingStatus('listening')
      setDraftText('')

      // Create new segment
      const segmentId = `seg-${Date.now()}`
      const newSegment: Segment = {
        id: segmentId,
        timestamp: new Date(),
        source: 'voice',
        text: '',
        status: 'draft',
        startedAt: new Date(),
      }
      setSegments((prev) => [...prev, newSegment])

      await transcriptionProvider.start()
      setIsRecording(true)
    } catch (error: any) {
      console.error('Failed to start recording:', error)
      setRecordingStatus('error')
      setRecordingError(error.message || 'Failed to start recording')
      setIsRecording(false)
    }
  }, [transcriptionProvider, isRecording])

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    if (!transcriptionProvider || !isRecording) return

    setRecordingStatus('paused')
    setIsRecording(false)

    // Flush and get final text
    const flushedText = await transcriptionProvider.flushAndStop()
    const currentDraft = draftText

    // Calculate final text
    const currentSegments = segmentsRef.current
    const latestSegment = currentSegments[currentSegments.length - 1]
    let finalText = ''
    
    if (latestSegment) {
      finalText = (latestSegment.text + ' ' + flushedText + ' ' + currentDraft).trim()
    } else {
      finalText = (flushedText + ' ' + currentDraft).trim()
    }

    if (!finalText) {
      setRecordingStatus('idle')
      return
    }

    // Update segment with final text (but keep as draft, not finalized)
    setSegments((prev) => {
      const latest = prev[prev.length - 1]
      if (!latest) {
        // Create new segment if none exists
        const newSegment: Segment = {
          id: `seg-${Date.now()}`,
          timestamp: new Date(),
          source: 'voice',
          text: finalText,
          editedText: finalText,
          status: 'draft',
          startedAt: new Date(),
          endedAt: new Date(),
        }
        return [...prev, newSegment]
      }

      return prev.map((seg) =>
        seg.id === latest.id
          ? {
              ...seg,
              text: finalText,
              editedText: finalText, // Allow editing
              status: 'draft', // Keep as draft until Structure/Analyze
              endedAt: new Date(),
            }
          : seg
      )
    })

    // Update draftText with the final transcribed text so user can edit it
    setDraftText(finalText)

    // Save segment to backend (but don't add to conversation yet)
    if (appointmentId) {
      const currentSegments = segmentsRef.current
      const latestSegment = currentSegments[currentSegments.length - 1]
      if (latestSegment && latestSegment.text.trim()) {
        try {
          await fetch(`${apiBase}/api/appointments/${appointmentId}/segments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: latestSegment.text,
              startTs: latestSegment.startedAt.getTime(),
              endTs: latestSegment.endedAt?.getTime() || Date.now(),
              speaker: 'doctor',
            }),
          })
        } catch (error) {
          console.error('Error saving segment:', error)
        }
      }
    }

    // Add doctor message to conversation immediately
    if (finalText && finalText.trim()) {
      const doctorMessage: Message = {
        id: `msg-doctor-${Date.now()}`,
        role: 'doctor',
        content: finalText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, doctorMessage])
      console.log('✅ Added doctor message to conversation:', finalText.substring(0, 50) + '...')

      // Save message to backend
      if (appointmentId) {
        try {
          await fetch(`${apiBase}/api/appointments/${appointmentId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: 'doctor',
              content: finalText,
            }),
          })
        } catch (error) {
          console.error('Error saving message:', error)
        }
      }
    }

    setRecordingStatus('idle')
  }, [transcriptionProvider, isRecording, draftText, appointmentId])

  // Handle Structure - SIMPLE streaming version - uses ALL conversation
  const handleStructure = useCallback(async () => {
    if (!appointmentId || !patientContext || isStructuring || isAnalyzing) return

    // Stop recording if active and add message to conversation
    if (isRecording) {
      await handleStopRecording()
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    // Get ALL messages from conversation (doctor + assistant) - this is the FULL conversation
    const allDoctorMessages = messages
      .filter((m) => m.role === 'doctor')
      .map((m) => m.content)
      .filter(Boolean)
    
    // Also get current draft if any
    const currentDraft = draftText.trim()
    
    // Build full transcript from ALL conversation messages
    const transcriptParts: string[] = []
    
    // Add all doctor messages (patient speech from conversation)
    if (allDoctorMessages.length > 0) {
      transcriptParts.push(...allDoctorMessages)
    }
    
    // Add current draft if it's new (not already in messages)
    if (currentDraft) {
      const existingText = transcriptParts.join(' ').toLowerCase()
      const draftPreview = currentDraft.substring(0, Math.min(50, currentDraft.length)).toLowerCase()
      if (!existingText.includes(draftPreview)) {
        transcriptParts.push(currentDraft)
        // Add draft to conversation as doctor message
        const doctorMessage: Message = {
          id: `msg-doctor-${Date.now()}`,
          role: 'doctor',
          content: currentDraft,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, doctorMessage])
        
        // Save message to backend
        if (appointmentId) {
          try {
            await fetch(`${apiBase}/api/appointments/${appointmentId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'doctor',
                content: currentDraft,
              }),
            })
          } catch (error) {
            console.error('Error saving message:', error)
          }
        }
        
        setDraftText('')
      }
    }
    
    const fullTranscriptText = transcriptParts.filter(Boolean).join(' ').trim()

    // Allow Structure even if no new text - analyze entire conversation
    if (fullTranscriptText.length < 10 && allDoctorMessages.length === 0) {
      setToast({ 
        message: 'Nu există încă suficient text pentru structurare. Minim 10 caractere.', 
        type: 'info' 
      })
      setTimeout(() => setToast(null), 4000)
      return
    }

    setIsStructuring(true)

    // Create message for streaming response
    const messageId = `msg-structure-${Date.now()}`
    const assistantMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      // Build extended patient context with medical data and psych profile
      const extendedPatientContext = {
        ...patientContext,
        allergies: patientMedicalData?.allergies,
        conditions: patientMedicalData?.conditions,
        medications: patientMedicalData?.medications,
        psychProfile: patientPsychProfile && patientPsychProfile.completed ? {
          temperament: patientPsychProfile.temperament,
          anxietyLevel: patientPsychProfile.anxietyLevel,
          anxietyScore: patientPsychProfile.anxietyScore,
          controlNeed: patientPsychProfile.controlNeed,
          controlScore: patientPsychProfile.controlScore,
          communicationStyle: patientPsychProfile.communicationStyle,
          procedurePreference: patientPsychProfile.procedurePreference,
          triggers: patientPsychProfile.triggers,
          notes: patientPsychProfile.notes,
        } : undefined,
      }

      // Stream the response - send ALL conversation messages for context
      const response = await fetch(`${apiBase}/api/appointments/${appointmentId}/structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: appointmentId,
          fullTranscript: fullTranscriptText,
          inputText: fullTranscriptText, // Use full transcript
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          patientContext: extendedPatientContext,
          lang: languageMode === 'auto' ? 'ro' : languageMode,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to structure: ${response.status}`)
      }

      // Read stream and update message in real-time (throttled to prevent crashes)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let lastUpdate = 0
      const UPDATE_THROTTLE = 50 // Update every 50ms max

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk

          // Throttle updates to prevent React crashes
          const now = Date.now()
          if (now - lastUpdate >= UPDATE_THROTTLE || done) {
            lastUpdate = now
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, content: accumulatedText, isTyping: false }
                  : msg
              )
            )
          }
        }
        
        // Parse JSON response and set outputData
        let parsedData: StructureResponse | null = null
        try {
          const trimmed = accumulatedText.trim()
          // Try to extract JSON from text (might have extra text before/after)
          let jsonStr = trimmed
          
          // Remove markdown code blocks if present
          jsonStr = jsonStr.replace(/^```json\s*/i, '')
          jsonStr = jsonStr.replace(/^```\s*/, '')
          jsonStr = jsonStr.replace(/\s*```$/g, '')
          
          // Try to extract JSON object if wrapped in text
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            jsonStr = jsonMatch[0]
          }
          
          if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
            const parsed = JSON.parse(jsonStr)
            if (parsed.mode === 'structure') {
              parsedData = parsed as StructureResponse
              console.log('✅ Parsed structure response:', parsedData)
            } else {
              console.log('⚠️ Parsed JSON but mode is not structure:', parsed.mode)
            }
          }
        } catch (e) {
          console.log('❌ Response is not valid JSON, using as text:', e)
        }

        // Final update to ensure all text is displayed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { 
                  ...msg, 
                  content: accumulatedText, 
                  isTyping: false, 
                  outputType: 'structure',
                  outputData: parsedData || undefined
                }
              : msg
          )
        )

        // Save assistant message to backend
        if (appointmentId && accumulatedText.trim()) {
          try {
            await fetch(`${apiBase}/api/appointments/${appointmentId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'assistant',
                content: accumulatedText,
                outputType: 'structure',
                outputData: parsedData,
              }),
            })
          } catch (error) {
            console.error('Error saving assistant message:', error)
          }
        }
      }
    } catch (error: any) {
      console.error('Error structuring:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: 'Eroare la structurare: ' + (error.message || 'Unknown error'), isTyping: false }
            : msg
        )
      )
    } finally {
      setIsStructuring(false)
    }
  }, [
    appointmentId,
    patientContext,
    patientMedicalData,
    patientPsychProfile,
    sessionContext,
    isStructuring,
    isAnalyzing,
    isRecording,
    handleStopRecording,
    draftText,
    fullTranscript,
    messages,
    languageMode,
  ])

  // Handle Analyze - SIMPLE streaming version - uses ALL conversation
  const handleAnalyze = useCallback(async () => {
    if (!appointmentId || !patientContext || isStructuring || isAnalyzing) return

    // Stop recording if active and add message to conversation
    if (isRecording) {
      await handleStopRecording()
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    // Get ALL messages from conversation (doctor + assistant) - this is the FULL conversation
    const allDoctorMessages = messages
      .filter((m) => m.role === 'doctor')
      .map((m) => m.content)
      .filter(Boolean)
    
    // Also get current draft if any
    const currentDraft = draftText.trim()
    
    // Build full transcript from ALL conversation messages
    const transcriptParts: string[] = []
    
    // Add all doctor messages (patient speech from conversation)
    if (allDoctorMessages.length > 0) {
      transcriptParts.push(...allDoctorMessages)
    }
    
    // Add current draft if it's new (not already in messages)
    if (currentDraft) {
      const existingText = transcriptParts.join(' ').toLowerCase()
      const draftPreview = currentDraft.substring(0, Math.min(50, currentDraft.length)).toLowerCase()
      if (!existingText.includes(draftPreview)) {
        transcriptParts.push(currentDraft)
        // Add draft to conversation as doctor message
        const doctorMessage: Message = {
          id: `msg-doctor-${Date.now()}`,
          role: 'doctor',
          content: currentDraft,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, doctorMessage])
        
        // Save message to backend
        if (appointmentId) {
          try {
            await fetch(`${apiBase}/api/appointments/${appointmentId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'doctor',
                content: currentDraft,
              }),
            })
          } catch (error) {
            console.error('Error saving message:', error)
          }
        }
        
        setDraftText('')
      }
    }
    
    // Add edited Structure/Analyze responses as context
    const editedResponses = messages
      .filter((m) => m.role === 'assistant' && m.outputData && (m.outputData.mode === 'structure' || m.outputData.mode === 'analyze'))
      .map((m) => {
        const data = m.outputData!
        if (data.mode === 'structure') {
          const struct = data as StructureResponse
          let text = `[Versiune editată anterior - ${struct.title || 'Structură'}]\n`
          if (struct.summary) text += `Rezumat: ${struct.summary}\n\n`
          struct.sections?.forEach((section) => {
            text += `${section.heading}:\n`
            section.bullets?.forEach((bullet) => {
              text += `  • ${bullet}\n`
            })
            text += '\n'
          })
          return text.trim()
        } else {
          const analyze = data as any
          let text = `[Versiune editată anterior - ${analyze.title || 'ZenLink Insights'}]\n`
          if (analyze.summary) text += `Rezumat: ${analyze.summary}\n\n`
          if (analyze.aspectsToConsider?.length) {
            text += `Aspecte: ${analyze.aspectsToConsider.join('; ')}\n`
          }
          if (analyze.usefulClarificationQuestions?.length) {
            text += `Întrebări: ${analyze.usefulClarificationQuestions.join('; ')}\n`
          }
          return text.trim()
        }
      })
    
    if (editedResponses.length > 0) {
      transcriptParts.push('\n[CONTEXT: Versiuni editate anterior]\n' + editedResponses.join('\n\n'))
    }
    
    const fullTranscriptText = transcriptParts.filter(Boolean).join(' ').trim()

    // Allow Analyze even if no new text - analyze entire conversation
    if (fullTranscriptText.length < 10 && allDoctorMessages.length === 0) {
      setToast({ 
        message: 'Nu există încă suficient text pentru analiză. Minim 10 caractere.', 
        type: 'info' 
      })
      setTimeout(() => setToast(null), 4000)
      return
    }

    setIsAnalyzing(true)

    // Create message for streaming response
    const messageId = `msg-analyze-${Date.now()}`
    const assistantMessage: Message = {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      // Build extended patient context with medical data and psych profile
      const extendedPatientContext = {
        ...patientContext,
        allergies: patientMedicalData?.allergies,
        conditions: patientMedicalData?.conditions,
        medications: patientMedicalData?.medications,
        psychProfile: patientPsychProfile && patientPsychProfile.completed ? {
          temperament: patientPsychProfile.temperament,
          anxietyLevel: patientPsychProfile.anxietyLevel,
          anxietyScore: patientPsychProfile.anxietyScore,
          controlNeed: patientPsychProfile.controlNeed,
          controlScore: patientPsychProfile.controlScore,
          communicationStyle: patientPsychProfile.communicationStyle,
          procedurePreference: patientPsychProfile.procedurePreference,
          triggers: patientPsychProfile.triggers,
          notes: patientPsychProfile.notes,
        } : undefined,
      }

      // Stream the response - send ALL conversation messages for context
      const response = await fetch(`${apiBase}/api/appointments/${appointmentId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: appointmentId,
          fullTranscript: fullTranscriptText,
          inputText: fullTranscriptText, // Use full transcript
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          patientContext: extendedPatientContext,
          lang: languageMode === 'auto' ? 'ro' : languageMode,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze: ${response.status}`)
      }

      // Read stream and update message in real-time (throttled to prevent crashes)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let lastUpdate = 0
      const UPDATE_THROTTLE = 50 // Update every 50ms max

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk

          // Throttle updates to prevent React crashes
          const now = Date.now()
          if (now - lastUpdate >= UPDATE_THROTTLE || done) {
            lastUpdate = now
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, content: accumulatedText, isTyping: false }
                  : msg
              )
            )
          }
        }
        
        // Parse JSON response and set outputData
        let parsedData: AnalyzeResponse | null = null
        try {
          const trimmed = accumulatedText.trim()
          // Try to extract JSON from text (might have extra text before/after)
          let jsonStr = trimmed
          
          // Remove markdown code blocks if present
          jsonStr = jsonStr.replace(/^```json\s*/i, '')
          jsonStr = jsonStr.replace(/^```\s*/, '')
          jsonStr = jsonStr.replace(/\s*```$/g, '')
          
          // Try to extract JSON object if wrapped in text
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            jsonStr = jsonMatch[0]
          }
          
          if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
            const parsed = JSON.parse(jsonStr)
            if (parsed.mode === 'analyze') {
              parsedData = parsed as AnalyzeResponse
              console.log('✅ Parsed analyze response:', parsedData)
            } else {
              console.log('⚠️ Parsed JSON but mode is not analyze:', parsed.mode)
            }
          }
        } catch (e) {
          console.log('❌ Response is not valid JSON, using as text:', e)
        }

        // Final update to ensure all text is displayed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { 
                  ...msg, 
                  content: accumulatedText, 
                  isTyping: false, 
                  outputType: 'analyze',
                  outputData: parsedData || undefined
                }
              : msg
          )
        )

        // Save assistant message to backend
        if (appointmentId && accumulatedText.trim()) {
          try {
            await fetch(`${apiBase}/api/appointments/${appointmentId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: 'assistant',
                content: accumulatedText,
                outputType: 'analyze',
                outputData: parsedData,
              }),
            })
          } catch (error) {
            console.error('Error saving assistant message:', error)
          }
        }
      }
    } catch (error: any) {
      console.error('Error analyzing:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: 'Eroare la analiză: ' + (error.message || 'Unknown error'), isTyping: false }
            : msg
        )
      )
    } finally {
      setIsAnalyzing(false)
    }
  }, [
    appointmentId,
    patientContext,
    patientMedicalData,
    patientPsychProfile,
    sessionContext,
    isStructuring,
    isAnalyzing,
    isRecording,
    handleStopRecording,
    draftText,
    fullTranscript,
    messages,
    languageMode,
  ])

  // Handle Finalize
  const handleFinalize = useCallback(async () => {
    if (!appointmentId || !patientContext) {
      alert('Lipsește appointmentId sau patientContext.')
      return
    }

    // Stop recording if active
    if (isRecording) {
      await handleStopRecording()
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    setIsFinalizing(true)

    try {
      const currentSegments = segmentsRef.current
      const allSegmentsWithText = currentSegments.filter((s) => (s.editedText || s.text).trim())
      const hasText = allSegmentsWithText.length > 0 || messages.some((m) => m.role === 'doctor')

      if (!hasText) {
        alert('Nu există date de finalizat. Încearcă să înregistrezi ceva mai întâi.')
        setIsFinalizing(false)
        return
      }

      // Build full transcript from messages (doctor messages) and segments
      const doctorMessages = messages.filter((m) => m.role === 'doctor').map((m) => m.content)
      const segmentTexts = allSegmentsWithText.map((s) => s.editedText || s.text)
      
      // Combine all text sources
      const allTextParts: string[] = []
      if (doctorMessages.length > 0) {
        allTextParts.push(...doctorMessages)
      }
      if (segmentTexts.length > 0) {
        allTextParts.push(...segmentTexts)
      }
      if (draftText.trim()) {
        allTextParts.push(draftText.trim())
      }
      
      const completeTranscript = allTextParts.filter(Boolean).join(' ').trim()

      if (!completeTranscript || completeTranscript.length < 10) {
        alert('Nu există suficient conținut pentru finalizare. Minim 10 caractere.')
        setIsFinalizing(false)
        return
      }

      const requestBody = {
        patientContext: patientContext,
        fullTranscript: completeTranscript,
        segments: allSegmentsWithText.map((s) => ({
          id: s.id,
          startedAt: s.startedAt.toISOString(),
          endedAt: s.endedAt?.toISOString() || new Date().toISOString(),
          text: s.editedText || s.text,
        })),
      }

      const response = await fetch(`${apiBase}/api/appointments/${appointmentId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Failed to finalize: ${response.status}`)
      }

      const data = await response.json()
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
      setMessages((prev) => [...prev, finalMessage])
    } catch (error: any) {
      console.error('Error finalizing:', error)
      alert('Eroare la finalizare: ' + (error.message || 'Unknown error'))
    } finally {
      setIsFinalizing(false)
    }
  }, [appointmentId, patientContext, isRecording, handleStopRecording, fullTranscript, messages])

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          <p className="text-sm text-white/50">Se încarcă consultația...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !sessionContext) {
    return (
      <div className="h-screen bg-[#0a0a14] flex items-center justify-center p-6">
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

  // Render sidebar
  const sidebar = (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* Patient card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center">
            <span className="text-lg font-semibold text-purple-200">
              {sessionContext.patient.displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{sessionContext.patient.displayName}</h3>
            <p className="text-sm text-white/50">
              {sessionContext.patient.age ? `${sessionContext.patient.age} ani` : '—'}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/40">Motiv</span>
            <span className="text-white/80">{sessionContext.patient.reason}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">ID</span>
            <span className="font-mono text-xs text-white/60">{sessionContext.internalPatientKey}</span>
          </div>
        </div>
      </div>

      {/* Medical Data */}
      {(patientMedicalData?.allergies || patientMedicalData?.conditions || patientMedicalData?.medications) && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Date Medicale</h4>
          <div className="space-y-3 text-sm">
            {patientMedicalData.allergies && (
              <div>
                <span className="text-white/50 block mb-1">Alergii:</span>
                <span className="text-white/80">{patientMedicalData.allergies}</span>
              </div>
            )}
            {patientMedicalData.conditions && (
              <div>
                <span className="text-white/50 block mb-1">Afecțiuni:</span>
                <span className="text-white/80">{patientMedicalData.conditions}</span>
              </div>
            )}
            {patientMedicalData.medications && (
              <div>
                <span className="text-white/50 block mb-1">Medicație:</span>
                <span className="text-white/80">{patientMedicalData.medications}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Psych Profile */}
      {patientPsychProfile && patientPsychProfile.completed && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
          <h4 className="text-xs font-medium text-purple-300/80 uppercase tracking-wider mb-3">Profil Psihologic</h4>
          <div className="space-y-3 text-sm">
            {patientPsychProfile.temperament && (
              <div>
                <span className="text-white/50 block mb-1">Temperament:</span>
                <span className="text-white font-medium">{patientPsychProfile.temperament}</span>
              </div>
            )}
            {patientPsychProfile.anxietyLevel && (
              <div>
                <span className="text-white/50 block mb-1">Nivel anxietate:</span>
                <span className="text-white font-medium">
                  {patientPsychProfile.anxietyLevel}
                  {patientPsychProfile.anxietyScore !== undefined && ` (${patientPsychProfile.anxietyScore})`}
                </span>
              </div>
            )}
            {patientPsychProfile.controlNeed && (
              <div>
                <span className="text-white/50 block mb-1">Nevoie de control:</span>
                <span className="text-white font-medium">
                  {patientPsychProfile.controlNeed}
                  {patientPsychProfile.controlScore !== undefined && ` (${patientPsychProfile.controlScore})`}
                </span>
              </div>
            )}
            {patientPsychProfile.communicationStyle && (
              <div>
                <span className="text-white/50 block mb-1">Stil comunicare:</span>
                <span className="text-white font-medium">{patientPsychProfile.communicationStyle}</span>
              </div>
            )}
            {patientPsychProfile.procedurePreference && (
              <div>
                <span className="text-white/50 block mb-1">Preferințe proceduri:</span>
                <span className="text-white font-medium">{patientPsychProfile.procedurePreference}</span>
              </div>
            )}
            {patientPsychProfile.triggers && patientPsychProfile.triggers.length > 0 && (
              <div>
                <span className="text-white/50 block mb-1">Trigger-uri:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patientPsychProfile.triggers.map((trigger, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-200">
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {patientPsychProfile.notes && (
              <div>
                <span className="text-white/50 block mb-1">Note:</span>
                <span className="text-white/70 text-xs">{patientPsychProfile.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats card */}
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
  )

  // Render top bar
  const topBar = (
    <>
      <div>
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">
          Consultație #{appointmentId}
        </p>
        <h1 className="text-2xl font-semibold text-white">Consultation Workspace</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Structure button */}
        <button
          onClick={handleStructure}
          disabled={isStructuring || isAnalyzing || isFinalizing}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
        >
          {isStructuring ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Structurând...
            </>
          ) : (
            <>
              <List className="w-4 h-4" />
              Structure
            </>
          )}
        </button>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={isStructuring || isAnalyzing || isFinalizing}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analizând...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              ZenLink Analyze
            </>
          )}
        </button>

        {/* Finalize button */}
        <button
          onClick={handleFinalize}
          disabled={
            (segments.length === 0 && messages.length === 0 && !draftText.trim()) ||
            isStructuring ||
            isAnalyzing ||
            isFinalizing
          }
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
    </>
  )

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-5">
          <div
            className={`backdrop-blur-xl rounded-xl p-4 shadow-2xl flex items-center gap-3 min-w-[300px] border ${
              toast.type === 'error'
                ? 'bg-red-500/20 border-red-500/30'
                : toast.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/30'
                : 'bg-purple-500/20 border-purple-500/30'
            }`}
          >
            {toast.type === 'error' ? (
              <X className="w-5 h-5 text-red-300 flex-shrink-0" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-purple-300 flex-shrink-0" />
            )}
            <p
              className={`text-sm font-medium flex-1 ${
                toast.type === 'error'
                  ? 'text-red-200'
                  : toast.type === 'success'
                  ? 'text-emerald-200'
                  : 'text-purple-200'
              }`}
            >
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ConsultationLayout
        topBar={topBar}
        sidebar={sidebar}
        conversation={
          <ConversationPanel
            messages={messages}
            currentDraft={isRecording ? draftText : undefined}
            isProcessing={isStructuring || isAnalyzing}
            onUpdateMessage={async (messageId, updatedData) => {
              // Update message in state
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === messageId
                    ? { ...m, outputData: updatedData }
                    : m
                )
              )
              // Save to backend
              if (appointmentId && updatedData) {
                try {
                  await fetch(`${apiBase}/api/appointments/${appointmentId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      role: 'assistant',
                      content: JSON.stringify(updatedData),
                      outputType: updatedData.mode,
                      outputData: updatedData,
                    }),
                  })
                } catch (error) {
                  console.error('Error saving updated message:', error)
                }
              }
            }}
          />
        }
        composer={
          <Composer
            draftText={draftText}
            onDraftChange={setDraftText}
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onStructure={handleStructure}
            onAnalyze={handleAnalyze}
            isStructuring={isStructuring}
            isAnalyzing={isAnalyzing}
            disabled={isFinalizing}
          />
        }
      />

      {/* Clarity Sheet Modal */}
      {showClaritySheet && (claritySheet || doctorSummary) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="w-full max-w-3xl rounded-3xl bg-[#0c0c18] border border-white/10 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-300/70 font-medium uppercase tracking-wider">
                    Consultație Finalizată
                  </p>
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
              <p className="text-sm text-white/50 mt-2">Pentru: {sessionContext.patient.displayName}</p>
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
                <div className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-1">CLARITY SHEET</h3>
                    <p className="text-sm text-white/60">(Pe scurt, despre vizita ta)</p>
                  </div>

                  {/* Section 1: Ce s-a întâmplat azi */}
                  <div className="mb-5 border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-white/80 mb-3">1. Ce s-a întâmplat azi</h4>
                    <p className="text-sm text-white/70 mb-2">Ai venit pentru că:</p>
                    <ul className="space-y-1.5 mb-3">
                      <li className="text-sm text-white/70 flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{claritySheet.whatHappenedToday || 'Consultație stomatologică'}</span>
                      </li>
                    </ul>
                    <p className="text-sm text-white/70 mb-2">Astăzi:</p>
                    <ul className="space-y-1.5">
                      {claritySheet.todayActions && claritySheet.todayActions.length > 0 ? (
                        claritySheet.todayActions.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-white/70 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>am discutat despre situația ta</span>
                        </li>
                      )}
                    </ul>
                    <p className="text-sm text-purple-300/80 mt-2">👉 Scopul a fost să înțelegem clar situația ta.</p>
                  </div>

                  {/* Section 2: Ce înseamnă asta pentru tine */}
                  <div className="mb-5 border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-white/80 mb-3">2. Ce înseamnă asta pentru tine</h4>
                    <p className="text-sm text-white/70 mb-2">Din ce am văzut:</p>
                    <ul className="space-y-1.5">
                      {claritySheet.whatThisMeans && claritySheet.whatThisMeans.length > 0 ? (
                        claritySheet.whatThisMeans.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-white/70 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>situația ta a fost evaluată</span>
                        </li>
                      )}
                    </ul>
                    <p className="text-sm text-purple-300/80 mt-2">👉 Este suficient să știi ce se întâmplă, nu toate explicațiile tehnice.</p>
                  </div>

                  {/* Section 3: Ce urmează */}
                  <div className="mb-5 border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-white/80 mb-3">3. Ce urmează</h4>
                    <p className="text-sm text-white/70 mb-2">Următorii pași sunt simpli:</p>
                    <ul className="space-y-1.5">
                      {claritySheet.nextSteps && claritySheet.nextSteps.length > 0 ? (
                        claritySheet.nextSteps.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-white/70 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>vom continua discuția la următoarea vizită</span>
                        </li>
                      )}
                    </ul>
                    {claritySheet.nextAppointment && (
                      <p className="text-sm text-white/70 mt-3">
                        📅 Următoarea întâlnire: {claritySheet.nextAppointment}
                      </p>
                    )}
                  </div>

                  {/* Section 4: La ce să fii atent */}
                  <div className="mb-5 border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-white/80 mb-3">4. La ce să fii atent</h4>
                    <p className="text-sm text-white/70 mb-2">Până data viitoare, notează dacă observi:</p>
                    <ul className="space-y-1.5">
                      {claritySheet.whatToWatchFor && claritySheet.whatToWatchFor.length > 0 ? (
                        claritySheet.whatToWatchFor.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-white/70 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>schimbări ale disconfortului</span>
                        </li>
                      )}
                    </ul>
                    <p className="text-sm text-white/70 mt-3">📞 Dacă apare ceva neobișnuit pentru tine, contactează clinica.</p>
                  </div>

                  {/* Section 5: Verificare rapidă (pentru tine) */}
                  <div className="mb-5 border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-white/80 mb-3">5. Verificare rapidă (pentru tine)</h4>
                    <p className="text-sm text-white/70 mb-2">Ia un moment și gândește-te:</p>
                    <ul className="space-y-1.5">
                      {claritySheet.quickCheckQuestions && claritySheet.quickCheckQuestions.length > 0 ? (
                        claritySheet.quickCheckQuestions.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-white/70 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Care este lucrul principal pe care l-ai reținut din vizită?</span>
                        </li>
                      )}
                    </ul>
                    <p className="text-sm text-white/60 italic mt-3">Dacă nu ai un răspuns clar, e în regulă — îl vom clarifica împreună.</p>
                  </div>

                  {/* Section 6: Un lucru important */}
                  <div className="mb-5 border-t border-white/10 pt-4">
                    <h4 className="text-sm font-semibold text-white/80 mb-3">6. Un lucru important</h4>
                    <p className="text-sm text-white/70 mb-2">Acest document:</p>
                    <ul className="space-y-1.5">
                      {claritySheet.importantNote && claritySheet.importantNote.length > 0 ? (
                        claritySheet.importantNote.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-white/70 flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>te ajută să îți amintești ce s-a discutat</span>
                        </li>
                      )}
                    </ul>
                    <p className="text-sm text-white/70 mt-3">Medicul tău este cel care te ghidează mai departe.</p>
                  </div>
                </div>
              )}

              {activeSheetTab === 'doctor' && doctorSummary && (
                <div className="space-y-5">
                  {/* Section 1: Date generale caz */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-white/80 mb-2">1. Date generale caz</h4>
                    <div className="space-y-1.5 text-sm text-white/70">
                      <div><span className="text-purple-400">•</span> Data consultației: {doctorSummary.consultationDate || 'N/A'}</div>
                      <div><span className="text-purple-400">•</span> Clinician: {doctorSummary.clinician || 'N/A'}</div>
                      <div><span className="text-purple-400">•</span> Specialitate: {doctorSummary.specialty || 'N/A'}</div>
                      <div><span className="text-purple-400">•</span> Tip prezentare: {doctorSummary.presentationType || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Section 2: Motivul prezentării */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-white/80 mb-2">2. Motivul prezentării (raportat de pacient)</h4>
                    <p className="text-xs text-white/50 italic mb-1.5">„Pacientul se prezintă pentru…”</p>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {doctorSummary.chiefComplaint || 'Nu a fost menționat explicit.'}
                    </p>
                  </div>

                  {/* Section 3: Anamneză relevantă */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-white/80 mb-2">3. Anamneză relevantă (structurată)</h4>
                    {doctorSummary.generalMedicalHistory?.length > 0 ? (
                      <div className="mb-3">
                        <p className="text-xs text-white/60 mb-1.5">Istoric medical general (relevant)</p>
                        <ul className="space-y-1">
                          {doctorSummary.generalMedicalHistory.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-white/50 italic mb-3">Nu a fost menționat istoric medical general.</p>
                    )}
                    {doctorSummary.dentalHistory?.length > 0 ? (
                      <div>
                        <p className="text-xs text-white/60 mb-1.5">Istoric dentar (afecțiuni heredocolaterale stomatologice)</p>
                        <ul className="space-y-1">
                          {doctorSummary.dentalHistory.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-white/50 italic">Nu a fost menționat istoric dentar.</p>
                    )}
                  </div>

                  {/* Section 4: Observații clinice */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-white/80 mb-2">4. Observații clinice (examen obiectiv)</h4>
                    {doctorSummary.generalObservations?.length > 0 ? (
                      <div className="mb-3">
                        <p className="text-xs text-white/60 mb-1.5">Observații generale</p>
                        <ul className="space-y-1">
                          {doctorSummary.generalObservations.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-white/50 italic mb-3">Nu au fost menționate observații generale.</p>
                    )}
                    {doctorSummary.specialtySpecificObservations?.length > 0 ? (
                      <div>
                        <p className="text-xs text-white/60 mb-1.5">Observații specifice specialității</p>
                        <ul className="space-y-1">
                          {doctorSummary.specialtySpecificObservations.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-white/50 italic">Nu au fost menționate observații specifice specialității.</p>
                    )}
                  </div>

                  {/* Section 5: Date suplimentare & materiale */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-white/80 mb-2">5. Date suplimentare & materiale</h4>
                    {doctorSummary.availableInvestigations?.length > 0 ? (
                      <div className="mb-2">
                        <p className="text-xs text-white/60 mb-1">investigații disponibile</p>
                        <ul className="space-y-1">
                          {doctorSummary.availableInvestigations.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {doctorSummary.clinicalPhotos?.length > 0 ? (
                      <div className="mb-2">
                        <p className="text-xs text-white/60 mb-1">fotografii clinice</p>
                        <ul className="space-y-1">
                          {doctorSummary.clinicalPhotos.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {doctorSummary.otherDocuments?.length > 0 ? (
                      <div>
                        <p className="text-xs text-white/60 mb-1">alte documente încărcate</p>
                        <ul className="space-y-1">
                          {doctorSummary.otherDocuments.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-white/50 italic">Nu au fost menționate materiale suplimentare.</p>
                    )}
                  </div>

                  {/* Section 6: Notă clinică – clinician (uman) */}
                  {!doctorSummary.excludeClinicianNote && (
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-white/80 mb-2">6. Notă clinică – clinician (uman)</h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {doctorSummary.clinicianNote || 'Nu a fost adăugată notă clinică.'}
                      </p>
                    </div>
                  )}

                  {/* Section 7: Acțiuni realizate */}
                  {doctorSummary.includeActionsPerformed && (
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-white/80 mb-2">7. Acțiuni realizate în cadrul consultației</h4>
                      {doctorSummary.actionsPerformed && doctorSummary.actionsPerformed.length > 0 ? (
                        <ul className="space-y-1">
                          {doctorSummary.actionsPerformed.map((item: string, i: number) => (
                            <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="text-purple-400 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-white/50 italic">Nu au fost menționate acțiuni specifice.</p>
                      )}
                    </div>
                  )}

                  {/* Section 8: Claritate & proveniența informației */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-white/80 mb-2">8. Claritate & proveniența informației</h4>
                    <p className="text-xs text-white/60 mb-1.5">Originea informațiilor din acest document</p>
                    {doctorSummary.informationSources && doctorSummary.informationSources.length > 0 ? (
                      <ul className="space-y-1">
                        {doctorSummary.informationSources.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-white/50 italic">Nu au fost specificate surse.</p>
                    )}
                  </div>

                  {/* Section 9: Control export către pacient */}
                  <div className="mb-5 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <h4 className="text-xs font-semibold text-purple-300/80 mb-1.5">9. Control export către pacient</h4>
                    <div className="text-xs text-white/60 space-y-0.5">
                      <div>☑️ Include: motivul prezentării, rezumat observații, acțiuni realizate, pași următori</div>
                      <div>☐ Exclude: notă clinică internă, observații sensibile</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Download buttons */}
            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              <button
                onClick={async () => {
                  const content = activeSheetTab === 'patient' ? claritySheet : doctorSummary
                  const title =
                    activeSheetTab === 'patient' ? 'Clarity Sheet (Pacient)' : 'Rezumat (Doctor)'
                  const html = formatSheetAsHTML(content, activeSheetTab === 'patient')
                  await generatePDF(html, title, sessionContext.patient.displayName, appointmentId, activeSheetTab === 'patient')
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
    </>
  )
}
