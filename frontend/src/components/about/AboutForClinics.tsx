import { Button } from '../ui/button';
import { ArrowRight, Building2, Calendar, Bell, BarChart3, Plug } from 'lucide-react';

const features = [
  { icon: Calendar, text: 'Gestionare programări și fluxuri — o singură interfață pentru toate locațiile.' },
  { icon: Building2, text: 'Profil clinică, medici și servicii — vizibilitate și credibilitate online.' },
  { icon: Bell, text: 'Reducerea no-show — remindere și confirmări automate.' },
  { icon: BarChart3, text: 'Insights și dashboard — capacitate, cerere și tendințe.' },
  { icon: Plug, text: 'Integrare ușoară — arhitectură API-ready (generic dacă nu e implementat).' },
];

export function AboutForClinics() {
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-[75rem] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 md:order-1 relative aspect-square max-w-md mx-auto rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/15 to-purple-600/10 flex items-center justify-center">
            <Building2 className="w-32 h-32 text-purple-400/40" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-white mb-4">
              Pentru clinici
            </h2>
            <p className="text-[hsl(220,12%,85%)] mb-8 leading-relaxed">
              Instrumente pentru a gestiona programările, a reduce no-show-urile și a oferi o experiență profesională pacienților.
            </p>
            <ul className="space-y-4 mb-8">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-[hsl(220,12%,90%)]">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
            <a href="#demo">
              <Button className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 font-semibold flex items-center gap-2 group">
                Programează un demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
