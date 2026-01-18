import { Calendar, FileText, Pill, Clock } from 'lucide-react';

interface PatientOverviewStatsProps {
  totalAppointments?: number;
  totalDocuments?: number;
  activePrescriptions?: number;
  nextVisit?: string;
  nextVisitDate?: string;
}

export function PatientOverviewStats({ 
  totalAppointments = 47,
  totalDocuments = 23,
  activePrescriptions = 2,
  nextVisit = '3 zile',
  nextVisitDate = '18 Nov, 15:30'
}: PatientOverviewStatsProps) {
  const stats = [
    {
      icon: Calendar,
      label: 'Programări totale',
      value: String(totalAppointments),
      subtext: 'Ultima: 15 Oct',
      gradient: 'from-purple-500/20 to-purple-600/20',
      border: 'border-purple-500/30',
      iconColor: 'text-purple-200',
    },
    {
      icon: FileText,
      label: 'Documente',
      value: String(totalDocuments),
      subtext: '5 noi',
      gradient: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-200',
    },
    {
      icon: Pill,
      label: 'Prescripții',
      value: String(activePrescriptions),
      subtext: 'Active',
      gradient: 'from-emerald-500/20 to-emerald-600/20',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-200',
    },
    {
      icon: Clock,
      label: 'Următoarea vizită',
      value: nextVisit,
      subtext: nextVisitDate,
      gradient: 'from-pink-500/20 to-pink-600/20',
      border: 'border-pink-500/30',
      iconColor: 'text-pink-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 hover:border-purple-500/30 animate-fade-in-up"
            style={{ animationDelay: `${0.1 * index}s` }}
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} border ${stat.border} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-purple-200/70 text-xs font-medium uppercase tracking-wider mb-3">{stat.label}</p>
              <p className="text-white text-4xl font-bold mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-white/40 text-sm font-medium">{stat.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

