import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [reducedMotion, setReducedMotion] = useState(false);
  const particlesFarRef = useRef<HTMLDivElement>(null);
  const particlesMidRef = useRef<HTMLDivElement>(null);
  const particlesNearRef = useRef<HTMLDivElement>(null);

  const particles = useMemo(() => {
    const count = 40;
    const pickDepth = () => {
      const r = Math.random();
      if (r < 0.45) return 0;
      if (r < 0.8) return 1;
      return 2;
    };
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 20,
      depth: pickDepth(),
      twinkleDelay: Math.random() * 6,
      twinkleDuration: 3.5 + Math.random() * 4.5,
    }));
  }, []);

  const particlesByDepth = useMemo(() => {
    const far = [];
    const mid = [];
    const near = [];
    for (const p of particles) {
      if (p.depth === 0) far.push(p);
      else if (p.depth === 1) mid.push(p);
      else near.push(p);
    }
    return { far, mid, near };
  }, [particles]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;

    const onChange = () => setReducedMotion(Boolean(media.matches));
    onChange();

    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);

    return () => {
      if (media.removeEventListener) media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let rafId: number;
    const startTime = Date.now();

    const animate = () => {
      const t = Date.now() - startTime;

      // Animate particles with subtle movement
      const farEl = particlesFarRef.current;
      const midEl = particlesMidRef.current;
      const nearEl = particlesNearRef.current;

      if (farEl) {
        const ax = Math.sin(t * 0.000035) * 10 + Math.cos(t * 0.00002) * 6;
        const ay = Math.cos(t * 0.00003) * 7 + Math.sin(t * 0.000018) * 5;
        farEl.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
      }
      if (midEl) {
        const ax = Math.cos(t * 0.00003) * 14 + Math.sin(t * 0.000022) * 8;
        const ay = Math.sin(t * 0.000028) * 10 + Math.cos(t * 0.000019) * 6;
        midEl.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
      }
      if (nearEl) {
        const ax = Math.sin(t * 0.000028) * 18 + Math.cos(t * 0.00002) * 10;
        const ay = Math.cos(t * 0.000026) * 12 + Math.sin(t * 0.000017) * 8;
        nearEl.style.transform = `translate3d(${ax}px, ${ay}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

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
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-x-hidden">
      {/* Animated background gradient orbs */}
      <div className="fixed -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px] pointer-events-none" style={{ willChange: "transform" }}></div>
      <div className="fixed -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px] pointer-events-none" style={{ willChange: "transform" }}></div>
      <div className="fixed top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px] pointer-events-none"></div>

      {/* Floating particles animation */}
      <>
        {/* Far layer */}
        <div
          ref={particlesFarRef}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {particlesByDepth.far.map((p) => (
            <div
              key={p.id}
              className={`absolute ${reducedMotion ? "" : "animate-float-soft"}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${16 + p.duration * 0.9}s`,
              }}
            >
              <div
                className={`${reducedMotion ? "" : "animate-twinkle"}`}
                style={{
                  width: "2px",
                  height: "2px",
                  borderRadius: "9999px",
                  backgroundColor: "rgb(168, 85, 247)",
                  boxShadow: "0 0 6px rgba(168, 85, 247, 0.35)",
                  "--twinkle-min": 0.22,
                  "--twinkle-max": 0.6,
                  animationDelay: `${p.twinkleDelay}s`,
                  animationDuration: `${p.twinkleDuration + 1.5}s`,
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        {/* Mid layer */}
        <div
          ref={particlesMidRef}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {particlesByDepth.mid.map((p) => (
            <div
              key={p.id}
              className={`absolute ${reducedMotion ? "" : "animate-float-soft"}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${14 + p.duration * 0.75}s`,
              }}
            >
              <div
                className={`${reducedMotion ? "" : "animate-twinkle"}`}
                style={{
                  width: "2.5px",
                  height: "2.5px",
                  borderRadius: "9999px",
                  backgroundColor: "rgb(168, 85, 247)",
                  boxShadow: "0 0 8px rgba(168, 85, 247, 0.4)",
                  "--twinkle-min": 0.28,
                  "--twinkle-max": 0.78,
                  animationDelay: `${p.twinkleDelay}s`,
                  animationDuration: `${p.twinkleDuration}s`,
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        {/* Near layer */}
        <div
          ref={particlesNearRef}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {particlesByDepth.near.map((p) => (
            <div
              key={p.id}
              className={`absolute ${reducedMotion ? "" : "animate-float-soft"}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${12 + p.duration * 0.6}s`,
              }}
            >
              <div
                className={`${reducedMotion ? "" : "animate-twinkle"}`}
                style={{
                  width: "3px",
                  height: "3px",
                  borderRadius: "9999px",
                  backgroundColor: "rgb(168, 85, 247)",
                  boxShadow: "0 0 10px rgba(168, 85, 247, 0.5)",
                  "--twinkle-min": 0.35,
                  "--twinkle-max": 0.95,
                  animationDelay: `${p.twinkleDelay}s`,
                  animationDuration: `${Math.max(2.8, p.twinkleDuration - 0.8)}s`,
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
      </>

      <div className="max-w-6xl mx-auto px-6 py-6 relative z-10">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/doctori')}
          variant="outline"
          className="mb-6 backdrop-blur-xl bg-white/5 border-white/10 text-purple-200/70 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi la Doctori
        </Button>

        {/* Main Content */}
        <div className="space-y-5">
          {/* Profile Header */}
          <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:border-purple-500/30 animate-fade-in-up">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative z-10 flex flex-col md:flex-row gap-6">
              {/* Doctor Image */}
              <div className="flex-shrink-0">
                <div className="w-40 h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/30 via-purple-600/30 to-purple-700/30 border-2 border-purple-400/50 shadow-2xl shadow-purple-500/50 transition-all duration-500">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={doctorName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center">
                      <Eye className="w-16 h-16 text-purple-200" />
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-white text-4xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">{doctorName}</h1>
                  <p className="text-purple-300 text-xl font-semibold mb-1">{specialization}</p>
                  {tagline && (
                    <p className="text-purple-200/70 text-base italic">{tagline}</p>
                  )}
                </div>

                {/* Contact Information - Compact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {professionalEmail && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <Mail className="w-4 h-4 text-purple-300 flex-shrink-0" />
                      <span className="text-white text-sm font-medium truncate">{professionalEmail}</span>
                    </div>
                  )}
                  {clinicPhone && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <Phone className="w-4 h-4 text-purple-300 flex-shrink-0" />
                      <span className="text-white text-sm font-medium">{clinicPhone}</span>
                    </div>
                  )}
                  {generalAvailability && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <Clock className="w-4 h-4 text-purple-300 flex-shrink-0" />
                      <span className="text-white text-sm font-medium">{generalAvailability}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About and Professional Data - Combined Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* About Section */}
            {about && (
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <h2 className="text-white text-xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Despre</h2>
                  <p className="text-purple-200/80 leading-relaxed text-sm whitespace-pre-wrap">
                    {about}
                  </p>
                </div>
              </div>
            )}

            {/* Professional Data */}
            {(profile?.yearsOfExperience || profile?.clinics || profile?.consultationTypes || profile?.languages || profile?.medicalInterests) && (
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    <h2 className="text-white text-xl font-bold">Date profesionale</h2>
                  </div>
                  <div className="space-y-3">
                    {profile.yearsOfExperience && (
                      <div>
                        <p className="text-white/50 text-xs mb-1">Ani de experiență</p>
                        <p className="text-white/80 text-sm font-semibold">{profile.yearsOfExperience}</p>
                      </div>
                    )}
                    {profile.languages && (
                      <div>
                        <p className="text-white/50 text-xs mb-1">Limbi vorbite</p>
                        <p className="text-white/80 text-sm font-semibold">{profile.languages}</p>
                      </div>
                    )}
                    {profile.clinics && (
                      <div>
                        <p className="text-white/50 text-xs mb-1">Clinici</p>
                        <p className="text-white/80 text-sm whitespace-pre-wrap">{profile.clinics}</p>
                      </div>
                    )}
                    {profile.consultationTypes && (
                      <div>
                        <p className="text-white/50 text-xs mb-1">Tipuri de consultații</p>
                        <p className="text-white/80 text-sm whitespace-pre-wrap">{profile.consultationTypes}</p>
                      </div>
                    )}
                    {profile.medicalInterests && (
                      <div>
                        <p className="text-white/50 text-xs mb-1">Arii de interes</p>
                        <p className="text-white/80 text-sm">{profile.medicalInterests}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Work Style */}
          {profile?.workStyle && (
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-2xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:border-purple-500/30 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-purple-400" />
                  <h2 className="text-white text-xl font-bold">Stil de lucru</h2>
                </div>
                <p className="text-purple-200/80 leading-relaxed text-sm whitespace-pre-wrap">
                  {profile.workStyle}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <Button
              onClick={() => navigate(`/doctor/${id}/book`)}
              className="w-full max-w-md bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl px-8 py-5 text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-bold hover:scale-105"
            >
              Programează-te
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
