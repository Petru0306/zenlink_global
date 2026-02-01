import { Search, CalendarCheck, Settings } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: Search,
    title: 'Descoperă',
    description: 'Caută medicul sau clinica potrivită — filtre, specializări, locație.',
  },
  {
    number: '2',
    icon: CalendarCheck,
    title: 'Programează',
    description: 'Alege un slot, confirmă programarea și primești remindere.',
  },
  {
    number: '3',
    icon: Settings,
    title: 'Gestionează',
    description: 'Clinica vede fluxurile; pacientul urmărește istoricul și următorii pași.',
  },
];

export function AboutHowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 px-6 bg-[hsl(240,10%,6%)]/40 scroll-mt-24">
      <div className="max-w-[75rem] mx-auto">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-center text-white mb-4">
          Cum funcționează
        </h2>
        <p className="text-[hsl(220,12%,75%)] text-center max-w-2xl mx-auto mb-16">
          Trei pași simpli de la căutare la consultație și management.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ number, icon: Icon, title, description }) => (
            <div
              key={number}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center hover:bg-white/[0.05] hover:border-purple-500/20 transition-all"
            >
              <div className="inline-flex w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 font-bold text-lg items-center justify-center mb-6">
                {number}
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-[hsl(220,12%,80%)] text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
