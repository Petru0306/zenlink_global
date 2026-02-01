import { Target, Eye } from 'lucide-react';

export function AboutMission() {
  return (
    <section className="relative py-20 px-6 bg-[hsl(240,10%,6%)]/40">
      <div className="max-w-[75rem] mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 lg:p-10 hover:bg-white/[0.05] transition-colors hover:border-purple-500/20">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Misiunea noastră</h3>
            <p className="text-[hsl(220,12%,85%)] leading-relaxed">
              Să facem îngrijirea dentară mai accesibilă și mai clară, reducând fricțiunea dintre căutare, programare și tratament.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 lg:p-10 hover:bg-white/[0.05] transition-colors hover:border-purple-500/20">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6">
              <Eye className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Viziunea noastră</h3>
            <p className="text-[hsl(220,12%,85%)] leading-relaxed">
              Un ecosistem în care fiecare pacient înțelege mai bine sănătatea orală, iar clinicile lucrează mai eficient, cu date și instrumente inteligente.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
