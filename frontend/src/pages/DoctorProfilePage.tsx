import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, Eye, Building2, ArrowLeft, GraduationCap, Briefcase, Languages, DollarSign, Phone, Mail, Globe } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { getDoctorById, getClinicById } from '../data/mockData';

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const doctorId = id ? parseInt(id, 10) : null;
  const doctor = doctorId ? getDoctorById(doctorId) : null;
  const clinic = doctor ? getClinicById(doctor.clinicId) : null;

  if (!doctor || !doctorId) {
    return (
      <div className="min-h-screen bg-[#0b1437] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Doctor not found</h1>
          <Button onClick={() => navigate('/doctori')}>Back to Doctors</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1437]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/doctori')}
          variant="outline"
          className="mb-6 bg-[#1a2f5c] border-[#2d4a7c] text-[#a3aed0] hover:text-white hover:border-blue-500 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Doctors
        </Button>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="p-8 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Doctor Image */}
              <div className="flex-shrink-0">
                <div className="w-48 h-48 rounded-3xl overflow-hidden bg-[#2d4a7c] ring-4 ring-[#2d4a7c]/50">
                  {doctor.imageUrl ? (
                    <ImageWithFallback
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2d4a7c] flex items-center justify-center">
                      <Eye className="w-16 h-16 text-[#6b7bb5]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-white text-4xl font-bold mb-2">{doctor.name}</h1>
                  <p className="text-blue-400 text-xl">{doctor.specialization}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(doctor.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-[#2d4a7c]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white font-semibold text-lg">{doctor.rating}</span>
                  <span className="text-[#6b7bb5]">({doctor.reviewsCount} reviews)</span>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div className="flex items-center gap-2 text-[#a3aed0]">
                    <Eye className="w-5 h-5" />
                    <span>{doctor.views.toLocaleString()} views</span>
                  </div>
                  {doctor.consultationFee && (
                    <div className="flex items-center gap-2 text-[#a3aed0]">
                      <DollarSign className="w-5 h-5" />
                      <span>{doctor.consultationFee} RON</span>
                    </div>
                  )}
                </div>

                {/* Clinic Link */}
                {clinic && (
                  <Link to={`/clinic/${clinic.id}`}>
                    <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all mt-4">
                      <Building2 className="w-5 h-5" />
                      <span>{clinic.name}</span>
                    </div>
                  </Link>
                )}

                {/* Location */}
                <div className="flex items-start gap-2 text-[#a3aed0] pt-2">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                  <span>{doctor.fullAddress}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Bio Section */}
          {doctor.bio && (
            <Card className="p-8 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
              <h2 className="text-white text-2xl font-semibold mb-4">About</h2>
              <p className="text-[#a3aed0] leading-relaxed">{doctor.bio}</p>
              {doctor.experience && (
                <div className="mt-4 flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <span className="text-[#a3aed0]">{doctor.experience}</span>
                </div>
              )}
            </Card>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            {doctor.education && doctor.education.length > 0 && (
              <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-400" />
                  <h3 className="text-white text-xl font-semibold">Education</h3>
                </div>
                <ul className="space-y-2">
                  {doctor.education.map((edu, index) => (
                    <li key={index} className="text-[#a3aed0] flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{edu}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Languages */}
            {doctor.languages && doctor.languages.length > 0 && (
              <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Languages className="w-6 h-6 text-blue-400" />
                  <h3 className="text-white text-xl font-semibold">Languages</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {doctor.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 px-4 py-2 rounded-full text-sm border border-blue-500/30"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Contact Information */}
          {clinic && (
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
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate(`/doctor/${doctorId}/book`)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl px-8 py-6 text-lg shadow-lg shadow-blue-500/30"
            >
              Programează-te
            </Button>
            <Button
              variant="outline"
              className="bg-[#1a2f5c] border-[#2d4a7c] text-[#a3aed0] hover:text-white hover:border-blue-500 transition-all rounded-xl px-8 py-6"
            >
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

