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

  const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;

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
          Back to Doctors
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
                  <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center">
                    <Eye className="w-20 h-20 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-white text-5xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">{doctorName}</h1>
                  <p className="text-purple-300 text-2xl font-semibold">General Medicine</p>
                </div>

                {/* Contact Information */}
                <div className="space-y-3 pt-4">
                  {doctor.email && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Mail className="w-5 h-5 text-purple-200" />
                      </div>
                      <span className="text-white font-medium">{doctor.email}</span>
                    </div>
                  )}
                  {doctor.phone && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Phone className="w-5 h-5 text-purple-200" />
                      </div>
                      <span className="text-white font-medium">{doctor.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative z-10">
              <h2 className="text-white text-3xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">About</h2>
              <p className="text-purple-200/80 leading-relaxed text-lg">
                Profile information pending. Doctor can update their profile from the dashboard.
              </p>
            </div>
          </div>

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
