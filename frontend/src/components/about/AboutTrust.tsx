import { Lock, Shield, MessageSquare } from 'lucide-react';

const items = [
  {
    icon: Lock,
    title: 'Confidențialitate by design',
    description: 'Datele pacienților și ale clinicilor sunt tratate cu maximă atenție; designul sistemului pune confidențialitatea pe primul loc.',
  },
  {
    icon: Shield,
    title: 'Control acces și stocare sigură',
    description: 'Acces controlat și stocare securizată, în concordanță cu practicile recomandate pentru date medicale.',
  },
  {
    icon: MessageSquare,
    title: 'Comunicare transparentă',
    description: 'Informații clare despre cum folosim datele și cum poți gestiona preferințele tale.',
  },
];

export function AboutTrust() {
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-[75rem] mx-auto">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-center text-white mb-4">
          Încredere și securitate
        </h2>
        <p className="text-[hsl(220,12%,75%)] text-center max-w-2xl mx-auto mb-12">
          Principii clare pentru date și comunicare.
        </p>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 hover:bg-white/[0.05] hover:border-purple-500/20 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
                <Icon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
              <p className="text-[hsl(220,12%,80%)] text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-[hsl(220,12%,65%)] text-sm max-w-2xl mx-auto">
          ZenLink nu înlocuiește sfatul medical; pentru diagnostic consultați medicul.
        </p>
      </div>
    </section>
  );
}
