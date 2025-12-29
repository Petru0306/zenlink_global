import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Users, CheckCircle2, Phone, Clock, ArrowLeft, Mail, Globe, Building2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { getClinicById, getDoctorsByClinicId } from '../data/mockData';
import { DoctorCard } from '../components/DoctorCard';

export default function ClinicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clinicId = id ? parseInt(id, 10) : null;
  const clinic = clinicId ? getClinicById(clinicId) : null;
  const doctors = clinicId ? getDoctorsByClinicId(clinicId) : [];

  if (!clinic || !clinicId) {
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

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/clinici')}
          variant="outline"
          className="mb-8 backdrop-blur-xl bg-white/5 border-white/10 text-purple-200/70 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clinics
        </Button>

        <div className="space-y-8">
          {/* Clinic Header */}
          <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-10 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 overflow-hidden animate-fade-in-up">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative z-10">
              {/* Image */}
              <div className="relative h-80 rounded-3xl overflow-hidden mb-8 border-2 border-purple-500/30 shadow-2xl shadow-purple-500/30">
                <ImageWithFallback
                  src={clinic.image}
                  alt={clinic.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                {clinic.featured && (
                  <div className="absolute top-6 left-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-2xl shadow-purple-500/50 border border-purple-400/50">
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></span>
                    Featured
                  </div>
                )}
              </div>

              {/* Clinic Info */}
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-white text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">{clinic.name}</h1>
                      {clinic.verified && (
                        <CheckCircle2 className="w-10 h-10 text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-purple-200/70 mb-6 text-lg font-medium">
                      <MapPin className="w-6 h-6 text-purple-300" />
                      <span>{clinic.location}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-white font-bold text-xl">{clinic.rating.toFixed(1)}</span>
                    <span className="text-purple-200/60">({clinic.reviews} reviews)</span>
                  </div>
                  {clinic.patients && (
                    <>
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Users className="w-6 h-6 text-purple-300" />
                        <span className="text-white font-semibold">{clinic.patients.toLocaleString()}+ patients</span>
                      </div>
                    </>
                  )}
                  {clinic.openHours && (
                    <>
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Clock className="w-6 h-6 text-green-400" />
                        <span className="text-white font-semibold">{clinic.openHours}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Description */}
                {clinic.description && (
                  <p className="text-purple-200/80 leading-relaxed pt-4 text-lg">{clinic.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Specialties */}
          {clinic.specialties && clinic.specialties.length > 0 && (
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <h2 className="text-white text-3xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Specialties</h2>
                <div className="flex flex-wrap gap-3">
                  {clinic.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 px-5 py-2.5 rounded-full text-sm font-semibold border border-purple-500/30 shadow-lg shadow-purple-500/20"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative z-10">
              <h2 className="text-white text-3xl font-bold mb-8 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {clinic.phone && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Phone className="w-6 h-6 text-purple-200" />
                    </div>
                    <span className="text-white font-medium">{clinic.phone}</span>
                  </div>
                )}
                {clinic.email && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Mail className="w-6 h-6 text-purple-200" />
                    </div>
                    <span className="text-white font-medium">{clinic.email}</span>
                  </div>
                )}
                {clinic.website && (
                  <a
                    href={clinic.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Globe className="w-6 h-6 text-purple-200" />
                    </div>
                    <span className="text-purple-200 group-hover:text-white font-medium transition-colors">Visit Website</span>
                  </a>
                )}
              </div>
              {clinic.address && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300 mt-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                    <MapPin className="w-6 h-6 text-purple-200" />
                  </div>
                  <span className="text-white font-medium pt-2">{clinic.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Doctors Section */}
          {doctors.length > 0 && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-white text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">Our Doctors</h2>
                <span className="text-purple-200/70 text-lg font-semibold">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-4">
                {doctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <DoctorCard doctor={doctor} onViewDoctor={handleViewDoctor} />
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

          {/* Action Button */}
          <div className="flex justify-center pt-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <Button
              className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl px-12 py-7 text-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-bold hover:scale-105"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

