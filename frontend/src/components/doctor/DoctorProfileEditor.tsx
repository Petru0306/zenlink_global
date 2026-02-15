import { useState, useEffect, useRef } from 'react';
import { Upload, Save, X, User, Stethoscope, Mail, Phone, Clock, Heart, Sparkles, Award, Building2, MessageSquare, Globe, Target, Calendar } from 'lucide-react';
import { doctorProfileService, type DoctorProfileResponse, type DoctorProfileRequest } from '../../services/doctorProfileService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../../context/AuthContext';

interface DoctorProfileEditorProps {
  userId: number;
  onSave?: () => void;
}

// Predefined options
const SPECIALIZATIONS = [
  'Medicina generală', 'Stomatologie', 'Cardiologie', 'Dermatologie', 'Oftalmologie',
  'Ortopedie', 'Pediatrie', 'Ginecologie', 'Neurologie', 'Psihiatrie',
  'Endocrinologie', 'Gastroenterologie', 'Urologie', 'Oncologie', 'Radiologie'
];

const YEARS_OPTIONS = [
  '0-2 ani', '3-5 ani', '6-10 ani', '11-15 ani', '16-20 ani', '21-25 ani', '26-30 ani', '30+ ani'
];

const CONSULTATION_TYPES = [
  'Consultație de rutină', 'Consultație de urgență', 'Consultație de specialitate',
  'Consult pentru analize', 'Consult pentru tratament', 'Consult pentru prevenție',
  'Consult pentru educație', 'Consult pentru urmărire', 'Consult pre-operator', 'Consult post-operator'
];

const LANGUAGES = [
  'Română', 'Engleză', 'Germană', 'Franceză', 'Italiană', 'Spaniolă', 'Maghiară', 'Rusă'
];

const MEDICAL_INTERESTS = [
  'Prevenție', 'Tratament', 'Educație pacient', 'Cercetare', 'Tehnologie medicală',
  'Medicină personalizată', 'Medicină integrativă', 'Medicină preventivă', 'Telemedicină'
];

// Combobox component (single select)
function Combobox({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled 
}: { 
  value: string | undefined; 
  onChange: (value: string) => void; 
  options: string[]; 
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          style={{ backgroundColor: inputValue ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
          className={`text-sm transition-all duration-300 text-white border ${
            !inputValue 
              ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50' 
              : 'border-purple-500/30'
          }`}
        />
        {!inputValue && (
          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
      </div>
      {isOpen && !disabled && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a1f2e] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-h-60 overflow-auto backdrop-blur-xl">
          {filteredOptions.map((option, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full text-left px-4 py-2.5 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-600/20 text-white/80 hover:text-white transition-all duration-200 border-b border-white/5 last:border-0"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// MultiSelect component (multiple select)
function MultiSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled 
}: { 
  value: string | undefined; 
  onChange: (value: string) => void; 
  options: string[]; 
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Parse value as comma-separated string
  const selectedValues = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchValue.toLowerCase()) && !selectedValues.includes(opt)
  );

  const handleToggle = (option: string) => {
    const newSelected = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newSelected.join(', '));
  };

  const handleRemove = (option: string) => {
    const newSelected = selectedValues.filter(v => v !== option);
    onChange(newSelected.join(', '));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{ backgroundColor: selectedValues.length === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.08)' }}
          className={`min-h-[2.5rem] w-full px-3 py-2 rounded-md border transition-all duration-300 cursor-pointer flex flex-wrap gap-2 items-center ${
            selectedValues.length === 0
              ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50' 
              : 'border-purple-500/30'
          }`}
        >
          {selectedValues.length === 0 ? (
            <span className="text-sm text-white/30">{placeholder}</span>
          ) : (
            <>
              {selectedValues.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/20 border border-purple-500/30 text-white text-sm"
                >
                  {val}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(val);
                      }}
                      className="hover:text-purple-300 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a1f2e] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-h-60 overflow-auto backdrop-blur-xl">
          <div className="p-2 sticky top-0 bg-[#1a1f2e] border-b border-white/5">
            <Input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Caută..."
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              className="text-sm border-white/10 placeholder:text-white/30 text-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleToggle(option)}
                className="w-full text-left px-4 py-2.5 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-purple-600/20 text-white/80 hover:text-white transition-all duration-200 border-b border-white/5 last:border-0"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-4 py-2.5 text-white/40 text-sm">Nu mai sunt opțiuni disponibile</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DoctorProfileEditor({ userId, onSave }: DoctorProfileEditorProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState<DoctorProfileRequest>({
    profileImageUrl: '',
    tagline: '',
    about: '',
    specializations: '',
    yearsOfExperience: '',
    clinics: '',
    consultationTypes: '',
    languages: '',
    medicalInterests: '',
    workStyle: '',
    professionalEmail: '',
    clinicPhone: '',
    generalAvailability: '',
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  // Mouse tracking for cursor follower effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await doctorProfileService.getMyProfile();
      setProfile(data);
      setFormData({
        profileImageUrl: data.profileImageUrl || '',
        tagline: data.tagline || '',
        about: data.about || '',
        specializations: data.specializations || '',
        yearsOfExperience: data.yearsOfExperience || '',
        clinics: data.clinics || '',
        consultationTypes: data.consultationTypes || '',
        languages: data.languages || '',
        medicalInterests: data.medicalInterests || '',
        workStyle: data.workStyle || '',
        professionalEmail: data.professionalEmail || '',
        clinicPhone: data.clinicPhone || '',
        generalAvailability: data.generalAvailability || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image
    if (!file.type.startsWith('image/')) {
      alert('Te rugăm să selectezi o imagine validă');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Imaginea trebuie să fie mai mică de 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      console.log('🔐 Uploading image - token exists:', !!token);

      const response = await fetch('http://localhost:8080/api/upload/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
        body: formData,
      });

      console.log('📤 Upload response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to upload image';
        const contentType = response.headers.get('content-type');
        console.log('❌ Upload error response - Status:', response.status, 'Content-Type:', contentType);
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.log('❌ Upload error data:', errorData);
            if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else {
              errorMessage = JSON.stringify(errorData);
            }
          } else {
            // If response is not JSON, try to read as text
            const errorText = await response.text();
            console.log('❌ Upload error text:', errorText);
            if (errorText) {
              // Try to parse as JSON if it looks like JSON
              try {
                const parsed = JSON.parse(errorText);
                if (parsed.error) {
                  errorMessage = parsed.error;
                } else if (parsed.message) {
                  errorMessage = parsed.message;
                } else {
                  errorMessage = errorText;
                }
              } catch {
                errorMessage = errorText || `Upload failed with status ${response.status}`;
              }
            } else {
              errorMessage = `Upload failed with status ${response.status}`;
            }
          }
        } catch (e) {
          console.error('❌ Error parsing error response:', e);
          errorMessage = `Upload failed with status ${response.status}`;
        }
        console.error('❌ Upload error final:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Upload success:', data);
      
      // Use full URL for the image
      const imageUrl = data.url.startsWith('http') ? data.url : `http://localhost:8080${data.url}`;
      setFormData({ ...formData, profileImageUrl: imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Nu am putut încărca imaginea: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await doctorProfileService.upsertProfile(formData);
      await loadProfile();
      setIsEditing(false);
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nu am putut salva profilul. Te rugăm să încerci din nou.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        profileImageUrl: profile.profileImageUrl || '',
        tagline: profile.tagline || '',
        about: profile.about || '',
        specializations: profile.specializations || '',
        yearsOfExperience: profile.yearsOfExperience || '',
        clinics: profile.clinics || '',
        consultationTypes: profile.consultationTypes || '',
        languages: profile.languages || '',
        medicalInterests: profile.medicalInterests || '',
        workStyle: profile.workStyle || '',
        professionalEmail: profile.professionalEmail || '',
        clinicPhone: profile.clinicPhone || '',
        generalAvailability: profile.generalAvailability || '',
      });
    }
    setIsEditing(false);
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = [
      formData.profileImageUrl,
      formData.tagline,
      formData.about,
      formData.specializations,
      formData.yearsOfExperience,
      formData.clinics,
      formData.consultationTypes,
      formData.languages,
      formData.medicalInterests,
      formData.workStyle,
      formData.professionalEmail,
      formData.clinicPhone,
      formData.generalAvailability,
    ];
    const filled = fields.filter(f => f && f.trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/50">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="relative" id="doctor-profile-container">
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

      <div className="space-y-6 relative z-10">
        {/* Header with Title and Progress Indicator */}
        <div className="flex items-start justify-between gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex-1">
            <h1 className="text-white text-3xl font-semibold mb-2">Profil Medical</h1>
            <p className="text-white/40">Carte de vizită medicală digitală - Prezintă-te pacienților și colegilor</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-400/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <span className="text-purple-200 font-bold text-sm">{completionPercentage}%</span>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-medium">Profil complet</p>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 hover:text-white shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Editează
              </Button>
            )}
          </div>
        </div>

        {/* Card 1: Identitate profesională */}
        <div 
          className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {/* Glassmorphic glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <User className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-1">Identitate</p>
                <h3 className="text-white text-2xl font-bold">Identitate profesională</h3>
              </div>
            </div>
            
            {/* Doctor Info Header */}
            {user && (
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="flex items-start gap-6">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    <label className="text-white/60 text-xs mb-2 block font-medium">Poza de profil</label>
                    <div className="relative group/image">
                      <div className={`w-32 h-32 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                        formData.profileImageUrl 
                          ? 'border-purple-400/50 shadow-lg shadow-purple-500/30' 
                          : 'border-purple-400/30 border-dashed bg-gradient-to-br from-purple-500/20 via-purple-600/20 to-purple-700/20 group-hover/image:border-purple-400/50 group-hover/image:shadow-lg group-hover/image:shadow-purple-500/20'
                      }`}>
                        {formData.profileImageUrl ? (
                          <img
                            src={formData.profileImageUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <User className="w-10 h-10 text-purple-300/60 group-hover/image:text-purple-300 transition-colors" />
                            {!isEditing && (
                              <span className="text-xs text-white/40">Fără imagine</span>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="mt-3 w-full px-3 py-2 text-xs rounded-lg bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20"
                        >
                          {uploadingImage ? (
                            <>
                              <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                              Se încarcă...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              {formData.profileImageUrl ? 'Schimbă' : 'Încarcă'}
                            </>
                          )}
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Name & Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">
                        {user.firstName} {user.lastName}
                      </h2>
                      <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider">
                        {formData.specializations || 'MEDIC GENERAL'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/info flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-200" />
                        </div>
                        <div>
                          <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-0.5">Email</p>
                          {isEditing ? (
                            <Input
                              type="email"
                              placeholder="Unde te pot contacta pacienții?"
                              value={formData.professionalEmail}
                              onChange={(e) => setFormData({ ...formData, professionalEmail: e.target.value })}
                              style={{ backgroundColor: formData.professionalEmail ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                              className={`text-sm h-10 transition-all duration-300 text-white border ${
                                !formData.professionalEmail
                                  ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                                  : 'border-purple-500/30'
                              }`}
                            />
                          ) : (
                            <p className="text-white text-base font-semibold truncate">
                              {formData.professionalEmail || user.email || '—'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="group/info flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-purple-200" />
                        </div>
                        <div>
                          <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-0.5">Telefon</p>
                          {isEditing ? (
                            <Input
                              type="tel"
                              placeholder="Număr de telefon"
                              value={formData.clinicPhone}
                              onChange={(e) => setFormData({ ...formData, clinicPhone: e.target.value })}
                              style={{ backgroundColor: formData.clinicPhone ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                              className={`text-sm h-10 transition-all duration-300 text-white border ${
                                !formData.clinicPhone
                                  ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                                  : 'border-purple-500/30'
                              }`}
                            />
                          ) : (
                            <p className="text-white text-base font-semibold">
                              {formData.clinicPhone || user.phone || '—'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tagline */}
            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                Tagline
              </label>
              {isEditing ? (
                <Input
                  placeholder="Spune pacienților în ce ești cel mai bun"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  style={{ backgroundColor: formData.tagline ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.tagline
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.tagline ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.tagline || 'Spune pacienților în ce ești cel mai bun'}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Card 2: Experiență & Specializări */}
        <div 
          className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          {/* Glassmorphic glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Award className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-1">Experiență</p>
                <h3 className="text-white text-2xl font-bold">Experiență & Specializări</h3>
              </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-purple-400" />
                Specializări
              </label>
              {isEditing ? (
                <MultiSelect
                  value={formData.specializations}
                  onChange={(value) => setFormData({ ...formData, specializations: value })}
                  options={SPECIALIZATIONS}
                  placeholder="Selectează specializările tale"
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.specializations ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.specializations || 'Selectează specializările tale'}
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                Ani de experiență
              </label>
              {isEditing ? (
                <Combobox
                  value={formData.yearsOfExperience}
                  onChange={(value) => setFormData({ ...formData, yearsOfExperience: value })}
                  options={YEARS_OPTIONS}
                  placeholder="Câți ani de practică aduci în consultație?"
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.yearsOfExperience ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.yearsOfExperience || 'Câți ani de practică aduci în consultație?'}
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Tipuri de consultații
              </label>
              {isEditing ? (
                <MultiSelect
                  value={formData.consultationTypes}
                  onChange={(value) => setFormData({ ...formData, consultationTypes: value })}
                  options={CONSULTATION_TYPES}
                  placeholder="Selectează tipurile de consultații oferite"
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.consultationTypes ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.consultationTypes || 'Selectează tipurile de consultații oferite'}
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                Limbi vorbite
              </label>
              {isEditing ? (
                <MultiSelect
                  value={formData.languages}
                  onChange={(value) => setFormData({ ...formData, languages: value })}
                  options={LANGUAGES}
                  placeholder="Selectează limbile pe care le vorbești"
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.languages ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.languages || 'Selectează limbile pe care le vorbești'}
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                Arii de interes
              </label>
              {isEditing ? (
                <MultiSelect
                  value={formData.medicalInterests}
                  onChange={(value) => setFormData({ ...formData, medicalInterests: value })}
                  options={MEDICAL_INTERESTS}
                  placeholder="Selectează ariile de interes"
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.medicalInterests ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.medicalInterests || 'Selectează ariile de interes'}
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                Clinici
              </label>
              {isEditing ? (
                <Textarea
                  placeholder="Unde activezi? Listează clinicile (una pe linie)"
                  value={formData.clinics}
                  onChange={(e) => setFormData({ ...formData, clinics: e.target.value })}
                  style={{ backgroundColor: formData.clinics ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.clinics
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                  rows={3}
                />
              ) : (
                <p className={`text-base transition-colors whitespace-pre-wrap ${
                  profile?.clinics ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.clinics || 'Unde activezi? Listează clinicile'}
                </p>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Card 3: Stil medical */}
        <div 
          className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          {/* Glassmorphic glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Heart className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-1">Stil</p>
                <h3 className="text-white text-2xl font-bold">Stil medical</h3>
              </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Despre tine
              </label>
              {isEditing ? (
                <Textarea
                  placeholder="Povestește despre experiența ta, filozofia de lucru, ce te interesează în medicină..."
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  style={{ backgroundColor: formData.about ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.about
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                  rows={6}
                />
              ) : (
                <div className={`relative p-4 rounded-xl border transition-all duration-300 ${
                  profile?.about 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 border-dashed'
                }`}>
                  <p className={`text-base leading-relaxed whitespace-pre-wrap transition-colors ${
                    profile?.about ? 'text-white font-medium' : 'text-white/40 italic'
                  }`}>
                    {profile?.about || 'Povestește despre experiența ta, filozofia de lucru, ce te pasionează în medicină...'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-purple-400" />
                Stil de lucru
              </label>
              {isEditing ? (
                <Textarea
                  placeholder="Cum lucrezi cu pacienții? Consultații detaliate, focus pe prevenție, educarea pacientului..."
                  value={formData.workStyle}
                  onChange={(e) => setFormData({ ...formData, workStyle: e.target.value })}
                  style={{ backgroundColor: formData.workStyle ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.workStyle
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                  rows={6}
                />
              ) : (
                <div className={`relative p-4 rounded-xl border transition-all duration-300 ${
                  profile?.workStyle 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 border-dashed'
                }`}>
                  <p className={`text-base leading-relaxed whitespace-pre-wrap transition-colors ${
                    profile?.workStyle ? 'text-white font-medium' : 'text-white/40 italic'
                  }`}>
                    {profile?.workStyle || 'Cum lucrezi cu pacienții? Descrie stilul tău de consultație...'}
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Card 4: Contact & Disponibilitate */}
        <div 
          className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          {/* Glassmorphic glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Clock className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-1">Disponibilitate</p>
                <h3 className="text-white text-2xl font-bold">Program de lucru</h3>
              </div>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Disponibilitate
              </label>
              {isEditing ? (
                <Input
                  placeholder="Când ești disponibil pentru consultații?"
                  value={formData.generalAvailability}
                  onChange={(e) => setFormData({ ...formData, generalAvailability: e.target.value })}
                  style={{ backgroundColor: formData.generalAvailability ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.generalAvailability
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.generalAvailability ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.generalAvailability || 'Când ești disponibil pentru consultații?'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-4 justify-end animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-purple-500/30 backdrop-blur-sm"
            >
              <X className="w-4 h-4 mr-2" />
              Anulează
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white px-6 py-3 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-semibold hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Se salvează...' : 'Salvează profilul'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
