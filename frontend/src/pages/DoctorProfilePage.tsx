import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, Eye, Building2, ArrowLeft, GraduationCap, Briefcase, Languages, DollarSign, Phone, Mail, Globe } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8080/api/users/doctors/${id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Doctor not found');
          }
          return res.json();
        })
        .then((data: UserResponse) => {
          setDoctor(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching doctor:', err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1437] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-[#0b1437] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Doctor not found</h1>
          <Button onClick={() => navigate('/doctori')}>Back to Doctors</Button>
        </div>
      </div>
    );
  }

  const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;

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
                  <div className="w-full h-full bg-[#2d4a7c] flex items-center justify-center">
                    <Eye className="w-16 h-16 text-[#6b7bb5]" />
                  </div>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-white text-4xl font-bold mb-2">{doctorName}</h1>
                  <p className="text-blue-400 text-xl">General Medicine</p>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 pt-2">
                  {doctor.email && (
                    <div className="flex items-center gap-2 text-[#a3aed0]">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <span>{doctor.email}</span>
                    </div>
                  )}
                  {doctor.phone && (
                    <div className="flex items-center gap-2 text-[#a3aed0]">
                      <Phone className="w-5 h-5 text-blue-400" />
                      <span>{doctor.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Bio Section */}
          <Card className="p-8 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
            <h2 className="text-white text-2xl font-semibold mb-4">About</h2>
            <p className="text-[#a3aed0] leading-relaxed">
              Profile information pending. Doctor can update their profile from the dashboard.
            </p>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate(`/doctor/${id}/book`)}
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
