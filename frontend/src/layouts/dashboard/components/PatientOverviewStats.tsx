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
    },
    {
      icon: FileText,
      label: 'Documente',
      value: String(totalDocuments),
      subtext: '5 noi',
    },
    {
      icon: Pill,
      label: 'Prescripții',
      value: String(activePrescriptions),
      subtext: 'Active',
    },
    {
      icon: Clock,
      label: 'Următoarea vizită',
      value: nextVisit,
      subtext: nextVisitDate,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                <Icon className="w-5 h-5 text-white/60" />
              </div>
            </div>
            <p className="text-white/40 text-sm mb-2">{stat.label}</p>
            <p className="text-white text-3xl mb-1">{stat.value}</p>
            <p className="text-white/30 text-xs">{stat.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}

