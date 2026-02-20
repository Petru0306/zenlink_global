import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Users, CheckCircle2, Phone, Clock, ArrowLeft, Mail, Globe, Building2, ChevronLeft, ChevronRight, Image as ImageIcon, Stethoscope, User } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { clinicProfileService, type ClinicProfileResponse } from '../services/clinicProfileService';
import { clinicDoctorService, type ClinicDoctor } from '../services/clinicDoctorService';

interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
}

export default function ClinicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clinicId = id ? parseInt(id, 10) : null;
  const [clinic, setClinic] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<ClinicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);

  useEffect(() => {
    if (id) {
      const clinicIdNum = parseInt(id, 10);
      
      // Load basic clinic info
      fetch(`${import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/users/clinics/${id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Clinic not found');
          }
          return res.json();
        })
        .then((data: UserResponse) => {
          setClinic(data);
        })
        .catch(err => {
          console.error('Error fetching clinic:', err);
          // Don't set loading to false here, let profile loading handle it
        });

      // Load clinic profile
      clinicProfileService.getClinicProfile(clinicIdNum)
        .then((profileData) => {
          setProfile(profileData);
        })
        .catch(err => {
          console.error('Error fetching clinic profile:', err);
        });

      // Load clinic doctors
      clinicDoctorService.getClinicDoctors(clinicIdNum)
        .then((doctorsData) => {
          setDoctors(doctorsData);
        })
        .catch(err => {
          console.error('Error fetching clinic doctors:', err);
          setDoctors([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const getGalleryImages = (): string[] => {
    if (!profile?.galleryImages) return [];
    try {
      return JSON.parse(profile.galleryImages);
    } catch {
      return [];
    }
  };

  const galleryImages = getGalleryImages();

  const nextGalleryImage = () => {
    if (galleryImages.length > 0) {
      setCurrentGalleryIndex((prev) => (prev + 1) % galleryImages.length);
    }
  };

  const prevGalleryImage = () => {
    if (galleryImages.length > 0) {
      setCurrentGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show error only if we finished loading and have no clinic data at all
  if (!loading && !clinic && !profile) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-6">Clinic not found</h1>
          <Button
            onClick={() => navigate('/clinici')}
            className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white"
          >
            Back to Clinics
          </Button>
        </div>
      </div>
    );
  }

  const clinicName = profile?.name || (clinic ? `${clinic.firstName} ${clinic.lastName} Clinic` : 'Clinic');
  const clinicBanner = profile?.bannerImageUrl || null;
  const clinicLocation = profile?.address || 'Location not set';
  const clinicDescription = profile?.description || profile?.about || '';
  const clinicSpecialties = profile?.specialties ? profile.specialties.split(',').map(s => s.trim()).filter(Boolean) : [];
  const clinicPhone = profile?.phone || clinic?.phone || '';
  const clinicEmail = profile?.email || clinic?.email || '';
  const clinicWebsite = profile?.website || '';
  const clinicAddress = profile?.address || '';

  const handleViewDoctor = (doctorId: number) => {
    navigate(`/doctor/${doctorId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px]" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-8 relative z-10">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/clinici')}
          variant="outline"
          className="mb-8 backdrop-blur-xl bg-white/5 border-white/10 text-purple-200/70 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clinics
        </Button>

        <div className="space-y-5">
          {/* Clinic Header - Compact */}
          <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 overflow-hidden animate-fade-in-up">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Banner Image - Compact */}
                {clinicBanner ? (
                  <div className="relative h-48 rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-lg shadow-purple-500/20">
                    <ImageWithFallback
                      src={clinicBanner}
                      alt={`${clinicName} banner`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="relative h-48 rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-lg shadow-purple-500/20 bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-purple-300/50" />
                  </div>
                )}

                {/* Clinic Info - Compact */}
                <div className="space-y-4">
                  <div>
                    <h1 className="text-white text-3xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">{clinicName}</h1>
                    {clinicLocation && (
                      <div className="flex items-center gap-2 text-purple-200/70 text-sm font-medium">
                        <MapPin className="w-4 h-4 text-purple-300" />
                        <span>{clinicLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info - Compact Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clinicEmail && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                        <Mail className="w-4 h-4 text-purple-300 flex-shrink-0" />
                        <span className="text-white text-sm font-medium truncate">{clinicEmail}</span>
                      </div>
                    )}
                    {clinicPhone && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                        <Phone className="w-4 h-4 text-purple-300 flex-shrink-0" />
                        <span className="text-white text-sm font-medium">{clinicPhone}</span>
                      </div>
                    )}
                    {profile?.openHours && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                        <Clock className="w-4 h-4 text-purple-300 flex-shrink-0" />
                        <span className="text-white text-sm font-medium">{profile.openHours}</span>
                      </div>
                    )}
                    {clinicWebsite && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                        <Globe className="w-4 h-4 text-purple-300 flex-shrink-0" />
                        <a href={clinicWebsite} target="_blank" rel="noopener noreferrer" className="text-white text-sm font-medium hover:text-purple-300 transition-colors truncate">
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Tagline */}
                  {profile?.tagline && (
                    <p className="text-purple-200/70 text-sm italic">{profile.tagline}</p>
                  )}

                  {/* Stats Row - Compact */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-white font-bold text-sm">{(clinic?.rating ?? 0).toFixed(1)}</span>
                      <span className="text-purple-200/60 text-xs">({clinic?.reviews ?? 0})</span>
                    </div>
                    {(clinic?.patients ?? 0) > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <Users className="w-4 h-4 text-purple-300" />
                        <span className="text-white font-semibold text-sm">{(clinic.patients ?? 0).toLocaleString()}+</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery and Specialties - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gallery Images Carousel - Compact */}
            {galleryImages.length > 0 && (
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Galerie imagini</h2>
                    <div className="flex items-center gap-2 text-purple-200/70 text-xs">
                      <ImageIcon className="w-4 h-4" />
                      <span>{currentGalleryIndex + 1} / {galleryImages.length}</span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="relative h-64 rounded-xl overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                      <img
                        src={galleryImages[currentGalleryIndex]}
                        alt={`Gallery image ${currentGalleryIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Navigation Buttons */}
                      {galleryImages.length > 1 && (
                        <>
                          <button
                            onClick={prevGalleryImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 hover:border-purple-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 z-20"
                          >
                            <ChevronLeft className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={nextGalleryImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 hover:border-purple-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 z-20"
                          >
                            <ChevronRight className="w-4 h-4 text-white" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                            {galleryImages.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentGalleryIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  index === currentGalleryIndex
                                    ? 'bg-purple-400 w-6'
                                    : 'bg-white/30 hover:bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {galleryImages.length > 1 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                        {galleryImages.map((imageUrl, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentGalleryIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                              index === currentGalleryIndex
                                ? 'border-purple-400 scale-105'
                                : 'border-white/20 hover:border-purple-500/50'
                            }`}
                          >
                            <img
                              src={imageUrl}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Specialties - Compact */}
            {clinicSpecialties.length > 0 && (
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <h2 className="text-white text-xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Specializări</h2>
                  <div className="flex flex-col gap-3">
                    {clinicSpecialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 px-4 py-3 rounded-xl text-base font-semibold border border-purple-500/30 shadow-lg shadow-purple-500/20 w-full text-center"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Doctors Section - Larger Cards */}
          {doctors.length > 0 && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">Doctori</h2>
                <span className="text-purple-200/70 text-sm font-semibold">{doctors.length} doctor{doctors.length !== 1 ? 'i' : ''}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    onClick={() => handleViewDoctor(doctor.id)}
                    className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        {doctor.profileImageUrl ? (
                          <img
                            src={doctor.profileImageUrl}
                            alt={`${doctor.firstName} ${doctor.lastName}`}
                            className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/30"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Stethoscope className="w-10 h-10 text-purple-300" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg">
                            {doctor.firstName} {doctor.lastName}
                          </h3>
                          {doctor.specializations && (
                            <p className="text-purple-300 text-sm font-medium">
                              {doctor.specializations.split(',')[0]}
                            </p>
                          )}
                        </div>
                      </div>
                      {doctor.tagline && (
                        <p className="text-purple-200/70 text-sm mb-3 line-clamp-2">{doctor.tagline}</p>
                      )}
                      {doctor.email && (
                        <div className="flex items-center gap-2 text-purple-200/60 text-xs">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Doctors Message */}
          {doctors.length === 0 && (
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-12 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <Building2 className="w-20 h-20 text-purple-300 mx-auto mb-6" />
                <h3 className="text-white text-2xl font-bold mb-3">No Doctors Listed</h3>
                <p className="text-purple-200/70 text-lg">This clinic doesn't have any doctors listed yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

