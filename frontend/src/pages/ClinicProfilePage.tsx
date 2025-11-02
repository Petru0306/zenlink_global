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
      <div className="min-h-screen bg-[#0b1437] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Clinic not found</h1>
          <Button onClick={() => navigate('/clinici')}>Back to Clinics</Button>
        </div>
      </div>
    );
  }

  const handleViewDoctor = (doctorId: number) => {
    navigate(`/doctor/${doctorId}`);
  };

  return (
    <div className="min-h-screen bg-[#0b1437]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/clinici')}
          variant="outline"
          className="mb-6 bg-[#1a2f5c] border-[#2d4a7c] text-[#a3aed0] hover:text-white hover:border-blue-500 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clinics
        </Button>

        <div className="space-y-6">
          {/* Clinic Header */}
          <Card className="p-8 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl overflow-hidden">
            {/* Image */}
            <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
              <ImageWithFallback
                src={clinic.image}
                alt={clinic.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1437] via-transparent to-transparent"></div>
              {clinic.featured && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Featured
                </div>
              )}
            </div>

            {/* Clinic Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-white text-4xl font-bold">{clinic.name}</h1>
                    {clinic.verified && (
                      <CheckCircle2 className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[#a3aed0] mb-4">
                    <MapPin className="w-5 h-5" />
                    <span>{clinic.location}</span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#2d4a7c]">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-white font-semibold text-lg">{clinic.rating.toFixed(1)}</span>
                  <span className="text-[#6b7bb5]">({clinic.reviews} reviews)</span>
                </div>
                {clinic.patients && (
                  <>
                    <span className="text-[#2d4a7c]">•</span>
                    <div className="flex items-center gap-2 text-[#a3aed0]">
                      <Users className="w-5 h-5" />
                      <span>{clinic.patients.toLocaleString()}+ patients</span>
                    </div>
                  </>
                )}
                {clinic.openHours && (
                  <>
                    <span className="text-[#2d4a7c]">•</span>
                    <div className="flex items-center gap-2 text-[#a3aed0]">
                      <Clock className="w-5 h-5 text-green-400" />
                      <span>{clinic.openHours}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              {clinic.description && (
                <p className="text-[#a3aed0] leading-relaxed pt-4">{clinic.description}</p>
              )}
            </div>
          </Card>

          {/* Specialties */}
          {clinic.specialties && clinic.specialties.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
              <h2 className="text-white text-2xl font-semibold mb-4">Specialties</h2>
              <div className="flex flex-wrap gap-3">
                {clinic.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 px-4 py-2 rounded-full text-sm border border-blue-500/30"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Contact Information */}
          <Card className="p-8 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
            <h2 className="text-white text-2xl font-semibold mb-6">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {clinic.phone && (
                <div className="flex items-center gap-3 text-[#a3aed0]">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span>{clinic.phone}</span>
                </div>
              )}
              {clinic.email && (
                <div className="flex items-center gap-3 text-[#a3aed0]">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>{clinic.email}</span>
                </div>
              )}
              {clinic.website && (
                <a
                  href={clinic.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  <span>Visit Website</span>
                </a>
              )}
            </div>
            {clinic.address && (
              <div className="flex items-start gap-3 text-[#a3aed0] mt-4 pt-4 border-t border-[#2d4a7c]">
                <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <span>{clinic.address}</span>
              </div>
            )}
          </Card>

          {/* Doctors Section */}
          {doctors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-3xl font-semibold">Our Doctors</h2>
                <span className="text-[#a3aed0]">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''}</span>
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
            <Card className="p-8 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl text-center">
              <Building2 className="w-16 h-16 text-[#6b7bb5] mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">No Doctors Listed</h3>
              <p className="text-[#a3aed0]">This clinic doesn't have any doctors listed yet.</p>
            </Card>
          )}

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl px-10 py-6 text-lg shadow-lg shadow-blue-500/30"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

