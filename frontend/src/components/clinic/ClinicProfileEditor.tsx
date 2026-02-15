import { useState, useEffect, useRef } from 'react';
import { Upload, Save, X, Building2, Mail, Phone, Clock, Globe, MapPin, Stethoscope, Sparkles, Award, MessageSquare, Target, Calendar, Image as ImageIcon, Trash2, ImagePlus } from 'lucide-react';
import { clinicProfileService, type ClinicProfileResponse, type ClinicProfileRequest } from '../../services/clinicProfileService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../../context/AuthContext';

interface ClinicProfileEditorProps {
  userId: number;
  onSave?: () => void;
}

// Predefined options - Dentistry related specializations
const SPECIALIZATIONS = [
  'Stomatologie',
  'Ortodonție',
  'Endodonție',
  'Parodontologie',
  'Chirurgie orală și maxilo-facială',
  'Protetică dentară',
  'Implantologie',
  'Pedodonție',
  'Estetică dentară',
  'Patologie orală',
  'Radiologie dentară',
  'Anestezie dentară'
];

const LANGUAGES = [
  'Română', 'Engleză', 'Germană', 'Franceză', 'Italiană', 'Spaniolă', 'Maghiară', 'Rusă'
];

const INSURANCE_TYPES = [
  'Casa Națională de Asigurări de Sănătate (CNAS)',
  'Asigurări private',
  'Plată directă',
  'Abonamente'
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
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-h-60 overflow-auto">
            {filteredOptions.map((option, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(option)}
                className="px-4 py-2.5 text-white hover:bg-purple-500/20 cursor-pointer transition-colors text-sm border-b border-white/5 last:border-b-0"
              >
                {option}
              </div>
            ))}
          </div>
        )}
        {isOpen && filteredOptions.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20">
            <div className="px-4 py-2.5 text-white/40 text-sm">Nu mai sunt opțiuni disponibile</div>
          </div>
        )}
      </div>
    </div>
  );
}

// MultiSelect component
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
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedValues = value ? value.split(',').map(v => v.trim()).filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    !selectedValues.includes(opt) &&
    opt.toLowerCase().includes(inputValue.toLowerCase())
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
          className={`min-h-[42px] px-3 py-2 rounded-lg border transition-all duration-300 cursor-pointer flex items-center gap-2 flex-wrap ${
            !value
              ? 'bg-white/5 border-white/10 hover:border-purple-500/30'
              : 'bg-white/8 border-purple-500/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {selectedValues.length > 0 ? (
            <div className="flex flex-wrap gap-2 flex-1">
              {selectedValues.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-200"
                >
                  {val}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(val);
                      }}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-white/30 text-sm">{placeholder}</span>
          )}
        </div>
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-black/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 max-h-60 overflow-auto">
            {inputValue && (
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Caută..."
                className="m-2 bg-white/5 border-white/10 text-white text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => (
                <div
                  key={idx}
                  onClick={() => handleToggle(option)}
                  className="px-4 py-2.5 text-white hover:bg-purple-500/20 cursor-pointer transition-colors text-sm border-b border-white/5 last:border-b-0 flex items-center gap-2"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedValues.includes(option)
                      ? 'bg-purple-500 border-purple-400'
                      : 'border-white/30'
                  }`}>
                    {selectedValues.includes(option) && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  {option}
                </div>
              ))
            ) : (
              <div className="px-4 py-2.5 text-white/40 text-sm">Nu mai sunt opțiuni disponibile</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClinicProfileEditor({ userId, onSave }: ClinicProfileEditorProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClinicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingGalleryImages, setUploadingGalleryImages] = useState<string[]>([]);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const formDataRef = useRef<ClinicProfileRequest>({
    bannerImageUrl: '',
    name: '',
    tagline: '',
    about: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    specialties: '',
    openHours: '',
    description: '',
    facilities: '',
    insuranceAccepted: '',
    languages: '',
    galleryImages: '',
  });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState<ClinicProfileRequest>({
    bannerImageUrl: '',
    name: '',
    tagline: '',
    about: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    specialties: '',
    openHours: '',
    description: '',
    facilities: '',
    insuranceAccepted: '',
    languages: '',
    galleryImages: '',
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  // Helper function to update both state and ref
  const updateFormData = (updates: Partial<ClinicProfileRequest>) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      formDataRef.current = updated;
      return updated;
    });
  };

  // Debug: Log formData changes
  useEffect(() => {
    console.log('formData changed, bannerImageUrl:', formData.bannerImageUrl);
    formDataRef.current = formData;
  }, [formData]);

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
      const data = await clinicProfileService.getMyProfile();
      console.log('Loaded profile data:', data);
      console.log('Loaded bannerImageUrl:', data.bannerImageUrl);
      setProfile(data);
      const loadedData = {
        bannerImageUrl: data.bannerImageUrl || '',
        name: data.name || '',
        tagline: data.tagline || '',
        about: data.about || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        specialties: data.specialties || '',
        openHours: data.openHours || '',
        description: data.description || '',
        facilities: data.facilities || '',
        insuranceAccepted: data.insuranceAccepted || '',
        languages: data.languages || '',
        galleryImages: data.galleryImages || '',
      };
      console.log('Setting formData with loaded data, bannerImageUrl:', loadedData.bannerImageUrl);
      formDataRef.current = loadedData;
      setFormData(loadedData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Te rugăm să selectezi o imagine validă');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Imaginea trebuie să fie mai mică de 5MB');
      return;
    }

    try {
      setUploadingBanner(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/upload/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to upload banner';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Upload failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const imageUrl = data.url.startsWith('http') ? data.url : `http://localhost:8080${data.url}`;
      console.log('Banner uploaded successfully, URL:', imageUrl);
      // Update both state and ref
      updateFormData({ bannerImageUrl: imageUrl });
      console.log('Updated formData with banner, bannerImageUrl:', imageUrl);
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert(`Nu am putut încărca banner-ul: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Get the latest formData from ref to avoid closure issues
      const currentFormData = formDataRef.current;
      console.log('Current formData before save (from ref):', currentFormData);
      console.log('Banner URL in current formData (from ref):', currentFormData.bannerImageUrl);
      console.log('Current formData state:', formData);
      console.log('Banner URL in state:', formData.bannerImageUrl);
      
      // Create a clean payload with all fields - keep empty strings as they are
      const payload: ClinicProfileRequest = {
        bannerImageUrl: currentFormData.bannerImageUrl && currentFormData.bannerImageUrl.trim() !== '' ? currentFormData.bannerImageUrl : undefined,
        name: currentFormData.name || undefined,
        tagline: currentFormData.tagline || undefined,
        about: currentFormData.about || undefined,
        address: currentFormData.address || undefined,
        phone: currentFormData.phone || undefined,
        email: currentFormData.email || undefined,
        website: currentFormData.website || undefined,
        specialties: currentFormData.specialties || undefined,
        openHours: currentFormData.openHours || undefined,
        description: currentFormData.description || undefined,
        facilities: currentFormData.facilities || undefined,
        insuranceAccepted: currentFormData.insuranceAccepted || undefined,
        languages: currentFormData.languages || undefined,
        galleryImages: currentFormData.galleryImages || undefined,
      };
      console.log('Saving clinic profile with payload:', JSON.stringify(payload, null, 2));
      console.log('Banner URL in payload:', payload.bannerImageUrl);
      console.log('Payload keys:', Object.keys(payload));
      
      const saved = await clinicProfileService.upsertProfile(payload);
      console.log('Profile saved successfully:', saved);
      console.log('Banner URL in saved response:', saved.bannerImageUrl);
      
      // Update state directly with saved data instead of reloading
      if (saved) {
        const savedData = {
          bannerImageUrl: saved.bannerImageUrl || '',
          name: saved.name || '',
          tagline: saved.tagline || '',
          about: saved.about || '',
          address: saved.address || '',
          phone: saved.phone || '',
          email: saved.email || '',
          website: saved.website || '',
          specialties: saved.specialties || '',
          openHours: saved.openHours || '',
          description: saved.description || '',
          facilities: saved.facilities || '',
          insuranceAccepted: saved.insuranceAccepted || '',
          languages: saved.languages || '',
          galleryImages: saved.galleryImages || '',
        };
        console.log('Updating formData with saved data, bannerImageUrl:', savedData.bannerImageUrl);
        formDataRef.current = savedData;
        setFormData(savedData);
        setProfile(saved);
      } else {
        // Fallback to reload if saved is null
        await loadProfile();
      }
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
        bannerImageUrl: profile.bannerImageUrl || '',
        name: profile.name || '',
        tagline: profile.tagline || '',
        about: profile.about || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        website: profile.website || '',
        specialties: profile.specialties || '',
        openHours: profile.openHours || '',
        description: profile.description || '',
        facilities: profile.facilities || '',
        insuranceAccepted: profile.insuranceAccepted || '',
        languages: profile.languages || '',
        galleryImages: profile.galleryImages || '',
      });
    }
    setIsEditing(false);
  };

  const getGalleryImages = (): string[] => {
    if (!formData.galleryImages) return [];
    try {
      return JSON.parse(formData.galleryImages);
    } catch {
      return [];
    }
  };

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} nu este o imagine validă`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} este prea mare (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const currentImages = getGalleryImages();
    const newImageUrls: string[] = [];

    for (const file of validFiles) {
      const fileId = `${Date.now()}-${Math.random()}`;
      setUploadingGalleryImages(prev => [...prev, fileId]);

      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/api/upload/profile-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token || ''}`,
          },
          body: formDataUpload,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        const imageUrl = data.url.startsWith('http') ? data.url : `http://localhost:8080${data.url}`;
        newImageUrls.push(imageUrl);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        alert(`Nu am putut încărca ${file.name}`);
      } finally {
        setUploadingGalleryImages(prev => prev.filter(id => id !== fileId));
      }
    }

    if (newImageUrls.length > 0) {
      const updatedImages = [...currentImages, ...newImageUrls];
      setFormData({ ...formData, galleryImages: JSON.stringify(updatedImages) });
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    const currentImages = getGalleryImages();
    const updatedImages = currentImages.filter((_, i) => i !== index);
    setFormData({ ...formData, galleryImages: JSON.stringify(updatedImages) });
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = [
      formData.bannerImageUrl,
      formData.name,
      formData.tagline,
      formData.about,
      formData.address,
      formData.phone,
      formData.email,
      formData.specialties,
      formData.openHours,
      formData.description,
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
    <div className="relative" id="clinic-profile-container">
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
            <h1 className="text-white text-3xl font-semibold mb-2">Profil Clinică</h1>
            <p className="text-white/40">Gestionează informațiile publice ale clinicii tale</p>
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
          </div>
        </div>

        {/* Edit Button Section */}
        {!isEditing && (
          <div className="flex justify-end animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 hover:text-white shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Editează
            </Button>
          </div>
        )}

        {/* Card 1: Identitate clinică */}
        <div 
          className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Building2 className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-1">Identitate</p>
                <h3 className="text-white text-2xl font-bold">Identitate clinică</h3>
              </div>
            </div>
            
            {/* Clinic Info Header */}
            {user && (
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Banner Image - Left Side */}
                  <div>
                    <label className="text-white/60 text-xs mb-2 block font-medium">Banner clinică</label>
                    <div className="relative group/banner">
                      <div className={`w-full h-64 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                        formData.bannerImageUrl 
                          ? 'border-purple-400/50 shadow-lg shadow-purple-500/30' 
                          : 'border-purple-400/30 border-dashed bg-gradient-to-br from-purple-500/20 via-purple-600/20 to-purple-700/20 group-hover/banner:border-purple-400/50 group-hover/banner:shadow-lg group-hover/banner:shadow-purple-500/20'
                      }`}>
                        {formData.bannerImageUrl ? (
                          <img
                            src={formData.bannerImageUrl}
                            alt="Banner"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <ImagePlus className="w-16 h-16 text-purple-300/60 group-hover/banner:text-purple-300 transition-colors" />
                            {!isEditing && (
                              <span className="text-sm text-white/40">Fără banner</span>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={uploadingBanner}
                          className="mt-3 w-full px-4 py-2.5 text-sm rounded-lg bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20"
                        >
                          {uploadingBanner ? (
                            <>
                              <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                              Se încarcă...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              {formData.bannerImageUrl ? 'Schimbă banner' : 'Încarcă banner'}
                            </>
                          )}
                        </button>
                      )}
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Name & Info - Right Side */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/60 text-xs mb-1.5 block font-medium">Nume clinică</label>
                      {isEditing ? (
                        <Input
                          placeholder="Numele clinicii"
                          value={formData.name}
                          onChange={(e) => {
                            const updated = { ...formData, name: e.target.value };
                            formDataRef.current = updated;
                            setFormData(updated);
                          }}
                          style={{ backgroundColor: formData.name ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                          className={`text-lg font-bold transition-all duration-300 text-white border ${
                            !formData.name
                              ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                              : 'border-purple-500/30'
                          }`}
                        />
                      ) : (
                        <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">
                          {formData.name || user.firstName || 'Nume clinică'}
                        </h2>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/info flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-0.5">Email</p>
                          {isEditing ? (
                            <Input
                              type="email"
                              placeholder="Email clinică"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              style={{ backgroundColor: formData.email ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                              className={`text-sm h-10 transition-all duration-300 text-white border ${
                                !formData.email
                                  ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                                  : 'border-purple-500/30'
                              }`}
                            />
                          ) : (
                            <p className="text-white text-base font-semibold truncate">
                              {formData.email || user.email || '—'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="group/info flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-purple-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-0.5">Telefon</p>
                          {isEditing ? (
                            <Input
                              type="tel"
                              placeholder="Număr de telefon"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              style={{ backgroundColor: formData.phone ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                              className={`text-sm h-10 transition-all duration-300 text-white border ${
                                !formData.phone
                                  ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                                  : 'border-purple-500/30'
                              }`}
                            />
                          ) : (
                            <p className="text-white text-base font-semibold">
                              {formData.phone || user.phone || '—'}
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
                  placeholder="Slogan-ul clinicii tale"
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
                  {profile?.tagline || 'Slogan-ul clinicii tale'}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Card 2: Informații de contact */}
        <div 
          className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <MapPin className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-1">Contact</p>
                <h3 className="text-white text-2xl font-bold">Informații de contact</h3>
              </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                Adresă
              </label>
              {isEditing ? (
                <Textarea
                  placeholder="Adresa completă a clinicii"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ backgroundColor: formData.address ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.address
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                  rows={3}
                />
              ) : (
                <p className={`text-base transition-colors whitespace-pre-wrap ${
                  profile?.address ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.address || 'Adresa completă a clinicii'}
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                Website
              </label>
              {isEditing ? (
                <Input
                  type="url"
                  placeholder="https://www.clinica.ro"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  style={{ backgroundColor: formData.website ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.website
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.website ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.website || 'Website-ul clinicii'}
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Program
              </label>
              {isEditing ? (
                <Input
                  placeholder="Luni-Vineri: 09:00-18:00"
                  value={formData.openHours}
                  onChange={(e) => setFormData({ ...formData, openHours: e.target.value })}
                  style={{ backgroundColor: formData.openHours ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.openHours
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.openHours ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.openHours || 'Program de lucru'}
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
                  placeholder="Selectează limbile"
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.languages ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.languages || 'Selectează limbile'}
                </p>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Card 3: Specialități & Servicii */}
        <div 
          className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Stethoscope className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-1">Servicii</p>
                <h3 className="text-white text-2xl font-bold">Specialități & Servicii</h3>
              </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-purple-400" />
                Specialități
              </label>
              {isEditing ? (
                <MultiSelect
                  value={formData.specialties}
                  onChange={(value) => setFormData({ ...formData, specialties: value })}
                  options={SPECIALIZATIONS}
                  placeholder="Selectează specialitățile oferite"
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.specialties ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.specialties || 'Selectează specialitățile oferite'}
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                Asigurări acceptate
              </label>
              {isEditing ? (
                <MultiSelect
                  value={formData.insuranceAccepted}
                  onChange={(value) => setFormData({ ...formData, insuranceAccepted: value })}
                  options={INSURANCE_TYPES}
                  placeholder="Selectează tipurile de asigurări"
                />
              ) : (
                <p className={`text-base transition-colors ${
                  profile?.insuranceAccepted ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.insuranceAccepted || 'Selectează tipurile de asigurări'}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                Facilități
              </label>
              {isEditing ? (
                <Textarea
                  placeholder="Facilități oferite (ex: parcare, accesibilitate, etc.)"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  style={{ backgroundColor: formData.facilities ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.facilities
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                  rows={3}
                />
              ) : (
                <p className={`text-base transition-colors whitespace-pre-wrap ${
                  profile?.facilities ? 'text-white font-medium' : 'text-white/40 italic'
                }`}>
                  {profile?.facilities || 'Facilități oferite'}
                </p>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Card 4: Despre clinică */}
        <div 
          className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <MessageSquare className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-1">Despre</p>
                <h3 className="text-white text-2xl font-bold">Despre clinică</h3>
              </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                Despre clinică
              </label>
              {isEditing ? (
                <Textarea
                  placeholder="Povestește despre clinică, istoric, valori, filozofie..."
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
                    {profile?.about || 'Povestește despre clinică, istoric, valori, filozofie...'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1.5 block font-medium flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                Descriere detaliată
              </label>
              {isEditing ? (
                <Textarea
                  placeholder="Descriere detaliată a serviciilor și abordării clinicii..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ backgroundColor: formData.description ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)' }}
                  className={`text-sm transition-all duration-300 text-white border ${
                    !formData.description
                      ? 'border-white/10 placeholder:text-white/30 hover:border-purple-500/30 focus:border-purple-500/50'
                      : 'border-purple-500/30'
                  }`}
                  rows={6}
                />
              ) : (
                <div className={`relative p-4 rounded-xl border transition-all duration-300 ${
                  profile?.description 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 border-dashed'
                }`}>
                  <p className={`text-base leading-relaxed whitespace-pre-wrap transition-colors ${
                    profile?.description ? 'text-white font-medium' : 'text-white/40 italic'
                  }`}>
                    {profile?.description || 'Descriere detaliată a serviciilor și abordării clinicii...'}
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Card 5: Galerie imagini */}
        <div 
          className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 animate-fade-in-up"
          style={{ animationDelay: '0.65s' }}
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <ImageIcon className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider mb-1">Galerie</p>
                <h3 className="text-white text-2xl font-bold">Galerie imagini</h3>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadingGalleryImages.length > 0}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 hover:text-white flex items-center gap-2 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20"
                  >
                    {uploadingGalleryImages.length > 0 ? (
                      <>
                        <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                        Se încarcă...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Adaugă imagini
                      </>
                    )}
                  </button>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImageUpload}
                    className="hidden"
                  />
                  <span className="text-white/40 text-sm">Poți selecta mai multe imagini</span>
                </div>

                {getGalleryImages().length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {getGalleryImages().map((imageUrl, index) => (
                      <div key={index} className="relative group/image-item">
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                          <img
                            src={imageUrl}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(index)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 border border-red-400/50 flex items-center justify-center opacity-0 group-hover/image-item:opacity-100 transition-opacity duration-300 shadow-lg"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {getGalleryImages().length === 0 && (
                  <div className="p-8 rounded-xl border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5 text-center">
                    <ImageIcon className="w-12 h-12 text-purple-300/50 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Nicio imagine încărcată</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {getGalleryImages().length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {getGalleryImages().map((imageUrl, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5 group/image-preview">
                        <img
                          src={imageUrl}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover group-hover/image-preview:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5 text-center">
                    <ImageIcon className="w-12 h-12 text-purple-300/50 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">Nicio imagine încărcată</p>
                  </div>
                )}
              </div>
            )}
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
