import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowRight, User, Calendar, FileText, BookOpen, MessageCircle } from 'lucide-react';

const features = [
  { icon: User, text: 'Găsești medicul potrivit — specializări, locație, recenzii dacă există.' },
  { icon: Calendar, text: 'Programare rapidă — sloturi disponibile și confirmare instantanee.' },
  { icon: FileText, text: 'Istoric și documente — acces la date și fișe (roadmap dacă nu e încă în app).' },
  { icon: BookOpen, text: 'Recomandări și ghidare — educație și pregătire pentru consultație.' },
  { icon: MessageCircle, text: 'Asistent AI pentru întrebări (mock acum; în curând complet).' },
];

export function AboutForPatients() {
  return (
    <section className="relative py-20 px-6 bg-[hsl(240,10%,6%)]/40">
      <div className="max-w-[75rem] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-white mb-4">
              Pentru pacienți
            </h2>
            <p className="text-[hsl(220,12%,85%)] mb-8 leading-relaxed">
              ZenLink te ajută să găsești medicul potrivit, să te programezi rapid și să ai o experiență clară de la primul click până la consultație.
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
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 font-semibold flex items-center gap-2 group">
                Începe ca pacient
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="relative aspect-square max-w-md mx-auto rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/15 to-purple-600/10 flex items-center justify-center">
            <User className="w-32 h-32 text-purple-400/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
