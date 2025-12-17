import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VisionSidebar } from './components/VisionSidebar';
import { PatientHeader } from './components/PatientHeader';
import { PatientOverviewStats } from './components/PatientOverviewStats';
import {
  Calendar,
  Clock,
  FileText,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  Mail,
  Phone,
  Edit,
  User,
  History,
  CreditCard,
  Bot,
  Sparkles,
  Pill,
  Save,
  Pencil,
  Eye,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit3,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const { user, setUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMedical, setSavingMedical] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [medicalEditing, setMedicalEditing] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingValue, setRenamingValue] = useState('');

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
  });

  const [medicalForm, setMedicalForm] = useState({
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    medications: '',
    insuranceNumber: '',
    weightKg: '',
    weightChange: '',
    weightDate: '',
    heightCm: '',
    glucose: '',
    glucoseDate: '',
    bloodPressure: '',
    bpDate: '',
  });

  // Load user-bound medical data from localStorage
  useEffect(() => {
    if (!user) return;

    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      age: '',
    });

    const stored = localStorage.getItem(`patientMedicalData-${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMedicalForm((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse stored medical data', e);
      }
    }

    const storedFiles = localStorage.getItem(`patientFiles-${user.id}`);
    if (storedFiles) {
      try {
        setFiles(JSON.parse(storedFiles));
      } catch (e) {
        console.error('Failed to parse stored files', e);
      }
    }
  }, [user]);

  useEffect(() => {
    // Fetch real appointments from backend
    if (user?.id) {
      fetch(`http://localhost:8080/api/appointments/patient/${user.id}`)
        .then(res => res.json())
        .then((data) => {
          const transformed = data.map(apt => ({
            id: apt.id,
            doctorId: apt.doctorId,
            doctorName: apt.doctorName,
            date: apt.date,
            time: apt.time.substring(0, 5), // Get HH:MM
            status: apt.status,
          }));
          setAppointments(transformed);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching appointments:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

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

  const patientProfile = {
    firstName: profileForm.firstName || 'Completează',
    lastName: profileForm.lastName || '',
    email: profileForm.email || '—',
    phone: profileForm.phone || '—',
    age: profileForm.age || '',
  };

  const medicalProfile = {
    bloodType: medicalForm.bloodType || '—',
    allergies: medicalForm.allergies || '',
    chronicConditions: medicalForm.chronicConditions || '—',
    medications: medicalForm.medications || '',
    insuranceNumber: medicalForm.insuranceNumber || '',
  };

  const ongoingTreatments = [];
  const consultations = [];
  const [subscription, setSubscription] = useState({
    hasAISubscription: false,
    plan: 'AI Access',
    price: 50,
    currency: 'EUR',
    startDate: '',
    renewalDate: '',
    features: ['Chat AI', 'Analiză Profil Medical', 'Analiză Tratament', 'Analiză Fișiere'],
  });

  useEffect(() => {
    if (!user?.id) return;
    const stored = localStorage.getItem(`patientSubscription-${user.id}`);
    if (stored) {
      try {
        setSubscription(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse subscription', err);
      }
    }
  }, [user]);

  const persistSubscription = (next) => {
    setSubscription(next);
    if (user?.id) {
      localStorage.setItem(`patientSubscription-${user.id}`, JSON.stringify(next));
    }
  };

  const handleActivateSubscription = () => {
    const now = new Date();
    const renewal = new Date();
    renewal.setMonth(renewal.getMonth() + 1);
    const next = {
      ...subscription,
      hasAISubscription: true,
      startDate: now.toISOString(),
      renewalDate: renewal.toISOString(),
    };
    persistSubscription(next);
  };

  const handleCancelSubscription = () => {
    const next = {
      ...subscription,
      hasAISubscription: false,
      startDate: '',
      renewalDate: '',
    };
    persistSubscription(next);
  };

  const healthMetrics = {
    weight: medicalForm.weightKg,
    weightChange: medicalForm.weightChange,
    weightDate: medicalForm.weightDate,
    height: medicalForm.heightCm,
    glucose: medicalForm.glucose,
    glucoseDate: medicalForm.glucoseDate,
    bloodPressure: medicalForm.bloodPressure,
    bpDate: medicalForm.bpDate,
  };

  const handleProfileSave = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          email: profileForm.email,
          phone: profileForm.phone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      const newUserData = {
        ...user,
        firstName: updatedUser.firstName || profileForm.firstName,
        lastName: updatedUser.lastName || profileForm.lastName,
        phone: updatedUser.phone || profileForm.phone,
        email: updatedUser.email || profileForm.email,
      };
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      setProfileEditing(false);
    } catch (err) {
      console.error('Error updating patient profile:', err);
      alert('Nu am putut salva profilul. Încearcă din nou.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMedicalSave = () => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`patientMedicalData-${user.id}`, JSON.stringify(medicalForm));
      setMedicalEditing(false);
    } catch (err) {
      console.error('Failed to save medical data', err);
      alert('Nu am putut salva datele medicale.');
    } finally {
      setSavingMedical(false);
    }
  };

  const persistFiles = (nextFiles) => {
    if (!user?.id) return;
    setFiles(nextFiles);
    localStorage.setItem(`patientFiles-${user.id}`, JSON.stringify(nextFiles));
  };

  const handleFileUpload = (fileList) => {
    if (!fileList?.length) return;
    const uploads = Array.from(fileList);
    uploads.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        const next = [
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            uploadedAt: new Date().toISOString(),
            dataUrl,
          },
          ...files,
        ];
        persistFiles(next);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteFile = (id) => {
    const next = files.filter((f) => f.id !== id);
    persistFiles(next);
    if (previewFile?.id === id) setPreviewFile(null);
  };

  const handleRename = (id) => {
    if (!renamingValue.trim()) {
      setRenamingId(null);
      return;
    }
    const next = files.map((f) => (f.id === id ? { ...f, name: renamingValue } : f));
    persistFiles(next);
    setRenamingId(null);
    setRenamingValue('');
  };

  const moveFile = (id, direction) => {
    const index = files.findIndex((f) => f.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const next = [...files];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    persistFiles(next);
  };

  const formatSize = (size) => {
    if (!size && size !== 0) return '';
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const renderMetric = (label, value, unit, change, date) => (
    <div>
      <p className="text-white/40 text-sm mb-3">{label}</p>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-white text-3xl">{value || '—'}</span>
        {unit && <span className="text-white/30 text-sm">{unit}</span>}
      </div>
      {change && <p className={`text-xs mb-1 ${Number(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{change}</p>}
      {date && <p className="text-white/20 text-xs">{date}</p>}
    </div>
  );

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

            {/* Editable profile & medical data */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/60 text-sm">Date personale</p>
                    <h3 className="text-white text-lg font-semibold">Profil pacient</h3>
                  </div>
                  <button
                    onClick={() => setProfileEditing((v) => !v)}
                    className="px-3 py-1 text-xs rounded-full bg-white/5 text-white/80 flex items-center gap-2 hover:bg-white/10 transition"
                  >
                    <Pencil className="w-4 h-4" /> {profileEditing ? 'Anulează' : 'Editare'}
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Prenume</label>
                      <Input
                        disabled={!profileEditing}
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                        placeholder="Prenume"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Nume</label>
                      <Input
                        disabled={!profileEditing}
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                        placeholder="Nume"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Email</label>
                      <Input
                        disabled={!profileEditing}
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="Email"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Telefon</label>
                      <Input
                        disabled={!profileEditing}
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+40 ..."
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Vârstă</label>
                      <Input
                        disabled={!profileEditing}
                        type="number"
                        value={profileForm.age}
                        onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
                        placeholder="Ani"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                  </div>
                  {profileEditing && (
                    <button
                      onClick={handleProfileSave}
                      disabled={savingProfile}
                      className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      {savingProfile ? 'Se salvează...' : 'Salvează profilul'}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/60 text-sm">Date medicale</p>
                    <h3 className="text-white text-lg font-semibold">Istoric medical</h3>
                  </div>
                  <button
                    onClick={() => setMedicalEditing((v) => !v)}
                    className="px-3 py-1 text-xs rounded-full bg-white/5 text-white/80 flex items-center gap-2 hover:bg-white/10 transition"
                  >
                    <Pencil className="w-4 h-4" /> {medicalEditing ? 'Anulează' : 'Editare'}
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Grupă sangvină</label>
                      <Select
                        value={medicalForm.bloodType}
                        onValueChange={(val) => setMedicalForm((p) => ({ ...p, bloodType: val }))}
                        disabled={!medicalEditing}
                      >
                        <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white rounded-xl disabled:opacity-60">
                          <SelectValue placeholder="Selectează grupa" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1f3d] text-white border-[#2d4a7c]">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map((bt) => (
                            <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Număr asigurare</label>
                      <Input
                        disabled={!medicalEditing}
                        value={medicalForm.insuranceNumber}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, insuranceNumber: e.target.value }))}
                        placeholder="ID asigurare"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Alergii</label>
                    <textarea
                      disabled={!medicalEditing}
                      value={medicalForm.allergies}
                      onChange={(e) => setMedicalForm((p) => ({ ...p, allergies: e.target.value }))}
                      placeholder="Listează alergiile separate prin virgulă"
                      className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] text-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Condiții cronice</label>
                    <textarea
                      disabled={!medicalEditing}
                      value={medicalForm.chronicConditions}
                      onChange={(e) => setMedicalForm((p) => ({ ...p, chronicConditions: e.target.value }))}
                      placeholder="ex: Hipertensiune"
                      className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] text-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Medicație curentă</label>
                    <textarea
                      disabled={!medicalEditing}
                      value={medicalForm.medications}
                      onChange={(e) => setMedicalForm((p) => ({ ...p, medications: e.target.value }))}
                      placeholder="ex: Aspirin 100mg zilnic"
                      className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] text-white px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Greutate (kg)</label>
                      <Input
                        disabled={!medicalEditing}
                        value={medicalForm.weightKg}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, weightKg: e.target.value }))}
                        placeholder="ex: 68"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Variație greutate</label>
                      <Input
                        disabled={!medicalEditing}
                        value={medicalForm.weightChange}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, weightChange: e.target.value }))}
                        placeholder="ex: -0.5 kg"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Înălțime (cm)</label>
                      <Input
                        disabled={!medicalEditing}
                        value={medicalForm.heightCm}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, heightCm: e.target.value }))}
                        placeholder="ex: 175"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Glicemie (mg/dL)</label>
                      <Input
                        disabled={!medicalEditing}
                        value={medicalForm.glucose}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, glucose: e.target.value }))}
                        placeholder="ex: 95"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Tensiune (mmHg)</label>
                      <Input
                        disabled={!medicalEditing}
                        value={medicalForm.bloodPressure}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, bloodPressure: e.target.value }))}
                        placeholder="ex: 125/80"
                        className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                      />
                    </div>
                  </div>
                  {medicalEditing && (
                    <button
                      onClick={handleMedicalSave}
                      disabled={savingMedical}
                      className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      {savingMedical ? 'Se salvează...' : 'Salvează datele medicale'}
                    </button>
                  )}
                </div>
              </div>
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
                  {renderMetric('Greutate', healthMetrics.weight, 'kg', healthMetrics.weightChange, healthMetrics.weightDate)}
                  {renderMetric('Înălțime', healthMetrics.height, 'cm', '', '')}
                  {renderMetric('Glicemie', healthMetrics.glucose, 'mg/dL', '', healthMetrics.glucoseDate)}
                  {renderMetric('Presiune', healthMetrics.bloodPressure, 'mmHg', '', healthMetrics.bpDate)}
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
                    <button
                      className="text-white/40 hover:text-white text-sm transition-colors"
                      onClick={() => setActiveSection('files')}
                    >
                      Vezi toate
                    </button>
                  </div>
                  {files.length === 0 ? (
                    <p className="text-white/40 text-sm">Nu ai încărcat documente încă.</p>
                  ) : (
                    <div className="space-y-2">
                      {files.slice(0, 4).map((file) => {
                        const isImage = file.type?.startsWith('image/');
                        const isPdf = file.type?.includes('pdf');
                        return (
                          <div
                            key={file.id}
                            className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-all duration-200 group cursor-pointer"
                            onClick={() => setPreviewFile(file)}
                          >
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-lg bg-white/[0.05] flex items-center justify-center overflow-hidden">
                                {isImage ? (
                                  <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-white/50 text-[11px]">
                                    <FileText className="w-4 h-4 text-white/60" />
                                    {isPdf ? 'PDF' : 'DOC'}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-white text-sm truncate">{file.name}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-white/40">
                                <span className="truncate">{file.type || 'fișier'}</span>
                                <span>•</span>
                                <span>{new Date(file.uploadedAt).toLocaleDateString('ro-RO')}</span>
                                <span>•</span>
                                <span>{formatSize(file.size)}</span>
                              </div>
                            </div>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/[0.05] rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                            >
                              <Eye className="w-4 h-4 text-white/60" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                      <span className="text-white/80 text-sm">{medicalProfile.chronicConditions || 'Necompletat'}</span>
                      <span className="text-white/30 text-xs">Controlată</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-white text-sm mb-4">Alergii</h4>
                    <div className="space-y-2">
                      {(medicalProfile.allergies ? medicalProfile.allergies.split(',') : []).map((allergy, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10"
                        >
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-white/80 text-sm">{allergy.trim()}</span>
                        </div>
                      ))}
                      {!medicalProfile.allergies && (
                        <div className="text-white/40 text-sm">Nu ai adăugat alergii</div>
                      )}
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
              <div
                className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05] border-dashed hover:border-white/10 transition-all duration-200 cursor-pointer"
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-white/40" />
                  </div>
                  <h3 className="text-white mb-2">Încarcă documente noi</h3>
                  <p className="text-white/40 text-sm mb-4">PDF, JPG, PNG până la 10MB</p>
                  <button className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-sm transition-all duration-200">
                    Selectează fișiere
                  </button>
                  <input
                    id="file-upload-input"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleFileUpload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </div>

            {files.length === 0 ? (
              <div className="text-white/60 text-center py-10 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                Nu ai încărcat documente încă.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file, idx) => {
                  const isImage = file.type?.startsWith('image/');
                  const isPdf = file.type?.includes('pdf');
                  return (
                    <div
                      key={file.id}
                      className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-200 group flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            {renamingId === file.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={renamingValue}
                                  onChange={(e) => setRenamingValue(e.target.value)}
                                  className="bg-white/[0.04] border-white/[0.08] text-white h-9"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRename(file.id)}
                                  className="px-2 py-1 text-xs rounded-lg bg-white/10 text-white hover:bg-white/20"
                                >
                                  OK
                                </button>
                              </div>
                            ) : (
                              <div className="text-white text-sm font-semibold truncate max-w-[150px]" title={file.name}>
                                {file.name}
                              </div>
                            )}
                            <div className="text-white/40 text-xs">
                              {formatSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('ro-RO')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
                            onClick={() => moveFile(file.id, 'up')}
                            disabled={idx === 0}
                          >
                            <ArrowUp className="w-4 h-4 text-white/70" />
                          </button>
                          <button
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
                            onClick={() => moveFile(file.id, 'down')}
                            disabled={idx === files.length - 1}
                          >
                            <ArrowDown className="w-4 h-4 text-white/70" />
                          </button>
                        </div>
                      </div>

                      <div
                        className="rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05] h-40 flex items-center justify-center cursor-pointer"
                        onClick={() => setPreviewFile(file)}
                      >
                        {isImage ? (
                          <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                        ) : isPdf ? (
                          <div className="flex flex-col items-center justify-center text-white/60 text-sm gap-2">
                            <FileText className="w-8 h-8" />
                            <span>PDF</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-white/60 text-sm gap-2">
                            <FileText className="w-8 h-8" />
                            <span>Fișier</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1 text-white/80 text-xs"
                            onClick={() => setPreviewFile(file)}
                          >
                            <Eye className="w-4 h-4" /> Vizualizează
                          </button>
                          <button
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-1 text-white/80 text-xs"
                            onClick={() => {
                              setRenamingId(file.id);
                              setRenamingValue(file.name);
                            }}
                          >
                            <Edit3 className="w-4 h-4" /> Redenumește
                          </button>
                        </div>
                        <button
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {previewFile && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-6">
                <div className="bg-[#0b1437] border border-white/10 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div>
                      <p className="text-white font-semibold">{previewFile.name}</p>
                      <p className="text-white/40 text-xs">{formatSize(previewFile.size)}</p>
                    </div>
                    <button
                      className="text-white/60 hover:text-white"
                      onClick={() => setPreviewFile(null)}
                    >
                      Înapoi
                    </button>
                  </div>
                  <div className="flex-1 bg-black/30 flex items-center justify-center overflow-auto">
                    {previewFile.type?.startsWith('image/') ? (
                      <img src={previewFile.dataUrl} alt={previewFile.name} className="max-h-[80vh] object-contain" />
                    ) : previewFile.type?.includes('pdf') ? (
                      <iframe src={previewFile.dataUrl} title={previewFile.name} className="w-full h-[80vh]" />
                    ) : (
                      <div className="text-white/60 p-6">Previzualizare indisponibilă pentru acest tip de fișier.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
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

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.08] flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-white">Plan {subscription.plan}</h2>
                      {subscription.hasAISubscription ? (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs border border-emerald-500/30">
                          Activ
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs border border-yellow-500/30">
                          Neactivat
                        </span>
                      )}
                    </div>
                    <p className="text-white/60">
                      Acces la AI și analiză medicală. {subscription.hasAISubscription ? 'Reînnoire automată lunar.' : 'Activează pentru a porni accesul.'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-sm mb-1">Preț lunar</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-3xl">{subscription.price}</span>
                    <span className="text-white/60">{subscription.currency}/lună</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {subscription.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {subscription.hasAISubscription ? (
                  <>
                    <button
                      onClick={handleActivateSubscription}
                      className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl shadow-lg shadow-blue-500/20 border border-white/15"
                    >
                      Reînnoiește / menține activ
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="px-4 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-200 rounded-xl border border-red-500/30"
                    >
                      Anulează abonamentul
                    </button>
                    <div className="text-white/60 text-sm">
                      Activ din {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('ro-RO') : '—'}
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleActivateSubscription}
                    className="px-4 py-3 bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white rounded-xl shadow-lg shadow-blue-500/20"
                  >
                    Activează abonament (50€)
                  </button>
                )}
              </div>
            </div>
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
                <p className="text-white/40 mb-6">Activează abonamentul de 50€ pentru a accesa Asistent AI</p>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white rounded-xl"
                  onClick={() => setActiveSection('subscription')}
                >
                  Mergi la abonament
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
      <div className="lg:pl-[280px] min-h-screen relative z-10 pt-8 lg:pt-10">
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
