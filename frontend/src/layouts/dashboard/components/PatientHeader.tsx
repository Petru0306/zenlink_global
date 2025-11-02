import { Mail, Phone, Calendar, Droplet } from 'lucide-react';

interface PatientHeaderProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  age?: number;
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
  return (
    <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#5B8DEF]/20 to-[#4169E1]/20 border border-[#5B8DEF]/20 flex items-center justify-center">
            <span className="text-white text-2xl">{firstName[0]}{lastName[0]}</span>
          </div>
        </div>

        {/* Patient Info */}
        <div className="flex-1">
          <h2 className="text-white mb-1">{firstName} {lastName}</h2>
          <p className="text-white/40 text-sm mb-6">#PAT-2024-0847</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white/60" />
              </div>
              <div>
                <p className="text-white/40 text-xs">Vârstă</p>
                <p className="text-white text-sm">{age} ani</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                <Droplet className="w-4 h-4 text-white/60" />
              </div>
              <div>
                <p className="text-white/40 text-xs">Grup sanguin</p>
                <p className="text-white text-sm">{bloodType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                <Mail className="w-4 h-4 text-white/60" />
              </div>
              <div>
                <p className="text-white/40 text-xs">Email</p>
                <p className="text-white text-sm">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                <Phone className="w-4 h-4 text-white/60" />
              </div>
              <div>
                <p className="text-white/40 text-xs">Telefon</p>
                <p className="text-white text-sm">{phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-2">
          <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm text-center border border-emerald-500/20">
            Activ
          </span>
        </div>
      </div>
    </div>
  );
}

