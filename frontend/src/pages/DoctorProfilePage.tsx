import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Eye, Building2, ArrowLeft, GraduationCap, Briefcase, Languages, DollarSign, Phone, Mail, Globe, Clock, Heart, Stethoscope } from 'lucide-react';
import { Button } from '../components/ui/button';
import { doctorProfileService, type DoctorProfileResponse } from '../services/doctorProfileService';

interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
}

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<DoctorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const doctorId = parseInt(id, 10);
      
      // Load basic doctor info
      fetch(`http://localhost:8080/api/users/doctors/${id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Doctor not found');
          }
          return res.json();
        })
        .then((data: UserResponse) => {
          setDoctor(data);
        })
        .catch(err => {
          console.error('Error fetching doctor:', err);
        });

      // Load doctor profile
      doctorProfileService.getDoctorProfile(doctorId)
        .then((profileData) => {
          setProfile(profileData);
        })
        .catch(err => {
          console.error('Error fetching doctor profile:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-6">Doctor not found</h1>
          <Button 
            onClick={() => navigate('/doctori')}
            className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white"
          >
            Back to Doctors
          </Button>
        </div>
      </div>
    );
  }

  const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '';
  const specialization = profile?.specializations || 'Medic general';
  const tagline = profile?.tagline || '';
  const about = profile?.about || '';
  const professionalEmail = profile?.professionalEmail || doctor?.email || '';
  const clinicPhone = profile?.clinicPhone || doctor?.phone || '';
  const generalAvailability = profile?.generalAvailability || '';

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px]" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/doctori')}
          variant="outline"
          className="mb-8 backdrop-blur-xl bg-white/5 border-white/10 text-purple-200/70 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi la Doctori
        </Button>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-10 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative z-10 flex flex-col md:flex-row gap-10">
              {/* Doctor Image */}
              <div className="flex-shrink-0">
                <div className="w-56 h-56 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500/30 via-purple-600/30 to-purple-700/30 border-2 border-purple-400/50 shadow-2xl shadow-purple-500/50 group-hover:scale-110 transition-all duration-500">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={doctorName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center">
                      <Eye className="w-20 h-20 text-purple-200" />
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-white text-5xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">{doctorName}</h1>
                  <p className="text-purple-300 text-2xl font-semibold mb-2">{specialization}</p>
                  {tagline && (
                    <p className="text-purple-200/70 text-lg italic">{tagline}</p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-3 pt-4">
                  {professionalEmail && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Mail className="w-5 h-5 text-purple-200" />
                      </div>
                      <span className="text-white font-medium">{professionalEmail}</span>
                    </div>
                  )}
                  {clinicPhone && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Phone className="w-5 h-5 text-purple-200" />
                      </div>
                      <span className="text-white font-medium">{clinicPhone}</span>
                    </div>
                  )}
                  {generalAvailability && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Clock className="w-5 h-5 text-purple-200" />
                      </div>
                      <span className="text-white font-medium">{generalAvailability}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          {about && (
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <h2 className="text-white text-3xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Despre</h2>
                <p className="text-purple-200/80 leading-relaxed text-lg whitespace-pre-wrap">
                  {about}
                </p>
              </div>
            </div>
          )}

          {/* Professional Data */}
          {(profile?.yearsOfExperience || profile?.clinics || profile?.consultationTypes || profile?.languages || profile?.medicalInterests) && (
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                  <h2 className="text-white text-2xl font-bold">Date profesionale</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.yearsOfExperience && (
                    <div>
                      <p className="text-white/50 text-sm mb-1">Ani de experiență</p>
                      <p className="text-white/80 text-lg font-semibold">{profile.yearsOfExperience}</p>
                    </div>
                  )}
                  {profile.languages && (
                    <div>
                      <p className="text-white/50 text-sm mb-1">Limbi vorbite</p>
                      <p className="text-white/80 text-lg font-semibold">{profile.languages}</p>
                    </div>
                  )}
                  {profile.clinics && (
                    <div className="md:col-span-2">
                      <p className="text-white/50 text-sm mb-1">Clinici</p>
                      <p className="text-white/80 whitespace-pre-wrap">{profile.clinics}</p>
                    </div>
                  )}
                  {profile.consultationTypes && (
                    <div className="md:col-span-2">
                      <p className="text-white/50 text-sm mb-1">Tipuri de consultații</p>
                      <p className="text-white/80 whitespace-pre-wrap">{profile.consultationTypes}</p>
                    </div>
                  )}
                  {profile.medicalInterests && (
                    <div className="md:col-span-2">
                      <p className="text-white/50 text-sm mb-1">Arii de interes</p>
                      <p className="text-white/80">{profile.medicalInterests}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Work Style */}
          {profile?.workStyle && (
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-5 h-5 text-purple-400" />
                  <h2 className="text-white text-2xl font-bold">Stil de lucru</h2>
                </div>
                <p className="text-purple-200/80 leading-relaxed text-lg whitespace-pre-wrap">
                  {profile.workStyle}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button
              onClick={() => navigate(`/doctor/${id}/book`)}
              className="flex-1 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl px-8 py-6 text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-bold hover:scale-105"
            >
              Programează-te
            </Button>
            <Button
              variant="outline"
              className="backdrop-blur-xl bg-white/5 border-white/10 text-purple-200/70 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 rounded-xl px-8 py-6 font-semibold"
            >
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
