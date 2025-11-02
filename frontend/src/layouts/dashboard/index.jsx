import { useState, useMemo } from 'react';
import { useAppointments } from '../../context/AppointmentContext';
import { VisionSidebar } from './components/VisionSidebar';
import { VisionTopBar } from './components/VisionTopBar';
import { PatientHeader } from './components/PatientHeader';
import { PatientOverviewStats } from './components/PatientOverviewStats';
import { 
  Calendar, Clock, FileText, Download, Upload, CheckCircle, 
  XCircle, AlertCircle, Stethoscope, Mail, Phone, Edit,
  User, History, CreditCard, Bot, Sparkles, Pill
} from 'lucide-react';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const { appointments } = useAppointments();

  // Format date from YYYY-MM-DD to DD.MM.YYYY
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Separate appointments into active and completed
  const appointmentsData = useMemo(() => {
    const now = new Date();
    const active = appointments.filter(apt => {
      if (apt.status === 'completed' || apt.status === 'cancelled') return false;
      const aptDate = new Date(`${apt.date}T${apt.time}`);
      return aptDate >= now;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    const completed = appointments.filter(apt => {
      if (apt.status === 'completed') return true;
      if (apt.status === 'cancelled') return false;
      const aptDate = new Date(`${apt.date}T${apt.time}`);
      return aptDate < now;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

    return { active, completed };
  }, [appointments]);

  // Mock data
  const patientProfile = {
    firstName: 'Ion',
    lastName: 'Popescu',
    email: 'ion.popescu@email.com',
    phone: '+40 721 123 456',
    age: 34
  };

  const medicalProfile = {
    bloodType: 'A+',
    allergies: 'Polen, Penicilină',
    chronicConditions: 'Hipertensiune',
    medications: 'Aspirin 100mg zilnic',
    insuranceNumber: 'RO123456789'
  };

  const files = [
    { id: 1, name: 'Analize Sange 2024.pdf', date: '15.01.2024', type: 'Analize', size: '2.4 MB', category: 'analize', starred: true },
    { id: 2, name: 'Radiografie Torace.jpg', date: '10.12.2023', type: 'Imagini', size: '5.2 MB', category: 'imagistica', starred: false },
    { id: 3, name: 'Rezultate EKG.pdf', date: '05.11.2023', type: 'Teste', size: '1.8 MB', category: 'analize', starred: false }
  ];

  const ongoingTreatments = [
    { 
      id: 1, 
      name: 'Tratament Hipertensiune', 
      medication: 'Aspirină',
      dosage: '100mg',
      doctor: 'Dr. Alina Ion',
      startDate: '01.12.2023',
      progress: 75,
      nextCheckup: '15.02.2024',
      frequency: '1x/zi',
      timing: 'Dimineața'
    }
  ];

  const consultations = [
    { 
      id: 1, 
      doctor: 'Dr. Alina Ion', 
      date: '15.01.2024', 
      diagnosis: 'Hipertensiune arterială ușoară',
      notes: 'Tensiune arterială: 140/90. Recomandat tratament și monitorizare.',
      prescription: 'Aspirin 100mg zilnic, măsurători zilnice'
    }
  ];

  const subscription = {
    hasAISubscription: true,
    plan: 'Premium',
    price: '99',
    startDate: '01.01.2024',
    endDate: '31.12.2024',
    renewalDate: '15 Dec 2024',
    features: ['Chat AI', 'Analiză Profil Medical', 'Analiză Tratament', 'Analiză Fisiere', 'Consultații telemedicină nelimitate']
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <>
            {/* Page Header */}
            <div className="mb-12">
              <h1 className="text-white mb-2">Profil Pacient</h1>
              <p className="text-white/40">Informații medicale complete</p>
            </div>

            {/* Patient Header */}
            <div className="mb-8">
              <PatientHeader 
                firstName={patientProfile.firstName}
                lastName={patientProfile.lastName}
                email={patientProfile.email}
                phone={patientProfile.phone}
                age={patientProfile.age}
                bloodType={medicalProfile.bloodType}
              />
            </div>

            {/* Overview Stats */}
            <div className="mb-8">
              <PatientOverviewStats 
                totalAppointments={appointments.length}
                totalDocuments={files.length}
                activePrescriptions={ongoingTreatments.length}
                nextVisit={appointmentsData.active.length > 0 ? 'În curând' : 'Fără programări'}
                nextVisitDate={appointmentsData.active.length > 0 ? `${formatDate(appointmentsData.active[0].date)}, ${appointmentsData.active[0].time}` : ''}
              />
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Main Content */}
              <div className="xl:col-span-2 space-y-8">
                {/* Health Metrics */}
                <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
                  <h3 className="text-white mb-6">Metrici de sănătate</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-white/40 text-sm mb-3">Greutate</p>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-white text-3xl">68</span>
                        <span className="text-white/30 text-sm">kg</span>
                      </div>
                      <p className="text-emerald-400 text-xs mb-1">-2.5 kg</p>
                      <p className="text-white/20 text-xs">15 Oct 2024</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-sm mb-3">IMC</p>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-white text-3xl">24.9</span>
                        <span className="text-white/30 text-sm">kg/m²</span>
                      </div>
                      <p className="text-emerald-400 text-xs mb-1">-1.2</p>
                      <p className="text-white/20 text-xs">15 Oct 2024</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-sm mb-3">Glicemie</p>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-white text-3xl">95</span>
                        <span className="text-white/30 text-sm">mg/dL</span>
                      </div>
                      <p className="text-white/20 text-xs">10 Oct 2024</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-sm mb-3">Presiune</p>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-white text-3xl">125/80</span>
                        <span className="text-white/30 text-sm">mmHg</span>
                      </div>
                      <p className="text-white/20 text-xs">15 Oct 2024</p>
                    </div>
                  </div>
                </div>

                {/* Appointment History */}
                <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
                  <h3 className="text-white mb-6">Programări</h3>
                  <div className="space-y-3">
                    {appointmentsData.active.slice(0, 4).map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 p-5 bg-white/[0.02] rounded-xl border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-200"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white text-sm">Consultație</p>
                            <span className="text-white/20">•</span>
                            <p className="text-white/40 text-sm">{apt.doctorName}</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-white/30">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(apt.date)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {apt.time}
                            </span>
                          </div>
                        </div>
                        <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs border border-blue-500/20">
                          Programat
                        </span>
                      </div>
                    ))}
                    {appointmentsData.active.length === 0 && (
                      <p className="text-white/40 text-center py-8">Nu ai programări active</p>
                    )}
                  </div>
                </div>

                {/* Medical Documents */}
                <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white">Documente</h3>
                    <button className="text-white/40 hover:text-white text-sm transition-colors">
                      Vezi toate
                    </button>
                  </div>
                  <div className="space-y-2">
                    {files.slice(0, 4).map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-all duration-200 group"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white/40" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-white text-sm truncate">{file.name}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/30">
                            <span>{file.type}</span>
                            <span>•</span>
                            <span>{file.date}</span>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/[0.05] rounded-lg">
                          <Download className="w-4 h-4 text-white/40" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="xl:col-span-1 space-y-4">
                {/* Quick Actions */}
                <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-white text-sm mb-4">Acțiuni rapide</h4>
                  <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all duration-200 text-left">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white/60" />
                      </div>
                      <span className="text-white/80 text-sm">Programare nouă</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all duration-200 text-left">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white/60" />
                      </div>
                      <span className="text-white/80 text-sm">Încarcă document</span>
                    </button>
                  </div>
                </div>

                {/* Medical History */}
                <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                  <h4 className="text-white text-sm mb-4">Condiții medicale</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-white/80 text-sm">{medicalProfile.chronicConditions}</span>
                      <span className="text-white/30 text-xs">Controlată</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-white text-sm mb-4">Alergii</h4>
                    <div className="space-y-2">
                      {medicalProfile.allergies.split(', ').map((allergy, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10"
                        >
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-white/80 text-sm">{allergy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'medical':
        return (
          <div className="space-y-8">
            <div className="mb-12">
              <h1 className="text-white mb-2">Profil Medical</h1>
              <p className="text-white/40">Informații medicale detaliate și istoric complet</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <h3 className="text-white text-lg font-semibold mb-4">Date inițiale</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/40 text-sm">Grupă Sânge</label>
                    <p className="text-white">{medicalProfile.bloodType}</p>
                  </div>
                  <div>
                    <label className="text-white/40 text-sm">Alergii</label>
                    <p className="text-white">{medicalProfile.allergies}</p>
                  </div>
                  <div>
                    <label className="text-white/40 text-sm">Condiții Cronice</label>
                    <p className="text-white">{medicalProfile.chronicConditions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <h3 className="text-white text-lg font-semibold mb-4">Date introduse de medic</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-white/40 text-sm">Medicație Curentă</label>
                    <p className="text-white">{medicalProfile.medications}</p>
                  </div>
                  <div>
                    <label className="text-white/40 text-sm">Număr Asigurare</label>
                    <p className="text-white">{medicalProfile.insuranceNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-6">
            <div className="mb-12">
              <h1 className="text-white mb-2">Fișiere Medicale</h1>
              <p className="text-white/40">Gestionează documentele și rezultatele medicale</p>
            </div>

            <div className="mb-8">
              <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05] border-dashed hover:border-white/10 transition-all duration-200 cursor-pointer">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-white/40" />
                  </div>
                  <h3 className="text-white mb-2">Încarcă documente noi</h3>
                  <p className="text-white/40 text-sm mb-4">PDF, JPG, PNG până la 10MB</p>
                  <button className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-sm transition-all duration-200">
                    Selectează fișiere
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <h4 className="text-white text-sm mb-2">{file.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                    <span>{file.type}</span>
                    <span>•</span>
                    <span>{file.date}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex-1 p-2 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg transition-all flex items-center justify-center gap-2">
                      <Download className="w-3 h-3 text-white/60" />
                      <span className="text-white/80 text-xs">Descarcă</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'treatments':
        return (
          <div className="space-y-6">
            <div className="mb-12">
              <h1 className="text-white mb-2">Tratamente</h1>
              <p className="text-white/40">Gestionează medicația și tratamentele active</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Tratamente active</p>
                    <p className="text-white text-2xl">{ongoingTreatments.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {ongoingTreatments.map((treatment) => (
              <div
                key={treatment.id}
                className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white text-xl font-semibold mb-2">{treatment.medication} {treatment.dosage}</h3>
                      <p className="text-blue-400">Dr. {treatment.doctor}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/40 text-sm">Progres</span>
                      <span className="text-white font-semibold">{treatment.progress}%</span>
                    </div>
                    <div className="w-full bg-white/[0.05] rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] h-2 rounded-full transition-all"
                        style={{ width: `${treatment.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/[0.05]">
                    <div>
                      <label className="text-white/40 text-sm">Data început</label>
                      <p className="text-white">{treatment.startDate}</p>
                    </div>
                    <div>
                      <label className="text-white/40 text-sm">Următorul control</label>
                      <p className="text-white">{treatment.nextCheckup}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-6">
            <div className="mb-12">
              <h1 className="text-white mb-2">Programări</h1>
              <p className="text-white/40">Gestionează consultațiile și programările medicale</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Următoarea</p>
                    <p className="text-white">
                      {appointmentsData.active.length > 0 
                        ? `${formatDate(appointmentsData.active[0].date)}, ${appointmentsData.active[0].time}`
                        : 'Niciuna'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Programări luna aceasta</p>
                    <p className="text-white text-2xl">{appointments.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-white mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Active ({appointmentsData.active.length})
              </h3>
              {appointmentsData.active.length === 0 ? (
                <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05] text-center">
                  <p className="text-white/40">Nu ai programări active</p>
                </div>
              ) : (
                appointmentsData.active.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05] mb-4 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white text-lg font-semibold mb-2">{apt.doctorName}</h4>
                        <div className="space-y-1">
                          <p className="text-white/40">Data: {formatDate(apt.date)}</p>
                          <p className="text-white/40">Ora: {apt.time}</p>
                          {apt.notes && (
                            <p className="text-blue-400 text-sm mt-2">Note: {apt.notes}</p>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs border border-emerald-500/20">
                        Confirmat
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <h3 className="text-white mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Finalizate ({appointmentsData.completed.length})
              </h3>
              {appointmentsData.completed.length === 0 ? (
                <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05] text-center opacity-75">
                  <p className="text-white/40">Nu ai programări finalizate</p>
                </div>
              ) : (
                appointmentsData.completed.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05] mb-4 opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white text-lg font-semibold mb-2">{apt.doctorName}</h4>
                        <div className="space-y-1">
                          <p className="text-white/40">Data: {formatDate(apt.date)}</p>
                          <p className="text-white/40">Ora: {apt.time}</p>
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div className="mb-12">
              <h1 className="text-white mb-2">Istoric Medical</h1>
              <p className="text-white/40">Cronologia completă a activității medicale</p>
            </div>

            {consultations.map((consult) => (
              <div
                key={consult.id}
                className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white text-xl font-semibold mb-1">{consult.doctor}</h3>
                    <p className="text-white/40">{consult.date}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                  <div>
                    <label className="text-white/40 text-sm">Diagnostic</label>
                    <p className="text-white">{consult.diagnosis}</p>
                  </div>
                  <div>
                    <label className="text-white/40 text-sm">Notițe</label>
                    <p className="text-white">{consult.notes}</p>
                  </div>
                  <div>
                    <label className="text-white/40 text-sm">Prescripție</label>
                    <p className="text-white">{consult.prescription}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6">
            <div className="mb-12">
              <h1 className="text-white mb-2">Abonament</h1>
              <p className="text-white/40">Gestionează planul și beneficiile tale</p>
            </div>

            {subscription.hasAISubscription ? (
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.08] flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-white">Plan {subscription.plan}</h2>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs border border-yellow-500/30">
                          Activ
                        </span>
                      </div>
                      <p className="text-white/60">Se reînnoiește la {subscription.renewalDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-sm mb-1">Preț lunar</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-white text-3xl">{subscription.price}</span>
                      <span className="text-white/60">RON/lună</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05] text-center">
                <XCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">Nu ai abonament AI activ</h3>
                <p className="text-white/40 mb-6">Cumpără un abonament pentru acces la Asistent AI</p>
                <button className="px-4 py-2 bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white rounded-xl">
                  Cumpără Abonament
                </button>
              </div>
            )}
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div className="mb-12">
              <h1 className="text-white mb-2">Asistent AI</h1>
              <p className="text-white/40">Asistent medical inteligent pentru răspunsuri rapide</p>
            </div>

            {subscription.hasAISubscription ? (
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-semibold">Chat AI</h3>
                    <p className="text-white/40">Pune întrebări despre profilul tău medical</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-white/[0.05] rounded-2xl p-4">
                    <p className="text-white">Bună! Sunt asistentul tău AI medical. Cu ce te pot ajuta?</p>
                  </div>

                  <div className="space-y-2">
                    <button className="w-full justify-start px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] text-white/80 rounded-xl text-sm">
                      Analizează profilul meu medical
                    </button>
                    <button className="w-full justify-start px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] text-white/80 rounded-xl text-sm">
                      Analizează tratamentul meu curent
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/[0.05] pt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Scrie întrebarea ta..."
                      className="flex-1 bg-white/[0.05] border border-white/[0.05] rounded-xl px-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500"
                    />
                    <button className="px-4 py-2 bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white rounded-xl">
                      Trimite
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05] text-center">
                <Bot className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">Ai nevoie de abonament AI</h3>
                <p className="text-white/40 mb-6">Cumpără un abonament pentru a accesa Asistent AI</p>
                <button className="px-4 py-2 bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white rounded-xl">
                  Cumpără Abonament
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Top right large orb */}
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#1e3a8a]/30 via-[#1e40af]/20 to-transparent blur-[100px]" />
        
        {/* Bottom left orb */}
        <div className="absolute -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#0e7490]/25 via-[#0891b2]/15 to-transparent blur-[80px]" />
        
        {/* Center accent */}
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#3b82f6]/20 to-transparent blur-[90px]" />
      </div>

      {/* Sidebar */}
      <VisionSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <div className="lg:pl-[280px] min-h-screen relative z-10">
        {/* Top Bar */}
        <VisionTopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content Area */}
        <main className="p-8 lg:p-12 max-w-[1600px] mx-auto">
          {renderContent()}
        </main>
      </div>

      {/* Help Button */}
      <button className="fixed bottom-8 right-8 w-12 h-12 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-xl rounded-full flex items-center justify-center border border-white/[0.1] transition-all duration-200 z-50 hover:scale-105">
        <span className="text-white/60 text-lg">?</span>
      </button>
    </div>
  );
}
