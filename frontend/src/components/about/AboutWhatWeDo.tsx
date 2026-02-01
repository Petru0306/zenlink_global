import { Calendar, Search, LayoutDashboard, Sparkles } from 'lucide-react';

const items = [
  {
    icon: Calendar,
    title: 'Programări & management',
    description: 'Rezervări, remindere și confirmări pentru pacienți și clinici.',
  },
  {
    icon: Search,
    title: 'Descoperire medici / clinici',
    description: 'Profiluri, servicii și informații pentru alegerea potrivită.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard & fluxuri',
    description: 'Operațiuni clinică: programări, capacitate, rapoarte.',
  },
  {
    icon: Sparkles,
    title: 'Asistent AI',
    description: 'Modul pregătit pentru întrebări și ghidare (în curând).',
    badge: 'În curând',
  },
];

export function AboutWhatWeDo() {
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-[75rem] mx-auto">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-center text-white mb-4">
          Ce oferim
        </h2>
        <p className="text-[hsl(220,12%,75%)] text-center max-w-2xl mx-auto mb-12">
          Capabilități de bază pentru pacienți și clinici.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(({ icon: Icon, title, description, badge }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] hover:border-purple-500/20 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-purple-400" />
                </div>
                {badge && (
                  <span className="text-xs font-medium text-purple-300 bg-purple-500/15 px-2 py-1 rounded-lg">
                    {badge}
                  </span>
                )}
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
