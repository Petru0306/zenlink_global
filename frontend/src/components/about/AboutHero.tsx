import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function AboutHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center px-6 py-20 pt-28 overflow-hidden">
      {/* Background orbs - same motif as Home */}
      <div className="fixed -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/25 via-purple-600/15 to-transparent blur-[80px] pointer-events-none" />
      <div className="fixed -bottom-[10%] -left-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-400/20 via-purple-500/10 to-transparent blur-[70px] pointer-events-none" />

      <div className="max-w-[75rem] mx-auto w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: headline + subheadline + CTAs */}
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.15] text-[hsl(220,12%,98%)]">
              ZenLink conectează pacienții și clinicile printr-o experiență modernă, sigură și rapidă.
            </h1>
            <p className="text-[clamp(1rem,2vw,1.125rem)] text-[hsl(220,12%,85%)] leading-relaxed max-w-xl">
              Platformă pentru programări, profiluri și experiență pacient — de la căutare la consultație.
              Clinicile gestionează fluxuri și capacitate eficient, iar arhitectura este pregătită pentru AI și integrare.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/about#demo">
                <Button className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white px-8 py-4 rounded-full shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2 group font-semibold">
                  Programează un demo
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  className="border-white/20 hover:bg-white/10 text-white px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 font-semibold"
                >
                  Vezi cum funcționează
                </Button>
              </a>
            </div>
            <p className="text-[hsl(220,12%,65%)] text-sm pt-2">
              Securitate, confidențialitate, fluxuri medicale moderne.
            </p>
          </div>

          {/* Right: visual motif */}
          <div className="relative flex justify-center lg:justify-end items-center animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="relative w-[18rem] h-[18rem] lg:w-[22rem] lg:h-[22rem] rounded-3xl bg-[hsl(240,10%,6%)] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-transparent" />
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.15)_0%,transparent_70%)]" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <span className="text-[hsl(220,12%,70%)] text-sm font-medium">Platformă conectată</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
