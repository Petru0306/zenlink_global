import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, User, FileText, ChevronRight, Stethoscope, Search } from 'lucide-react';
import { Input } from '../ui/input';

interface FinalizedConsultation {
  id: number;
  appointmentId: number;
  doctorId: number;
  patientId: number;
  patientClaritySheet: string; // JSON string
  doctorSummary: string; // JSON string
  chiefComplaint: string;
  consultationDate: string; // ISO string
  finalizedAt: string; // ISO string
}

interface PatientInfo {
  id: number;
  firstName: string;
  lastName: string;
}

interface ConsultationsListProps {
  doctorId: number;
  onSelectConsultation: (consultation: FinalizedConsultation) => void;
  filterPatientId?: number; // Optional filter by patient ID
}

export function ConsultationsList({ doctorId, onSelectConsultation, filterPatientId }: ConsultationsListProps) {
  const [consultations, setConsultations] = useState<FinalizedConsultation[]>([]);
  const [patients, setPatients] = useState<Map<number, PatientInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Group consultations by patient and count them
  const consultationsWithNumbers = useMemo(() => {
    const patientCounts = new Map<number, number>();
    const result: Array<FinalizedConsultation & { consultationNumber: number }> = [];
    
    // Sort by date descending
    const sorted = [...consultations].sort((a, b) => 
      new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime()
    );
    
    sorted.forEach(consultation => {
      const count = (patientCounts.get(consultation.patientId) || 0) + 1;
      patientCounts.set(consultation.patientId, count);
      result.push({ ...consultation, consultationNumber: count });
    });
    
    return result;
  }, [consultations]);
  
  // Filter consultations by search query and patient filter
  const filteredConsultations = useMemo(() => {
    let filtered = consultationsWithNumbers;
    
    // Filter by patient ID if specified
    if (filterPatientId) {
      filtered = filtered.filter(c => c.patientId === filterPatientId);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(consultation => {
        const patient = patients.get(consultation.patientId);
        const patientName = patient 
          ? `${patient.firstName} ${patient.lastName}`.toLowerCase()
          : '';
        const complaint = consultation.chiefComplaint?.toLowerCase() || '';
        
        return patientName.includes(query) || complaint.includes(query);
      });
    }
    
    return filtered;
  }, [consultationsWithNumbers, patients, searchQuery, filterPatientId]);

  useEffect(() => {
    if (!doctorId || doctorId === 0) {
      setLoading(false);
      setError('ID medic invalid');
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch finalized consultations
    fetch(`http://localhost:8080/api/appointments/doctor/${doctorId}/finalized`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: FinalizedConsultation[]) => {
        if (!Array.isArray(data)) {
          console.error('Expected array but got:', data);
          setConsultations([]);
          return;
        }
        setConsultations(data);
        
        // Fetch patient info for each unique patient
        const uniquePatientIds = [...new Set(data.map(c => c.patientId))];
        const patientPromises = uniquePatientIds.map(patientId =>
          fetch(`http://localhost:8080/api/users/${patientId}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`Failed to fetch patient ${patientId}`);
              }
              return res.json();
            })
            .then((patient: PatientInfo) => {
              if (patient && patient.id && (patient.firstName || patient.lastName)) {
                return { id: patientId, patient };
              }
              throw new Error('Invalid patient data');
            })
            .catch((err) => {
              console.error(`Error fetching patient ${patientId}:`, err);
              return { id: patientId, patient: null };
            })
        );
        
        Promise.all(patientPromises).then(results => {
          const patientMap = new Map<number, PatientInfo>();
          results.forEach(({ id, patient }) => {
            if (patient && patient.firstName && patient.lastName) {
              patientMap.set(id, patient);
            }
          });
          setPatients(patientMap);
          setLoading(false);
        });
      })
      .catch(err => {
        console.error('Error fetching consultations:', err);
        setError('Eroare la încărcarea consultațiilor');
        setLoading(false);
      });
  }, [doctorId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <p className="text-xs text-white/50">Verifică că ești autentificat ca medic.</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          <p className="text-sm text-white/50">Se încarcă consultațiile...</p>
        </div>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Stethoscope className="w-16 h-16 text-purple-500/30 mb-4" />
        <h3 className="text-xl font-semibold text-white/80 mb-2">Nicio consultație finalizată</h3>
        <p className="text-sm text-white/50 max-w-md">
          Consultațiile finalizate vor apărea aici, organizate cronologic, pentru a-ți oferi o vedere clară asupra istoricului medical al pacienților tăi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          type="text"
          placeholder="Caută după nume pacient sau motiv..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
      </div>

      {filteredConsultations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-white/50">
            {searchQuery ? 'Nu s-au găsit consultații care să corespundă căutării.' : 'Nicio consultație finalizată'}
          </p>
        </div>
      ) : (
        filteredConsultations.map((consultation) => {
          const patient = patients.get(consultation.patientId);
          const patientName = patient 
            ? `${patient.firstName} ${patient.lastName}`
            : `Pacient #${consultation.patientId}`;
          
          const consultationTitle = patient
            ? `Consultatie ${patient.firstName} ${patient.lastName} #${consultation.consultationNumber}`
            : `Consultatie Pacient #${consultation.patientId} #${consultation.consultationNumber}`;

        return (
          <div
            key={consultation.id}
            onClick={() => onSelectConsultation(consultation)}
            className="group relative backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Stethoscope className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors">
                      {consultationTitle}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-white/50 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(consultation.consultationDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(consultation.consultationDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {consultation.chiefComplaint && (
                  <div className="mt-3">
                    <p className="text-xs text-white/40 mb-1.5">Motiv principal:</p>
                    <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                      {consultation.chiefComplaint}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-purple-300/70">
                  <FileText className="w-3 h-3" />
                  <span>Vezi detalii consultație</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        );
      }))}
    </div>
  );
}
