import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowRight, Facebook, Instagram, Twitter, Youtube, Activity, Shield, Sparkles } from "lucide-react";
import { Brain } from "lucide-react";
import { CounterAnimation } from "../../components/CounterAnimation";

export function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(240,10%,3%)] text-[hsl(220,12%,98%)] relative overflow-x-hidden">
      {/* Animated background gradient orbs */}
      <div 
        className="fixed top-0 right-0 w-[800px] h-[800px] bg-[hsl(217,80%,55%)] rounded-full blur-[120px] opacity-20 pointer-events-none animate-pulse"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      ></div>
      <div 
        className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-[hsl(217,80%,50%)] rounded-full blur-[120px] opacity-20 pointer-events-none animate-pulse"
        style={{
          transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      ></div>

      {/* Floating particles animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[hsl(217,80%,55%)] rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-6 py-20 pt-32">
        <div className="max-w-[75rem] mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-6 animate-fade-in-up">
              <h1 className="text-[clamp(2.65rem,6vw,4rem)] font-bold leading-[1.15] text-[hsl(220,12%,98%)]">
                ZenLink
              </h1>
              <p className="text-[clamp(1rem,2vw,1.125rem)] text-[hsl(220,12%,85%)] leading-relaxed max-w-xl">
                Bucură-te de conexiune perfectă între pacienți și medici cu interfață modernă și tehnologie de vârf. 
                ZenLink aduce în fața ta un sistem complet de gestionare a sănătății, 
                oferind experiențe premium și funcționalități inovatoare.
              </p>
              <div className="pt-4">
                <Button
                  onClick={() => navigate('/doctori')}
                  className="bg-[hsl(217,80%,55%)] hover:bg-[hsl(217,80%,50%)] text-white px-8 py-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center gap-2 group"
                >
                  <span>Explorează Serviciile</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Right Column - Logo/Visual */}
            <div className="relative flex justify-center lg:justify-end items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                {/* Dark circular background with glow */}
                <div className="relative w-[20rem] h-[20rem] lg:w-[24rem] lg:h-[24rem] rounded-full bg-[hsl(240,10%,6%)] shadow-2xl flex items-center justify-center overflow-hidden">
                  {/* Animated gradient ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(217,80%,65%)] via-[hsl(217,80%,55%)] to-[hsl(217,80%,65%)] opacity-30 animate-spin-slow"
                    style={{ 
                      background: 'conic-gradient(from 0deg, hsl(217,80%,65%), hsl(217,80%,55%), hsl(217,80%,65%))',
                    }}
                  ></div>
                  
                  {/* Inner dark circle */}
                  <div className="absolute inset-[2px] rounded-full bg-[hsl(240,10%,6%)] z-10"></div>
                  
                  {/* Logo container with animated glow - circular */}
                  <div className="relative z-20 flex items-center justify-center w-full h-full">
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Try to load logo image - circular container */}
                      <div className="w-[85%] h-[85%] rounded-full overflow-hidden flex items-center justify-center">
                        <img 
                          src="/tooth-logo.png.png" 
                          alt="ZenLink Logo" 
                          className="w-full h-full object-cover animate-float-logo drop-shadow-2xl z-10 relative"
                          style={{ filter: 'drop-shadow(0 0 20px hsl(217,80%,55%))' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {/* Fallback: Animated Tooth/Brain icon with circuit patterns */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="w-32 h-32 lg:w-40 lg:h-40 text-[hsl(217,80%,55%)] animate-float-logo" 
                          style={{ 
                            filter: 'drop-shadow(0 0 20px hsl(217,80%,55%))',
                            strokeWidth: '1.5'
                          }}
                        />
                      </div>
                      
                      {/* Animated circuit-like glow effect - matches tooth description */}
                      <div className="absolute inset-0 opacity-30 pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="hsl(217,80%,65%)" stopOpacity="1" />
                              <stop offset="50%" stopColor="hsl(217,80%,55%)" stopOpacity="0.9" />
                              <stop offset="100%" stopColor="hsl(217,80%,65%)" stopOpacity="1" />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          
                          {/* Circuit nodes - glowing points */}
                          <circle cx="100" cy="50" r="4" fill="hsl(217,80%,65%)" filter="url(#glow)">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="150" cy="100" r="4" fill="hsl(217,80%,65%)" filter="url(#glow)">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
                            <animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="100" cy="150" r="4" fill="hsl(217,80%,65%)" filter="url(#glow)">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" />
                            <animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="50" cy="100" r="4" fill="hsl(217,80%,65%)" filter="url(#glow)">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite" />
                            <animate attributeName="r" values="3;5;3" dur="2.2s" repeatCount="indefinite" />
                          </circle>
                          
                          {/* Circuit lines connecting nodes */}
                          <line x1="100" y1="50" x2="150" y2="100" stroke="url(#glowGradient)" strokeWidth="2" opacity="0.6" />
                          <line x1="150" y1="100" x2="100" y2="150" stroke="url(#glowGradient)" strokeWidth="2" opacity="0.6" />
                          <line x1="100" y1="150" x2="50" y2="100" stroke="url(#glowGradient)" strokeWidth="2" opacity="0.6" />
                          <line x1="50" y1="100" x2="100" y2="50" stroke="url(#glowGradient)" strokeWidth="2" opacity="0.6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Outer glow ring */}
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[hsl(217,80%,65%)] to-[hsl(217,80%,55%)] opacity-20 blur-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Icons - Right Edge */}
        <div className="fixed top-1/2 right-6 lg:right-8 -translate-y-1/2 hidden lg:flex flex-col items-center gap-6 z-10 animate-fade-in-right">
          <div className="w-[1.5px] h-32 bg-[hsl(220,12%,65%)] opacity-50"></div>
          <a href="#" className="text-[hsl(220,12%,98%)] hover:text-[hsl(217,80%,55%)] transition-colors duration-300 hover:scale-125 transform">
            <Facebook className="w-5 h-5" />
          </a>
          <a href="#" className="text-[hsl(220,12%,98%)] hover:text-[hsl(217,80%,55%)] transition-colors duration-300 hover:scale-125 transform">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" className="text-[hsl(220,12%,98%)] hover:text-[hsl(217,80%,55%)] transition-colors duration-300 hover:scale-125 transform">
            <Twitter className="w-5 h-5" />
          </a>
          <a href="#" className="text-[hsl(220,12%,98%)] hover:text-[hsl(217,80%,55%)] transition-colors duration-300 hover:scale-125 transform">
            <Youtube className="w-5 h-5" />
          </a>
          <div className="w-[1.5px] h-32 bg-[hsl(220,12%,65%)] opacity-50"></div>
        </div>
      </section>

      {/* Clinic Slider Band */}
      <section className="relative py-16 overflow-hidden border-y border-white/10 bg-[hsl(240,10%,6%)]/30">
        <div className="relative">
          <div className="flex animate-scroll gap-6">
            {/* First set of clinics */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Mayo Clinic</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Cleveland Clinic</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Johns Hopkins</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Mass General</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">UCSF Health</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Stanford Health</span>
              </div>
            </div>
            {/* Duplicate set for seamless loop */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Mayo Clinic</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Cleveland Clinic</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Johns Hopkins</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Mass General</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">UCSF Health</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-[hsl(220,12%,85%)] whitespace-nowrap">Stanford Health</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1 - Large */}
      <section className="relative py-32 px-6">
        <div className="max-w-[75rem] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(2.65rem,6vw,4rem)] font-bold mb-6 text-[hsl(220,12%,98%)]">
              AI Assistant PRO
            </h2>
            <p className="text-[clamp(1rem,2vw,1.125rem)] text-[hsl(220,12%,85%)]">
              Intelligence that understands healthcare.
            </p>
          </div>
          
          <div className="relative aspect-[16/10] max-w-5xl mx-auto rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[hsl(217,80%,55%)]/20 to-[hsl(217,80%,50%)]/20 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(217,80%,55%)] to-[hsl(217,80%,50%)] mb-6">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <p className="text-[hsl(220,12%,85%)] text-lg">Advanced AI diagnostics and patient insights</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-[hsl(220,12%,65%)] mb-4">From $99/month</p>
            <Button className="bg-[hsl(217,80%,55%)] hover:bg-[hsl(217,80%,50%)] text-white">
              Learn More
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Section 2 - Split */}
      <section className="relative py-32 px-6 bg-[hsl(240,10%,6%)]/50">
        <div className="max-w-[75rem] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-[clamp(2.15rem,5vw,3.15rem)] font-bold mb-6 text-[hsl(220,12%,98%)]">
              Real-time Patient Monitoring
            </h2>
            <p className="text-[clamp(1rem,2vw,1.125rem)] text-[hsl(220,12%,85%)] mb-8">
              Track vitals, analyze trends, and receive instant alerts. 
              All from a single, beautiful interface.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-[hsl(217,80%,55%)]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[hsl(217,80%,55%)]"></div>
                </div>
                Live vital sign tracking
              </li>
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-[hsl(217,80%,55%)]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[hsl(217,80%,55%)]"></div>
                </div>
                Predictive health analytics
              </li>
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-[hsl(217,80%,55%)]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[hsl(217,80%,55%)]"></div>
                </div>
                Automated alert system
              </li>
            </ul>
            <Button className="bg-[hsl(217,80%,55%)] hover:bg-[hsl(217,80%,50%)] text-white">
              Explore Monitoring
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[hsl(217,80%,50%)]/20 to-[hsl(217,80%,55%)]/20 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-32 h-32 text-[hsl(217,80%,55%)]/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3 - Split Reversed */}
      <section className="relative py-32 px-6">
        <div className="max-w-[75rem] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[hsl(217,80%,55%)]/20 to-[hsl(217,80%,50%)]/20 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-32 h-32 text-[hsl(217,80%,50%)]/40" />
            </div>
          </div>
          
          <div className="order-1 md:order-2">
            <h2 className="text-[clamp(2.15rem,5vw,3.15rem)] font-bold mb-6 text-[hsl(220,12%,98%)]">
              Enterprise-Grade Security
            </h2>
            <p className="text-[clamp(1rem,2vw,1.125rem)] text-[hsl(220,12%,85%)] mb-8">
              HIPAA compliant, end-to-end encrypted, and built with 
              privacy at its core. Your patients' data is always protected.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-[hsl(217,80%,50%)]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[hsl(217,80%,50%)]"></div>
                </div>
                256-bit encryption
              </li>
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-[hsl(217,80%,50%)]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[hsl(217,80%,50%)]"></div>
                </div>
                HIPAA & GDPR compliant
              </li>
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-[hsl(217,80%,50%)]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[hsl(217,80%,50%)]"></div>
                </div>
                Regular security audits
              </li>
            </ul>
            <Button className="bg-[hsl(217,80%,55%)] hover:bg-[hsl(217,80%,50%)] text-white">
              Security Details
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-32 px-6 bg-[hsl(240,10%,6%)]/50">
        <div className="max-w-[75rem] mx-auto text-center">
          <h2 className="text-[clamp(2.15rem,5vw,3.15rem)] font-bold mb-16 text-[hsl(220,12%,98%)]">
            Trusted by healthcare leaders worldwide
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <CounterAnimation end={10000} suffix="+" duration={2500} />
              <p className="text-[hsl(220,12%,85%)] text-lg">Active Clinics</p>
            </div>
            <div>
              <CounterAnimation end={2} suffix="M+" decimals={0} duration={2500} />
              <p className="text-[hsl(220,12%,85%)] text-lg">Patients Served</p>
            </div>
            <div>
              <CounterAnimation end={98.5} suffix="%" decimals={1} duration={2500} />
              <p className="text-[hsl(220,12%,85%)] text-lg">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-[75rem] mx-auto text-center">
          <h2 className="text-[clamp(2.15rem,5vw,3.15rem)] font-bold mb-6 text-[hsl(220,12%,98%)]">
            Ready to transform your practice?
          </h2>
          <p className="text-[clamp(1rem,2vw,1.125rem)] text-[hsl(220,12%,85%)] mb-12">
            Join thousands of healthcare providers using ZenLink every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-[hsl(217,80%,55%)] hover:bg-[hsl(217,80%,50%)] text-white text-lg px-8 py-6">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white text-lg px-8 py-6">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-[hsl(240,10%,6%)]/50 px-6 py-12">
        <div className="max-w-[75rem] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="mb-4 text-[hsl(220,12%,98%)]">Product</h4>
              <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[hsl(220,12%,98%)]">Company</h4>
              <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[hsl(220,12%,98%)]">Resources</h4>
              <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">API</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[hsl(220,12%,98%)]">Legal</h4>
              <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">HIPAA</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(217,80%,55%)]"></div>
              <span className="text-[hsl(220,12%,98%)]">ZenLink</span>
            </div>
            <p className="text-[hsl(220,12%,65%)] text-sm">© 2025 ZenLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
