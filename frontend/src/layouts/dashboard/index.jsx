import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
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
  Brain,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
const API_BASE = 'http://localhost:8080';
import { AiChat } from '../../components/AiChat';
import { medicalProfileService } from '../../services/medicalProfileService';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const { user, setUser, psychProfile, psychProfileLoading, refreshPsychProfile } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMedical, setSavingMedical] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [medicalEditing, setMedicalEditing] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewAiOpen, setPreviewAiOpen] = useState(false);
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

  const normalizeServerFiles = (serverList, prevFiles = []) => {
    const dataUrlById = new Map((prevFiles || []).map((f) => [String(f.id), f.dataUrl || null]));
    return (Array.isArray(serverList) ? serverList : []).map((f) => ({
      id: String(f.id),
      name: f.name,
      type: f.contentType,
      size: f.size,
      uploadedAt: f.uploadedAt,
      sortRank: f.sortRank,
      dataUrl: dataUrlById.get(String(f.id)) || null,
    }));
  };

  const fetchPatientFiles = async () => {
    if (!user?.id) return;
    const res = await fetch(`${API_BASE}/api/patient-files/patient/${user.id}`);
    if (!res.ok) throw new Error('Failed to load files');
    const list = await res.json();
    setFiles((prev) => normalizeServerFiles(list, prev));
  };

  const ensureFileDataUrl = async (file) => {
    if (!file?.id) return null;
    if (file.dataUrl) return file.dataUrl;
    const res = await fetch(`${API_BASE}/api/patient-files/${file.id}/content`);
    if (!res.ok) throw new Error('Failed to load file content');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    setFiles((prev) => prev.map((f) => (String(f.id) === String(file.id) ? { ...f, dataUrl: objectUrl } : f)));
    return objectUrl;
  };

  const openPreview = async (file) => {
    try {
      const dataUrl = await ensureFileDataUrl(file);
      setPreviewFile({ ...file, dataUrl });
    } catch (err) {
      console.error(err);
      alert('Nu am putut încărca fișierul pentru previzualizare.');
    }
  };

  // If the preview closes, close the AI overlay as well.
  useEffect(() => {
    if (!previewFile) setPreviewAiOpen(false);
  }, [previewFile]);

  // Load user-bound medical data from backend
  useEffect(() => {
    if (!user) return;

    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      age: user.age ?? '',
    });

    // Load medical data from backend
    medicalProfileService.getMyProfile()
      .then((profile) => {
        setMedicalForm({
          bloodType: profile.bloodType || '',
          allergies: profile.allergies || '',
          chronicConditions: profile.chronicConditions || '',
          medications: profile.medications || '',
          insuranceNumber: profile.insuranceNumber || '',
          weightKg: profile.weightKg || '',
          weightChange: profile.weightChange || '',
          weightDate: profile.weightDate || '',
          heightCm: profile.heightCm || '',
          glucose: profile.glucose || '',
          glucoseDate: profile.glucoseDate || '',
          bloodPressure: profile.bloodPressure || '',
          bpDate: profile.bpDate || '',
        });
      })
      .catch((err) => {
        console.error('Failed to load medical profile from backend:', err);
        // Fallback to localStorage if backend fails
        const stored = localStorage.getItem(`patientMedicalData-${user.id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setMedicalForm((prev) => ({ ...prev, ...parsed }));
          } catch (e) {
            console.error('Failed to parse stored medical data', e);
          }
        }
      });

    fetchPatientFiles().catch((err) => {
      console.error('Failed to load files from backend:', err);
    });
  }, [user]);

  useEffect(() => {
    if (user && !psychProfile && !psychProfileLoading) {
      refreshPsychProfile();
    }
  }, [psychProfile, psychProfileLoading, refreshPsychProfile, user]);

  // Cleanup object URLs (avoid memory leaks)
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (typeof f?.dataUrl === 'string' && f.dataUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(f.dataUrl);
          } catch {}
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cursor tracking effect
  useEffect(() => {
    if (activeSection !== 'profile') return;
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeSection]);

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
  const parseDateLocal = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.includes('.') ? dateStr.split('.') : dateStr.split('-');
    let y, m, d;
    if (dateStr.includes('.')) {
      [d, m, y] = parts.map(Number);
    } else {
      [y, m, d] = parts.map(Number);
    }
    if ([y, m, d].some((v) => Number.isNaN(v))) return null;
    const dt = new Date(y, (m ?? 1) - 1, d);
    return dt;
  };

  const formatDate = (dateStr) => {
    const date = parseDateLocal(dateStr);
    if (!date) return dateStr || '';
    return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const toLocalTimestamp = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return NaN;
    const parts = dateStr.includes('.') ? dateStr.split('.') : dateStr.split('-');
    let y, m, d;
    if (dateStr.includes('.')) {
      [d, m, y] = parts.map(Number);
    } else {
      [y, m, d] = parts.map(Number);
    }
    const [hh, mm] = timeStr.split(':').map(Number);
    if ([y, m, d, hh, mm].some((v) => Number.isNaN(v))) return NaN;
    const dt = new Date(y, (m ?? 1) - 1, d, hh, mm);
    return dt.getTime();
  };

  // Separate appointments into active and completed
  const appointmentsData = useMemo(() => {
    const nowTs = Date.now();
    const active = appointments
      .filter((apt) => {
        const status = (apt.status || '').toLowerCase();
        if (status === 'cancelled') return false;
        const ts = toLocalTimestamp(apt.date, apt.time);
        if (Number.isNaN(ts)) return false;
        // future appointments are active regardless of status label
        return ts >= nowTs;
      })
      .sort((a, b) => {
        const aTs = toLocalTimestamp(a.date, a.time);
        const bTs = toLocalTimestamp(b.date, b.time);
        return aTs - bTs;
      });

    const completed = appointments
      .filter((apt) => {
        const status = (apt.status || '').toLowerCase();
        if (status === 'cancelled') return false;
        const ts = toLocalTimestamp(apt.date, apt.time);
        if (Number.isNaN(ts)) return false;
        // past appointments or explicitly completed
        return ts < nowTs || status === 'completed';
      })
      .sort((a, b) => {
        const aTs = toLocalTimestamp(a.date, a.time);
        const bTs = toLocalTimestamp(b.date, b.time);
        return bTs - aTs;
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
      const ageNumber =
        profileForm.age === '' || profileForm.age === null || profileForm.age === undefined
          ? null
          : Number(profileForm.age);
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
          age: Number.isFinite(ageNumber) ? ageNumber : null,
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
        age:
          updatedUser.age ??
          (Number.isFinite(ageNumber) ? ageNumber : user.age),
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

  const handleMedicalSave = async () => {
    if (!user?.id) {
      alert('Trebuie să fii autentificat pentru a salva datele medicale.');
      return;
    }
    setSavingMedical(true);
    try {
      console.log('Saving medical profile for user:', user.id);
      console.log('Medical form data:', medicalForm);
      
      const response = await medicalProfileService.upsertProfile({
        bloodType: medicalForm.bloodType || undefined,
        allergies: medicalForm.allergies || undefined,
        chronicConditions: medicalForm.chronicConditions || undefined,
        medications: medicalForm.medications || undefined,
        insuranceNumber: medicalForm.insuranceNumber || undefined,
        weightKg: medicalForm.weightKg || undefined,
        weightChange: medicalForm.weightChange || undefined,
        weightDate: medicalForm.weightDate || undefined,
        heightCm: medicalForm.heightCm || undefined,
        glucose: medicalForm.glucose || undefined,
        glucoseDate: medicalForm.glucoseDate || undefined,
        bloodPressure: medicalForm.bloodPressure || undefined,
        bpDate: medicalForm.bpDate || undefined,
      });
      
      console.log('Medical profile saved successfully:', response);
      
      // Also save to localStorage as backup
      localStorage.setItem(`patientMedicalData-${user.id}`, JSON.stringify(medicalForm));
      setMedicalEditing(false);
      alert('Datele medicale au fost salvate cu succes!');
    } catch (err) {
      console.error('Failed to save medical data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Eroare necunoscută';
      alert(`Nu am putut salva datele medicale: ${errorMessage}\n\nVerifică consola pentru detalii.`);
    } finally {
      setSavingMedical(false);
    }
  };

  const handleFileUpload = (fileList) => {
    if (!fileList?.length) return;
    const uploads = Array.from(fileList);
    uploads.forEach((file) => {
      const clientId = `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const placeholder = {
        id: clientId,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl: null,
        uploading: true,
      };

      setFiles((prev) => [placeholder, ...prev]);

      // Optional: show immediate preview for images (DataURL) while upload runs
      if (file.type?.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result;
          if (typeof dataUrl === 'string') {
            setFiles((prev) => prev.map((f) => (f.id === clientId ? { ...f, dataUrl } : f)));
          }
        };
        reader.readAsDataURL(file);
      }

      (async () => {
        try {
          if (!user?.id) throw new Error('Not logged in');
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch(`${API_BASE}/api/patient-files/patient/${user.id}`, {
            method: 'POST',
            body: fd,
          });
          if (!res.ok) throw new Error('Upload failed');
          const saved = await res.json();
          const savedNormalized = normalizeServerFiles([saved], [])[0];
          setFiles((prev) => prev.map((f) => (f.id === clientId ? { ...savedNormalized, dataUrl: f.dataUrl } : f)));
        } catch (err) {
          console.error(err);
          alert('Nu am putut încărca fișierul. Încearcă din nou.');
          setFiles((prev) => prev.filter((f) => f.id !== clientId));
        }
      })();
    });
  };

  const handleDeleteFile = (id) => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/patient-files/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        setFiles((prev) => prev.filter((f) => String(f.id) !== String(id)));
        if (previewFile?.id === id) setPreviewFile(null);
      } catch (err) {
        console.error(err);
        alert('Nu am putut șterge fișierul.');
      }
    })();
  };

  const handleRename = (id) => {
    if (!renamingValue.trim()) {
      setRenamingId(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/patient-files/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: renamingValue.trim() }),
        });
        if (!res.ok) throw new Error('Rename failed');
        const updated = await res.json();
        setFiles((prev) => {
          const next = normalizeServerFiles([updated], prev);
          return prev.map((f) => (String(f.id) === String(id) ? { ...f, ...next[0] } : f));
        });
        if (previewFile?.id === id) setPreviewFile((prev) => (prev ? { ...prev, name: renamingValue.trim() } : prev));
        setRenamingId(null);
        setRenamingValue('');
      } catch (err) {
        console.error(err);
        alert('Nu am putut redenumi fișierul.');
      }
    })();
  };

  const moveFile = (id, direction) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      if (user?.id) {
        fetch(`${API_BASE}/api/patient-files/patient/${user.id}/order`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: next.map((f) => f.id).filter((x) => !String(x).startsWith('client-')) }),
        })
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Order save failed'))))
          .then((serverList) => setFiles((prev2) => normalizeServerFiles(serverList, prev2)))
          .catch((err) => console.warn(err));
      }
      return next;
    });
  };

  const formatSize = (size) => {
    if (!size && size !== 0) return '';
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const renderMetric = (label, value, unit, change, date) => (
    <div className="group relative p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-105">
      <p className="text-purple-200/70 text-xs mb-3 font-medium uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-white text-4xl font-bold">{value || '—'}</span>
        {unit && <span className="text-purple-300/60 text-sm font-medium">{unit}</span>}
      </div>
      {change && <p className={`text-xs mb-1 font-semibold ${Number(change) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{change}</p>}
      {date && <p className="text-white/30 text-xs">{date}</p>}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );

  const formatPsychValue = (value) => {
    if (!value) return '—';
    const normalized = String(value).replace(/_/g, ' ').toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="relative" id="patient-profile-container">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
              <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
            </div>

            {/* Cursor Follower Effect */}
            <div 
              className="fixed w-96 h-96 rounded-full bg-purple-500/5 blur-3xl pointer-events-none z-0 transition-all duration-700 ease-out"
              style={{ 
                left: `${mousePosition.x}px`,
                top: `${mousePosition.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            />

            {/* Page Header with Animation */}
            <div className="mb-12 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Profil Pacient
              </h1>
              <p className="text-white/60 text-lg font-light tracking-wide">Informații medicale complete • Dashboard interactiv</p>
            </div>

            {/* Patient Header */}
            <div className="mb-8 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
            <div className="grid md:grid-cols-2 gap-8 mb-8 relative z-10">
              <div 
                className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
                style={{ animationDelay: '0.3s' }}
              >
                {/* Glassmorphic glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-2">Date personale</p>
                      <h3 className="text-white text-2xl font-bold">Profil pacient</h3>
                    </div>
                    <button
                      onClick={() => setProfileEditing((v) => !v)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 flex items-center gap-2 hover:from-purple-500/30 hover:to-purple-600/30 transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20"
                    >
                      <Pencil className="w-4 h-4" /> {profileEditing ? 'Anulează' : 'Editare'}
                    </button>
                  </div>
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Prenume</label>
                        <Input
                          disabled={!profileEditing}
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                          placeholder="Prenume"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Nume</label>
                        <Input
                          disabled={!profileEditing}
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                          placeholder="Nume"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Email</label>
                        <Input
                          disabled={!profileEditing}
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="Email"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Telefon</label>
                        <Input
                          disabled={!profileEditing}
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="+40 ..."
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Vârstă</label>
                        <Input
                          disabled={!profileEditing}
                          type="number"
                          value={profileForm.age}
                          onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
                          placeholder="Ani"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    {profileEditing && (
                      <button
                        onClick={handleProfileSave}
                        disabled={savingProfile}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white px-6 py-4 rounded-xl transition-all duration-300 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-60 font-semibold hover:scale-105 active:scale-95"
                      >
                        <Save className="w-5 h-5" />
                        {savingProfile ? 'Se salvează...' : 'Salvează profilul'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div 
                className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
                style={{ animationDelay: '0.4s' }}
              >
                {/* Glassmorphic glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-2">Date medicale</p>
                      <h3 className="text-white text-2xl font-bold">Istoric medical</h3>
                    </div>
                    <button
                      onClick={() => setMedicalEditing((v) => !v)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 flex items-center gap-2 hover:from-purple-500/30 hover:to-purple-600/30 transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20"
                    >
                      <Pencil className="w-4 h-4" /> {medicalEditing ? 'Anulează' : 'Editare'}
                    </button>
                  </div>
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Grupă sangvină</label>
                        <Select
                          value={medicalForm.bloodType}
                          onValueChange={(val) => setMedicalForm((p) => ({ ...p, bloodType: val }))}
                          disabled={!medicalEditing}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm">
                            <SelectValue placeholder="Selectează grupa" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 backdrop-blur-xl text-white border-purple-500/30">
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map((bt) => (
                              <SelectItem key={bt} value={bt} className="hover:bg-purple-500/20">{bt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Număr asigurare</label>
                        <Input
                          disabled={!medicalEditing}
                          value={medicalForm.insuranceNumber}
                          onChange={(e) => setMedicalForm((p) => ({ ...p, insuranceNumber: e.target.value }))}
                          placeholder="ID asigurare"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div className="group/input">
                      <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Alergii</label>
                      <textarea
                        disabled={!medicalEditing}
                        value={medicalForm.allergies}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, allergies: e.target.value }))}
                        placeholder="Listează alergiile separate prin virgulă"
                        className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-300 backdrop-blur-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="group/input">
                      <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Condiții cronice</label>
                      <textarea
                        disabled={!medicalEditing}
                        value={medicalForm.chronicConditions}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, chronicConditions: e.target.value }))}
                        placeholder="ex: Hipertensiune"
                        className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-300 backdrop-blur-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="group/input">
                      <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Medicație curentă</label>
                      <textarea
                        disabled={!medicalEditing}
                        value={medicalForm.medications}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, medications: e.target.value }))}
                        placeholder="ex: Aspirin 100mg zilnic"
                        className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-300 backdrop-blur-sm resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Greutate (kg)</label>
                        <Input
                          disabled={!medicalEditing}
                          value={medicalForm.weightKg}
                          onChange={(e) => setMedicalForm((p) => ({ ...p, weightKg: e.target.value }))}
                          placeholder="ex: 68"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Variație greutate</label>
                        <Input
                          disabled={!medicalEditing}
                          value={medicalForm.weightChange}
                          onChange={(e) => setMedicalForm((p) => ({ ...p, weightChange: e.target.value }))}
                          placeholder="ex: -0.5 kg"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Înălțime (cm)</label>
                        <Input
                          disabled={!medicalEditing}
                          value={medicalForm.heightCm}
                          onChange={(e) => setMedicalForm((p) => ({ ...p, heightCm: e.target.value }))}
                          placeholder="ex: 175"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Glicemie (mg/dL)</label>
                        <Input
                          disabled={!medicalEditing}
                          value={medicalForm.glucose}
                          onChange={(e) => setMedicalForm((p) => ({ ...p, glucose: e.target.value }))}
                          placeholder="ex: 95"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      <div className="group/input">
                        <label className="text-purple-200/70 text-xs mb-2 block font-medium uppercase tracking-wide">Tensiune (mmHg)</label>
                        <Input
                          disabled={!medicalEditing}
                          value={medicalForm.bloodPressure}
                          onChange={(e) => setMedicalForm((p) => ({ ...p, bloodPressure: e.target.value }))}
                          placeholder="ex: 125/80"
                          className="bg-white/5 border-white/10 text-white disabled:opacity-50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    {medicalEditing && (
                      <button
                        onClick={handleMedicalSave}
                        disabled={savingMedical}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white px-6 py-4 rounded-xl transition-all duration-300 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-60 font-semibold hover:scale-105 active:scale-95"
                      >
                        <Save className="w-5 h-5" />
                        {savingMedical ? 'Se salvează...' : 'Salvează datele medicale'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="mb-8 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <PatientOverviewStats 
                totalAppointments={appointments.length}
                totalDocuments={files.length}
                activePrescriptions={ongoingTreatments.length}
                nextVisit={appointmentsData.active.length > 0 ? 'În curând' : 'Fără programări'}
                nextVisitDate={appointmentsData.active.length > 0 ? `${formatDate(appointmentsData.active[0].date)}, ${appointmentsData.active[0].time}` : ''}
              />
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
              {/* Left Column - Main Content */}
              <div className="xl:col-span-2 space-y-8">
                {/* Health Metrics */}
                <div 
                  className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up"
                  style={{ animationDelay: '0.6s' }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  <div className="relative z-10">
                    <h3 className="text-white text-2xl font-bold mb-8 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Metrici de sănătate</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {renderMetric('Greutate', healthMetrics.weight, 'kg', healthMetrics.weightChange, healthMetrics.weightDate)}
                    {renderMetric('Înălțime', healthMetrics.height, 'cm', '', '')}
                    {renderMetric('Glicemie', healthMetrics.glucose, 'mg/dL', '', healthMetrics.glucoseDate)}
                    {renderMetric('Presiune', healthMetrics.bloodPressure, 'mmHg', '', healthMetrics.bpDate)}
                    </div>
                  </div>
                </div>

                {/* Appointment History */}
                <div 
                  className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up"
                  style={{ animationDelay: '0.7s' }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  <div className="relative z-10">
                    <h3 className="text-white text-2xl font-bold mb-8 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Programări</h3>
                    <div className="space-y-4">
                      {appointmentsData.active.slice(0, 4).map((apt, idx) => (
                        <div
                          key={apt.id}
                          className="group/item flex items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10"
                          style={{ animationDelay: `${0.8 + idx * 0.1}s` }}
                        >
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse shadow-lg shadow-purple-400/50" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-white text-sm font-semibold">Consultație</p>
                              <span className="text-purple-400/50">•</span>
                              <p className="text-purple-200/80 text-sm">{apt.doctorName}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-white/50">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-purple-400/70" />
                                {formatDate(apt.date)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-purple-400/70" />
                                {apt.time}
                              </span>
                            </div>
                          </div>
                          <span className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 rounded-xl text-xs font-semibold border border-purple-500/30 shadow-lg shadow-purple-500/20">
                            Programat
                          </span>
                        </div>
                      ))}
                      {appointmentsData.active.length === 0 && (
                        <p className="text-white/40 text-center py-12 text-lg">Nu ai programări active</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medical Documents */}
                <div 
                  className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up"
                  style={{ animationDelay: '0.8s' }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-white text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Documente</h3>
                      <button
                        className="text-purple-300/70 hover:text-purple-200 text-sm font-medium transition-all duration-300 hover:scale-110 px-4 py-2 rounded-xl hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30"
                        onClick={() => setActiveSection('files')}
                      >
                        Vezi toate →
                      </button>
                    </div>
                    {files.length === 0 ? (
                      <p className="text-white/40 text-center py-12 text-lg">Nu ai încărcat documente încă.</p>
                    ) : (
                      <div className="space-y-3">
                        {files.slice(0, 4).map((file, idx) => {
                          const isImage = file.type?.startsWith('image/');
                          const isPdf = file.type?.includes('pdf');
                          return (
                            <div
                              key={file.id}
                              className="group/item flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
                              onClick={() => setPreviewFile(file)}
                              style={{ animationDelay: `${0.9 + idx * 0.1}s` }}
                            >
                              <div className="flex-shrink-0">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center overflow-hidden shadow-lg shadow-purple-500/20 group-hover/item:scale-110 transition-transform duration-300">
                                  {isImage ? (
                                    <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-purple-200 text-xs font-semibold">
                                      <FileText className="w-6 h-6 mb-1" />
                                      {isPdf ? 'PDF' : 'DOC'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="text-white text-sm font-semibold truncate">{file.name}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-purple-200/60">
                                  <span className="truncate">{file.type || 'fișier'}</span>
                                  <span className="text-purple-400/40">•</span>
                                  <span>{new Date(file.uploadedAt).toLocaleDateString('ro-RO')}</span>
                                  <span className="text-purple-400/40">•</span>
                                  <span>{formatSize(file.size)}</span>
                                </div>
                              </div>
                              <button
                                className="opacity-0 group-hover/item:opacity-100 transition-all duration-300 p-3 hover:bg-purple-500/20 rounded-xl border border-purple-500/30 hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewFile(file);
                                }}
                              >
                                <Eye className="w-5 h-5 text-purple-200" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="xl:col-span-1 space-y-6">
                {/* Quick Actions */}
                <div 
                  className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
                  style={{ animationDelay: '0.9s' }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  <div className="relative z-10">
                    <h4 className="text-white text-lg font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Acțiuni rapide</h4>
                    <div className="space-y-3">
                      <button className="w-full flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 text-left border border-white/10 hover:border-purple-500/30 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10 group/btn">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center group-hover/btn:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/20">
                          <Calendar className="w-5 h-5 text-purple-200" />
                        </div>
                        <span className="text-white font-semibold text-sm">Programare nouă</span>
                      </button>
                      <button className="w-full flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 text-left border border-white/10 hover:border-purple-500/30 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10 group/btn">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center group-hover/btn:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/20">
                          <FileText className="w-5 h-5 text-purple-200" />
                        </div>
                        <span className="text-white font-semibold text-sm">Încarcă document</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div 
                  className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
                  style={{ animationDelay: '1s' }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  <div className="relative z-10">
                    <h4 className="text-white text-lg font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Condiții medicale</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                        <span className="text-white/90 text-sm font-medium">{medicalProfile.chronicConditions || 'Necompletat'}</span>
                        <span className="text-purple-300/60 text-xs font-semibold px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30">Controlată</span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <h4 className="text-white text-lg font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Alergii</h4>
                      <div className="space-y-3">
                        {(medicalProfile.allergies ? medicalProfile.allergies.split(',') : []).map((allergy, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:border-red-400/40 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                          >
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <span className="text-white/90 text-sm font-medium">{allergy.trim()}</span>
                          </div>
                        ))}
                        {!medicalProfile.allergies && (
                          <div className="text-white/40 text-sm text-center py-4">Nu ai adăugat alergii</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        );

      case 'medical':
        return (
          <div className="relative space-y-8 animate-fade-in-up">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            </div>

            <div className="mb-12 relative z-10">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Profil Medical
              </h1>
              <p className="text-white/60 text-lg font-light tracking-wide">Informații medicale detaliate și istoric complet</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 relative z-10">
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <h3 className="text-white text-2xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Date inițiale</h3>
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <label className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2 block">Grupă Sânge</label>
                      <p className="text-white text-lg font-semibold">{medicalProfile.bloodType || '—'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <label className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2 block">Alergii</label>
                      <p className="text-white text-lg font-semibold">{medicalProfile.allergies || '—'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <label className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2 block">Condiții Cronice</label>
                      <p className="text-white text-lg font-semibold">{medicalProfile.chronicConditions || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <h3 className="text-white text-2xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Date introduse de medic</h3>
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <label className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2 block">Medicație Curentă</label>
                      <p className="text-white text-lg font-semibold">{medicalProfile.medications || '—'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <label className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2 block">Număr Asigurare</label>
                      <p className="text-white text-lg font-semibold">{medicalProfile.insuranceNumber || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 relative z-10">
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-2">Profil psihologic</p>
                      <h3 className="text-white text-2xl font-bold">Psych Profile</h3>
                    </div>
                    <button
                      onClick={() => navigate('/onboarding/psych-profile', { state: { mode: 'edit' } })}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 flex items-center gap-2 hover:from-purple-500/30 hover:to-purple-600/30 transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20"
                    >
                      <Edit3 className="w-4 h-4" /> {psychProfile?.completed ? 'Edit profile' : 'Start survey'}
                    </button>
                  </div>

                  {psychProfileLoading ? (
                    <div className="text-purple-200/70">Loading psychological profile...</div>
                  ) : psychProfile?.completed ? (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2">Temperament</p>
                          <p className="text-white text-lg font-semibold">{formatPsychValue(psychProfile.temperament)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2">Anxiety</p>
                          <p className="text-white text-lg font-semibold">
                            {formatPsychValue(psychProfile.anxietyLevel)}
                            {typeof psychProfile.anxietyScore === 'number' ? ` (score ${psychProfile.anxietyScore})` : ''}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2">Control Need</p>
                          <p className="text-white text-lg font-semibold">
                            {formatPsychValue(psychProfile.controlNeed)}
                            {typeof psychProfile.controlScore === 'number' ? ` (score ${psychProfile.controlScore})` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2">Communication</p>
                          <p className="text-white text-lg font-semibold">{formatPsychValue(psychProfile.communicationStyle)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2">Procedure Preference</p>
                          <p className="text-white text-lg font-semibold">{formatPsychValue(psychProfile.procedurePreference)}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2">Results Sheet</p>
                        <pre className="whitespace-pre-wrap text-sm text-purple-100/90 leading-relaxed">
                          {psychProfile.resultsSheet || 'No results sheet available.'}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-purple-200/70">
                      Profilul psihologic nu este completat încă. Este necesar pentru a continua.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="relative space-y-8 animate-fade-in-up">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            </div>

            <div className="mb-12 relative z-10">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Fișiere Medicale
              </h1>
              <p className="text-white/60 text-lg font-light tracking-wide">Gestionează documentele și rezultatele medicale</p>
            </div>

            <div className="mb-8 relative z-10">
              <div
                className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-10 border-2 border-dashed border-white/20 hover:border-purple-500/40 transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-400/50 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-10 h-10 text-purple-200" />
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-3">Încarcă documente noi</h3>
                  <p className="text-purple-200/70 text-sm mb-6">PDF, JPG, PNG până la 10MB</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105">
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
              <div className="relative z-10 text-white/60 text-center py-16 backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl border border-white/10">
                <FileText className="w-16 h-16 text-purple-200/40 mx-auto mb-4" />
                <p className="text-lg">Nu ai încărcat documente încă.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {files.map((file, idx) => {
                  const isImage = file.type?.startsWith('image/');
                  const isPdf = file.type?.includes('pdf');
                  return (
                    <div
                      key={file.id}
                      className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.05] hover:border-purple-500/30 flex flex-col gap-4 animate-fade-in-up"
                      style={{ animationDelay: `${0.1 * idx}s` }}
                    >
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <FileText className="w-6 h-6 text-purple-200" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {renamingId === file.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={renamingValue}
                                  onChange={(e) => setRenamingValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRename(file.id);
                                    } else if (e.key === 'Escape') {
                                      setRenamingId(null);
                                      setRenamingValue('');
                                    }
                                  }}
                                  className="bg-white/5 border-white/10 text-white h-9 focus:border-purple-500/50"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRename(file.id)}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 text-purple-200 hover:from-purple-500/30 hover:to-purple-600/30 transition-all"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => {
                                    setRenamingId(null);
                                    setRenamingValue('');
                                  }}
                                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
                                >
                                  Anulează
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-white text-sm font-semibold truncate" title={file.name}>
                                  {file.name}
                                </div>
                                <div className="text-purple-200/60 text-xs">
                                  {formatSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('ro-RO')}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            className="p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 transition-all"
                            onClick={() => moveFile(file.id, 'up')}
                            disabled={idx === 0}
                          >
                            <ArrowUp className="w-4 h-4 text-purple-200" />
                          </button>
                          <button
                            className="p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 transition-all"
                            onClick={() => moveFile(file.id, 'down')}
                            disabled={idx === files.length - 1}
                          >
                            <ArrowDown className="w-4 h-4 text-purple-200" />
                          </button>
                        </div>
                      </div>

                      <div
                        className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 h-48 flex items-center justify-center cursor-pointer hover:border-purple-500/30 transition-all duration-300"
                        onClick={() => openPreview(file)}
                      >
                        {isImage ? (
                          file.dataUrl ? (
                            <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-purple-200/60 text-sm gap-2">
                              <FileText className="w-10 h-10" />
                              <span>Imagine</span>
                            </div>
                          )
                        ) : isPdf ? (
                          <div className="flex flex-col items-center justify-center text-purple-200/60 text-sm gap-2">
                            <FileText className="w-10 h-10" />
                            <span>PDF</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-purple-200/60 text-sm gap-2">
                            <FileText className="w-10 h-10" />
                            <span>Fișier</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 relative z-20">
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 flex items-center gap-1 text-purple-200 text-xs font-medium transition-all duration-300 relative z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPreview(file);
                            }}
                          >
                            <Eye className="w-4 h-4" /> Vizualizează
                          </button>
                          <button
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 flex items-center gap-1 text-purple-200 text-xs font-medium transition-all duration-300 relative z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingId(file.id);
                              setRenamingValue(file.name);
                            }}
                          >
                            <Edit3 className="w-4 h-4" /> Redenumește
                          </button>
                        </div>
                        <button
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 transition-all duration-300 hover:scale-110 relative z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id);
                          }}
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
              <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[80] flex items-center justify-center p-2">
                <div className="relative backdrop-blur-xl bg-gradient-to-br from-[#0a0a14] via-[#0a0a14] to-[#0a0a14] border border-white/20 rounded-2xl w-full h-full max-w-[98vw] max-h-[98vh] overflow-hidden flex flex-col shadow-2xl shadow-purple-500/20">
                  {/* Header */}
                  <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0a0a14]">
                    <div>
                      <p className="text-white text-lg font-bold">{previewFile.name}</p>
                      <p className="text-purple-200/70 text-xs font-medium">{formatSize(previewFile.size)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {!previewAiOpen && (
                        <button
                          type="button"
                          aria-label="AI"
                          className="px-4 py-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/50 hover:border-purple-300/70 text-white flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:scale-105 transition-all duration-300"
                          onClick={() => setPreviewAiOpen(true)}
                        >
                          <Brain className="w-5 h-5" />
                          <span className="text-sm font-medium">AI Analiză</span>
                        </button>
                      )}
                      <button
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/80 hover:text-white transition-all duration-300 font-medium text-sm"
                        onClick={() => {
                          setPreviewAiOpen(false);
                          setPreviewFile(null);
                        }}
                      >
                        Închide
                      </button>
                    </div>
                  </div>
                  
                  {/* Content Area - Split Layout */}
                  <div className="flex-1 flex overflow-hidden relative bg-[#0a0a14]">
                    {/* Image Preview Area */}
                    <div 
                      className={`flex-1 flex items-center justify-center overflow-auto p-4 transition-all duration-300 ${
                        previewAiOpen ? 'pr-0' : ''
                      }`}
                    >
                      {previewFile.type?.startsWith('image/') ? (
                        previewFile.dataUrl ? (
                          <img 
                            src={previewFile.dataUrl} 
                            alt={previewFile.name} 
                            className="max-w-full max-h-full object-contain"
                            style={{ 
                              maxWidth: previewAiOpen ? 'calc(100% - 520px)' : '100%',
                              maxHeight: 'calc(98vh - 80px)',
                              width: 'auto',
                              height: 'auto'
                            }}
                          />
                        ) : (
                          <div className="text-white/60 p-6 text-lg">Se încarcă...</div>
                        )
                      ) : previewFile.type?.includes('pdf') ? (
                        previewFile.dataUrl ? (
                          <iframe 
                            src={previewFile.dataUrl} 
                            title={previewFile.name} 
                            className="w-full h-full"
                            style={{ height: 'calc(98vh - 80px)' }}
                          />
                        ) : (
                          <div className="text-white/60 p-6 text-lg">Se încarcă...</div>
                        )
                      ) : (
                        <div className="text-white/60 p-6 text-lg">Previzualizare indisponibilă pentru acest tip de fișier.</div>
                      )}
                    </div>

                    {/* AI Sidebar */}
                    {previewAiOpen && (
                      <div className="w-[500px] border-l border-purple-500/30 bg-[#0a0a14] flex flex-col shadow-2xl shadow-purple-500/20 flex-shrink-0">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0a0a14]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                              <Brain className="w-5 h-5 text-purple-200" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-base">AI Analiză</p>
                              <p className="text-purple-200/70 text-xs font-medium">Pentru fișierul curent</p>
                            </div>
                          </div>
                          <button
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/80 hover:text-white transition-all duration-300"
                            onClick={() => setPreviewAiOpen(false)}
                            aria-label="Închide AI"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4">
                          <style>{`
                            .ai-chat-container * {
                              font-size: 15px !important;
                            }
                            .ai-chat-container p, .ai-chat-container div, .ai-chat-container span {
                              font-size: 15px !important;
                              line-height: 1.7 !important;
                            }
                            .ai-chat-container input, .ai-chat-container textarea {
                              font-size: 15px !important;
                            }
                            .ai-chat-container h1, .ai-chat-container h2, .ai-chat-container h3 {
                              font-size: 18px !important;
                            }
                          `}</style>
                          <div className="ai-chat-container">
                            <AiChat
                              userId={String(user?.id || '')}
                              userRole={user?.role || 'PATIENT'}
                              scopeType="FILE"
                              scopeId={String(previewFile?.id || '')}
                              layout="stacked"
                              title="Analiză AI"
                              subtitle="Întreabă despre acest fișier medical."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'appointments':
        return (
          <div className="relative space-y-8 animate-fade-in-up">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            </div>

            <div className="mb-12 relative z-10">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Programări
              </h1>
              <p className="text-white/60 text-lg font-light tracking-wide">Gestionează consultațiile și programările medicale</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.05] hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Calendar className="w-7 h-7 text-purple-200" />
                  </div>
                  <div>
                    <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-1">Următoarea</p>
                    <p className="text-white text-lg font-bold">
                      {appointmentsData.active.length > 0 
                        ? `${formatDate(appointmentsData.active[0].date)}, ${appointmentsData.active[0].time}`
                        : 'Niciuna'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.05] hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Clock className="w-7 h-7 text-purple-200" />
                  </div>
                  <div>
                    <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-1">Programări luna aceasta</p>
                    <p className="text-white text-4xl font-bold">{appointments.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-white text-2xl font-bold mb-6 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                Active ({appointmentsData.active.length})
              </h3>
              {appointmentsData.active.length === 0 ? (
                <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 text-center">
                  <p className="text-white/60 text-lg">Nu ai programări active</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointmentsData.active.map((apt, idx) => (
                    <div
                      key={apt.id}
                      className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
                      style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
                    >
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white text-xl font-bold mb-3">{apt.doctorName}</h4>
                          <div className="space-y-2">
                            <p className="text-purple-200/70 text-sm">Data: <span className="text-white font-semibold">{formatDate(apt.date)}</span></p>
                            <p className="text-purple-200/70 text-sm">Ora: <span className="text-white font-semibold">{apt.time}</span></p>
                            {apt.notes && (
                              <p className="text-purple-300 text-sm mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">Note: {apt.notes}</p>
                            )}
                          </div>
                        </div>
                        <span className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-200 rounded-xl text-xs font-bold border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                          Confirmat
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative z-10">
              <h3 className="text-white text-2xl font-bold mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                Finalizate ({appointmentsData.completed.length})
              </h3>
              {appointmentsData.completed.length === 0 ? (
                <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 text-center opacity-75">
                  <p className="text-white/60 text-lg">Nu ai programări finalizate</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointmentsData.completed.map((apt, idx) => (
                    <div
                      key={apt.id}
                      className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl opacity-75 hover:opacity-100 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
                      style={{ animationDelay: `${0.4 + idx * 0.1}s` }}
                    >
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white text-xl font-bold mb-3">{apt.doctorName}</h4>
                          <div className="space-y-2">
                            <p className="text-purple-200/70 text-sm">Data: <span className="text-white font-semibold">{formatDate(apt.date)}</span></p>
                            <p className="text-purple-200/70 text-sm">Ora: <span className="text-white font-semibold">{apt.time}</span></p>
                          </div>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="relative space-y-8 animate-fade-in-up">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            </div>

            <div className="mb-12 relative z-10">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Istoric Medical
              </h1>
              <p className="text-white/60 text-lg font-light tracking-wide">Cronologia completă a activității medicale</p>
            </div>

            {consultations.length === 0 ? (
              <div className="relative z-10 text-white/60 text-center py-16 backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl border border-white/10">
                <History className="w-16 h-16 text-purple-200/40 mx-auto mb-4" />
                <p className="text-lg">Nu există istoric medical încă.</p>
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                {consultations.map((consult, idx) => (
                  <div
                    key={consult.id}
                    className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
                    style={{ animationDelay: `${0.1 * idx}s` }}
                  >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-white text-2xl font-bold mb-2">{consult.doctor}</h3>
                          <p className="text-purple-200/70 text-sm font-medium">{consult.date}</p>
                        </div>
                      </div>

                      <div className="space-y-5 pt-6 border-t border-white/10">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                          <label className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2 block">Diagnostic</label>
                          <p className="text-white text-lg font-semibold">{consult.diagnosis}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                          <label className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2 block">Notițe</label>
                          <p className="text-white text-lg font-semibold">{consult.notes}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                          <label className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-2 block">Prescripție</label>
                          <p className="text-white text-lg font-semibold">{consult.prescription}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'subscription':
        return (
          <div className="relative space-y-8 animate-fade-in-up">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            </div>

            <div className="mb-12 relative z-10">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Abonament
              </h1>
              <p className="text-white/60 text-lg font-light tracking-wide">Gestionează planul și beneficiile tale</p>
            </div>

            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-purple-500/20 via-purple-600/20 to-purple-700/20 rounded-3xl p-10 border border-purple-500/30 shadow-2xl hover:shadow-purple-500/40 transition-all duration-500 hover:scale-[1.02] animate-fade-in-up">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 via-purple-600/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/30 via-purple-600/30 to-purple-700/30 border-2 border-purple-400/50 flex items-center justify-center shadow-2xl shadow-purple-500/50">
                      <CreditCard className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-white text-3xl font-bold">Plan {subscription.plan}</h2>
                        {subscription.hasAISubscription ? (
                          <span className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-200 rounded-xl text-sm font-bold border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                            Activ
                          </span>
                        ) : (
                          <span className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-200 rounded-xl text-sm font-bold border border-yellow-500/30 shadow-lg shadow-yellow-500/20">
                            Neactivat
                          </span>
                        )}
                      </div>
                      <p className="text-purple-200/80 text-base">
                        Acces la AI și analiză medicală. {subscription.hasAISubscription ? 'Reînnoire automată lunar.' : 'Activează pentru a porni accesul.'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-200/70 text-sm font-medium uppercase tracking-wide mb-2">Preț lunar</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-white text-5xl font-bold">{subscription.price}</span>
                      <span className="text-purple-200/70 text-lg">{subscription.currency}/lună</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckCircle className="w-5 h-5 text-emerald-200" />
                      </div>
                      <span className="text-white text-base font-semibold">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  {subscription.hasAISubscription ? (
                    <>
                      <button
                        onClick={handleActivateSubscription}
                        className="px-6 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-semibold hover:scale-105"
                      >
                        Reînnoiește / menține activ
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        className="px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl border border-red-500/30 shadow-lg shadow-red-500/20 transition-all duration-300 font-semibold hover:scale-105"
                      >
                        Anulează abonamentul
                      </button>
                      <div className="text-purple-200/70 text-sm font-medium">
                        Activ din {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('ro-RO') : '—'}
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={handleActivateSubscription}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-bold text-lg hover:scale-105"
                    >
                      Activează abonament (50€)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="relative space-y-8 animate-fade-in-up">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            </div>

            <div className="mb-12 relative z-10">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
                Asistent AI
              </h1>
              <p className="text-white/60 text-lg font-light tracking-wide">Asistent medical inteligent pentru răspunsuri rapide</p>
            </div>

            {subscription.hasAISubscription ? (
              <div className="relative z-10">
                <AiChat
                  userId={String(user?.id || '')}
                  userRole={user?.role || 'PATIENT'}
                  scopeType="PATIENT"
                  scopeId={String(user?.id || '')}
                  title="Chat AI"
                  subtitle="Pune întrebări despre sănătate (fără fișiere încă). Răspunsurile sunt în română."
                  initialMessage="Bună! Sunt asistentul tău AI medical. Cu ce te pot ajuta?"
                />
              </div>
            ) : (
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-12 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 text-center animate-fade-in-up">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 via-purple-600/20 to-purple-700/20 border-2 border-purple-400/50 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/50">
                    <Bot className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-white text-3xl font-bold mb-3 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Ai nevoie de abonament AI</h3>
                  <p className="text-purple-200/70 text-lg mb-8">Activează abonamentul de 50€ pentru a accesa Asistent AI</p>
                  <button
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-bold text-lg hover:scale-105"
                    onClick={() => setActiveSection('subscription')}
                  >
                    Mergi la abonament
                  </button>
                </div>
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

    </div>
  );
}
