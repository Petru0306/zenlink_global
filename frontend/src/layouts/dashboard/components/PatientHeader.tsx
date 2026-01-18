import { Mail, Phone, Calendar, Droplet } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface PatientHeaderProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  age?: number | string;
  bloodType?: string;
}

export function PatientHeader({ 
  firstName = 'Ion', 
  lastName = 'Popescu', 
  email = 'ion.popescu@email.com', 
  phone = '+40 721 123 456',
  age = 34,
  bloodType = 'A+'
}: PatientHeaderProps) {
  const ageLabel = age === undefined || age === null || age === '' ? '—' : `${age} ani`;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={cardRef}
      className="relative group backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-3xl p-10 border border-white/20 shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(147, 51, 234, 0.1), transparent 50%)',
      }}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start">
        {/* Avatar with glow effect */}
        <div className="flex-shrink-0 relative">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500/30 via-purple-600/30 to-purple-700/30 border-2 border-purple-400/50 flex items-center justify-center shadow-2xl shadow-purple-500/50 group-hover:scale-110 transition-all duration-500 group-hover:rotate-3">
            <span className="text-white text-4xl font-bold">{firstName?.[0] || 'U'}{lastName?.[0] || 'U'}</span>
          </div>
          <div className="absolute -inset-4 rounded-3xl bg-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
        </div>

        {/* Patient Info */}
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">
              {firstName} {lastName}
            </h2>
            <p className="text-purple-300/70 text-sm font-medium uppercase tracking-wider">#PAT-2024-0847</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="group/info flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover/info:scale-110 transition-transform duration-300">
                <Calendar className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-1">Vârstă</p>
                <p className="text-white text-lg font-bold">{ageLabel}</p>
              </div>
            </div>
            <div className="group/info flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover/info:scale-110 transition-transform duration-300">
                <Droplet className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-1">Grup sanguin</p>
                <p className="text-white text-lg font-bold">{bloodType}</p>
              </div>
            </div>
            <div className="group/info flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover/info:scale-110 transition-transform duration-300">
                <Mail className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-1">Email</p>
                <p className="text-white text-sm font-semibold truncate">{email}</p>
              </div>
            </div>
            <div className="group/info flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover/info:scale-110 transition-transform duration-300">
                <Phone className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wide mb-1">Telefon</p>
                <p className="text-white text-sm font-semibold">{phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col gap-3">
          <span className="px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-200 rounded-2xl text-sm font-bold text-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20 hover:scale-110 transition-transform duration-300">
            Activ
          </span>
        </div>
      </div>
    </div>
  );
}

