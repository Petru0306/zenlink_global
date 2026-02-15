import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, FileText, ChevronRight, Stethoscope, Search } from 'lucide-react';
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

interface DoctorInfo {
  id: number;
  firstName: string;
  lastName: string;
}

interface PatientConsultationsListProps {
  patientId: number;
  onSelectConsultation: (consultation: FinalizedConsultation) => void;
}

export function PatientConsultationsList({ patientId, onSelectConsultation }: PatientConsultationsListProps) {
  const [consultations, setConsultations] = useState<FinalizedConsultation[]>([]);
  const [doctors, setDoctors] = useState<Map<number, DoctorInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Group consultations by doctor and count them
  const consultationsWithNumbers = useMemo(() => {
    const doctorCounts = new Map<number, number>();
    const result: Array<FinalizedConsultation & { consultationNumber: number }> = [];
    
    // Sort by date descending
    const sorted = [...consultations].sort((a, b) => 
      new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime()
    );
    
    sorted.forEach(consultation => {
      const count = (doctorCounts.get(consultation.doctorId) || 0) + 1;
      doctorCounts.set(consultation.doctorId, count);
      result.push({ ...consultation, consultationNumber: count });
    });
    
    return result;
  }, [consultations]);
  
  // Filter consultations by search query
  const filteredConsultations = useMemo(() => {
    if (!searchQuery.trim()) {
      return consultationsWithNumbers;
    }
    
    const query = searchQuery.toLowerCase();
    return consultationsWithNumbers.filter(consultation => {
      const doctor = doctors.get(consultation.doctorId);
      const doctorName = doctor 
        ? `${doctor.firstName} ${doctor.lastName}`.toLowerCase()
        : '';
      const complaint = consultation.chiefComplaint?.toLowerCase() || '';
      
      return doctorName.includes(query) || complaint.includes(query);
    });
  }, [consultationsWithNumbers, doctors, searchQuery]);

  useEffect(() => {
    if (!patientId || patientId === 0) {
      setLoading(false);
      setError('ID pacient invalid');
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch finalized consultations for patient
    fetch(`http://localhost:8080/api/appointments/patient/${patientId}/finalized`)
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
        
        // Fetch doctor info for each unique doctor
        const uniqueDoctorIds = [...new Set(data.map(c => c.doctorId))];
        const doctorPromises = uniqueDoctorIds.map(doctorId =>
          fetch(`http://localhost:8080/api/users/${doctorId}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`Failed to fetch doctor ${doctorId}`);
              }
              return res.json();
            })
            .then((doctor: DoctorInfo) => {
              if (doctor && doctor.id && (doctor.firstName || doctor.lastName)) {
                return { id: doctorId, doctor };
              }
              throw new Error('Invalid doctor data');
            })
            .catch((err) => {
              console.error(`Error fetching doctor ${doctorId}:`, err);
              return { id: doctorId, doctor: null };
            })
        );
        
        Promise.all(doctorPromises).then(results => {
          const doctorMap = new Map<number, DoctorInfo>();
          results.forEach(({ id, doctor }) => {
            if (doctor && doctor.firstName && doctor.lastName) {
              doctorMap.set(id, doctor);
            }
          });
          setDoctors(doctorMap);
          setLoading(false);
        });
      })
      .catch(err => {
        console.error('Error fetching consultations:', err);
        setError('Eroare la încărcarea consultațiilor');
        setLoading(false);
      });
  }, [patientId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <p className="text-xs text-white/50">Verifică că ești autentificat ca pacient.</p>
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
          Consultațiile finalizate vor apărea aici, organizate cronologic, pentru a-ți oferi o vedere clară asupra istoricului tău medical.
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
          placeholder="Caută după nume doctor sau motiv..."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredConsultations.map((consultation) => {
            const doctor = doctors.get(consultation.doctorId);
            const doctorName = doctor 
              ? `${doctor.firstName} ${doctor.lastName}`
              : `Doctor #${consultation.doctorId}`;
            
            const consultationTitle = doctor
              ? `Consultatie ${doctor.firstName} ${doctor.lastName} #${consultation.consultationNumber}`
              : `Consultatie Doctor #${consultation.doctorId} #${consultation.consultationNumber}`;

            return (
              <div
                key={consultation.id}
                onClick={() => onSelectConsultation(consultation)}
                className="group relative backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-4 border border-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 flex flex-col"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 flex-shrink-0">
                      <Stethoscope className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors line-clamp-2">
                        {consultationTitle}
                      </h3>
                      <div className="flex flex-col gap-1 text-xs text-white/50 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{formatDate(consultation.consultationDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{formatTime(consultation.consultationDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {consultation.chiefComplaint && (
                    <div className="mt-2 flex-1">
                      <p className="text-xs text-white/40 mb-1">Motiv principal:</p>
                      <p className="text-xs text-white/70 leading-relaxed line-clamp-3">
                        {consultation.chiefComplaint}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-purple-300/70">
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Vezi detalii</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
