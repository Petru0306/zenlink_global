import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, User, FileText, MessageSquare, Download, Send } from 'lucide-react';
import { formatSheetAsHTML, generatePDF } from '../../lib/pdf/exportClaritySheet';
import { Input } from '../ui/input';
import { renderMarkdown } from '../../lib/markdown';

interface FinalizedConsultation {
  id: number;
  appointmentId: number;
  doctorId: number;
  patientId: number;
  patientClaritySheet: string; // JSON string
  doctorSummary: string; // JSON string
  chiefComplaint: string;
  consultationDate: string;
  finalizedAt: string;
}

interface PatientInfo {
  id: number;
  firstName: string;
  lastName: string;
}

interface ConsultationMessage {
  id: number;
  role: string;
  content: string;
  outputType?: string;
  timestamp: string;
}

interface ConsultationDetailProps {
  consultation: FinalizedConsultation;
  onBack: () => void;
}

export function ConsultationDetail({ consultation, onBack }: ConsultationDetailProps) {
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'clarity' | 'conversation'>('clarity');
  const [claritySheet, setClaritySheet] = useState<any>(null);
  const [doctorSummary, setDoctorSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);

    // Fetch patient info
    fetch(`http://localhost:8080/api/users/${consultation.patientId}`)
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Failed to fetch patient');
      })
      .then((data: PatientInfo) => setPatient(data))
      .catch(err => {
        console.error('Error fetching patient:', err);
        setPatient(null);
      });

    // Fetch messages
    fetch(`http://localhost:8080/api/appointments/${consultation.appointmentId}/messages`)
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        return [];
      })
      .then((data: ConsultationMessage[]) => {
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      })
      .catch(err => {
        console.error('Error fetching messages:', err);
        setMessages([]);
      });

    // Parse clarity sheets
    try {
      if (consultation.patientClaritySheet) {
        const patientSheet = JSON.parse(consultation.patientClaritySheet);
        setClaritySheet(patientSheet);
      } else {
        setClaritySheet(null);
      }
      if (consultation.doctorSummary) {
        const summary = JSON.parse(consultation.doctorSummary);
        setDoctorSummary(summary);
      } else {
        setDoctorSummary(null);
      }
    } catch (e) {
      console.error('Error parsing clarity sheets:', e);
      setClaritySheet(null);
      setDoctorSummary(null);
    } finally {
      setLoading(false);
    }
  }, [consultation]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMessageContent = (content: string) => {
    // Try to parse as JSON first
    try {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        // If it's a structured response, format it nicely
        if (parsed.mode || parsed.title || parsed.conclusion) {
          return formatStructuredResponse(parsed);
        }
      }
    } catch (e) {
      // Not JSON, continue with markdown formatting
    }

    // Format as markdown/plain text with nice styling
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Format headers
      if (line.trim().startsWith('📝') || line.trim().startsWith('🧠')) {
        return (
          <h2 key={idx} className="text-lg font-semibold text-white mt-4 mb-2 first:mt-0">
            {line}
          </h2>
        );
      }
      // Format section headers (lines ending with :)
      if (line.trim().match(/^[A-ZĂÂÎȘȚ][^:]+:$/)) {
        return (
          <h3 key={idx} className="text-base font-semibold text-white/90 mt-3 mb-1.5">
            {line}
          </h3>
        );
      }
      // Format bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={idx} className="text-white/80 ml-4 mb-1">
            {line}
          </div>
        );
      }
      // Regular text
      return (
        <div key={idx} className="text-white/80 mb-1.5">
          {line || '\u00A0'}
        </div>
      );
    });
  };

  const formatStructuredResponse = (data: any) => {
    const parts: JSX.Element[] = [];
    
    if (data.title) {
      parts.push(
        <h2 key="title" className="text-lg font-semibold text-white mb-3">
          {data.title}
        </h2>
      );
    }

    if (data.conclusion) {
      if (data.conclusion.summary) {
        parts.push(
          <p key="summary" className="text-white/90 mb-3">
            {data.conclusion.summary}
          </p>
        );
      }
      if (data.conclusion.probabilities && Array.isArray(data.conclusion.probabilities)) {
        parts.push(
          <div key="probabilities" className="mb-4">
            {data.conclusion.probabilities.map((prob: any, i: number) => (
              <div key={i} className="mb-2 p-2 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/90 font-medium">{prob.label}</span>
                  <span className="text-purple-300 text-sm">{prob.percent}%</span>
                </div>
                {prob.note && (
                  <p className="text-white/60 text-xs mt-1">{prob.note}</p>
                )}
              </div>
            ))}
          </div>
        );
      }
    }

    if (data.nextSteps && Array.isArray(data.nextSteps)) {
      parts.push(
        <div key="nextSteps" className="mb-4">
          <h3 className="text-base font-semibold text-white/90 mb-2">Pași următori:</h3>
          {data.nextSteps.map((step: any, i: number) => (
            <div key={i} className="mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start gap-3">
                {step.icon && <span className="text-2xl">{step.icon}</span>}
                <div className="flex-1">
                  <h4 className="text-white/90 font-medium mb-1">{step.title}</h4>
                  <p className="text-white/70 text-sm">{step.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (data.redFlags && Array.isArray(data.redFlags)) {
      parts.push(
        <div key="redFlags" className="mb-4">
          <h3 className="text-base font-semibold text-red-300 mb-2">Semne de alarmă:</h3>
          <ul className="list-disc list-inside space-y-1">
            {data.redFlags.map((flag: string, i: number) => (
              <li key={i} className="text-red-200/80 text-sm">{flag}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (data.cta) {
      parts.push(
        <div key="cta" className="mt-4">
          <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-colors">
            {data.cta.label}
          </button>
        </div>
      );
    }

    return <div>{parts}</div>;
  };

  const handleDownloadPDF = async (isPatient: boolean) => {
    const content = isPatient ? claritySheet : doctorSummary;
    const title = isPatient ? 'Clarity Sheet (Pacient)' : 'Rezumat (Doctor)';
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Pacient';
    const html = formatSheetAsHTML(content, isPatient);
    await generatePDF(html, title, patientName, consultation.appointmentId.toString(), isPatient);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsSending(true);

    // Add user message to UI immediately
    const newUserMessage: ConsultationMessage = {
      id: Date.now(),
      role: 'doctor',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Build patient context from clarity sheet
      const patientContext = patient ? {
        name: `${patient.firstName} ${patient.lastName}`,
        age: null,
        reason: doctorSummary?.chiefComplaint || '',
      } : null;

      const requestBody = {
        userMessage: userMessage,
        patientContext: patientContext,
        lastSegments: [],
        rollingSummary: doctorSummary?.chiefComplaint || '',
      };

      const response = await fetch(`http://localhost:8080/api/appointments/${consultation.appointmentId}/copilot-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.content_markdown || data.assistantMarkdown || data.assistantResponse || 'Răspuns generat.';

      // Add assistant message
      const assistantMessage: ConsultationMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Save messages to backend
      try {
        await fetch(`http://localhost:8080/api/appointments/${consultation.appointmentId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'doctor',
            content: userMessage,
            outputType: 'message',
          }),
        });
        await fetch(`http://localhost:8080/api/appointments/${consultation.appointmentId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: assistantContent,
            outputType: 'message',
          }),
        });
      } catch (e) {
        console.error('Error saving messages:', e);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: ConsultationMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Eroare: ${error.message || 'Nu s-a putut trimite mesajul'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === 'conversation') {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          <p className="text-sm text-white/50">Se încarcă detaliile...</p>
        </div>
      </div>
    );
  }

  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : `Pacient #${consultation.patientId}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Înapoi la listă</span>
        </button>
      </div>

      {/* Patient Info Card */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <User className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{patientName}</h2>
            <div className="flex items-center gap-4 text-sm text-white/50 mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(consultation.consultationDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('clarity')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'clarity'
              ? 'text-purple-300'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Clarity Sheet
          </span>
          {activeTab === 'clarity' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('conversation')}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'conversation'
              ? 'text-purple-300'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversație AI
          </span>
          {activeTab === 'conversation' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'clarity' && (
        <div className="space-y-6">
          {/* Patient Clarity Sheet */}
          {claritySheet && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Clarity Sheet (Pacient)</h3>
                <button
                  onClick={() => handleDownloadPDF(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descarcă PDF
                </button>
              </div>
              {/* Render patient clarity sheet - same format as ConsultationWorkspacePage */}
              <div className="space-y-5">
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

                {/* Section 5: Verificare rapidă */}
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
            </div>
          )}

          {/* Doctor Summary */}
          {doctorSummary && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Rezumat (Doctor)</h3>
                <button
                  onClick={() => handleDownloadPDF(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descarcă PDF
                </button>
              </div>
              {/* Render doctor summary - same format as ConsultationWorkspacePage */}
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

                {/* Section 6: Notă clinică */}
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

                {/* Section 9: Control export */}
                <div className="mb-5 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-xs font-semibold text-purple-300/80 mb-1.5">9. Control export către pacient</h4>
                  <div className="text-xs text-white/60 space-y-0.5">
                    <div>☑️ Include: motivul prezentării, rezumat observații, acțiuni realizate, pași următori</div>
                    <div>☐ Exclude: notă clinică internă, observații sensibile</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'conversation' && (
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 flex flex-col h-[600px]">
          <h3 className="text-lg font-semibold text-white mb-4">Conversație AI</h3>
          <div className="flex-1 space-y-4 overflow-y-auto mb-4" ref={messagesEndRef}>
            {messages.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-8">Nu există mesaje în această consultație. Începe o conversație nouă!</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.role === 'doctor'
                      ? 'bg-purple-500/10 border border-purple-500/20'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-purple-300">
                      {msg.role === 'doctor' ? 'Doctor' : 'Asistent AI'}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(msg.timestamp).toLocaleTimeString('ro-RO')}
                    </span>
                  </div>
                  {msg.role === 'assistant' ? (
                    <div
                      className="text-sm text-white/90 whitespace-pre-wrap break-words leading-relaxed"
                      style={{ 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        lineHeight: '1.7'
                      }}
                    >
                      {formatMessageContent(msg.content)}
                    </div>
                  ) : (
                    <p className="text-sm text-white/70 whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Chat input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Scrie un mesaj pentru AI..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isSending}
              className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Se trimite...' : 'Trimite'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
