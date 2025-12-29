import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ArrowRight, Facebook, Instagram, Twitter, Youtube, Activity, Shield, Sparkles } from "lucide-react";
import { Brain } from "lucide-react";
import { CounterAnimation } from "../../components/CounterAnimation";

export function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const orbTopRightRef = useRef(null);
  const orbBottomLeftRef = useRef(null);
  const particlesFarRef = useRef(null);
  const particlesMidRef = useRef(null);
  const particlesNearRef = useRef(null);
  const mouseTargetRef = useRef({ x: 0, y: 0 }); // normalized [-1..1]
  const mouseCurrentRef = useRef({ x: 0, y: 0 }); // smoothed [-1..1]
  const rafIdRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const particles = useMemo(() => {
    const count = 40;
    const pickDepth = () => {
      // Weighted: far 45%, mid 35%, near 20%
      const r = Math.random();
      if (r < 0.45) return 0;
      if (r < 0.8) return 1;
      return 2;
    };
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 20,
      depth: pickDepth(), // 0=far, 1=mid, 2=near
      twinkleDelay: Math.random() * 6,
      twinkleDuration: 3.5 + Math.random() * 4.5,
    }));
  }, []);

  const particlesByDepth = useMemo(() => {
    const far = [];
    const mid = [];
    const near = [];
    for (const p of particles) {
      if (p.depth === 0) far.push(p);
      else if (p.depth === 1) mid.push(p);
      else near.push(p);
    }
    return { far, mid, near };
  }, [particles]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;

    const onChange = () => setReducedMotion(Boolean(media.matches));
    onChange();

    // Safari < 14 uses addListener/removeListener
    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);

    return () => {
      if (media.removeEventListener) media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const lerp = (a, b, t) => a + (b - a) * t;

    const updateFromClientXY = (clientX, clientY) => {
      const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
      const rect = heroRef.current?.getBoundingClientRect?.();

      // Use hero section bounds so the parallax feels intentional and less twitchy.
      // When the pointer is outside the hero area, ease back to neutral.
      if (!rect) {
        const nx = (clientX / window.innerWidth - 0.5) * 2; // -1..1
        const ny = (clientY / window.innerHeight - 0.5) * 2; // -1..1
        mouseTargetRef.current = { x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) };
        return;
      }

      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (!inside) {
        mouseTargetRef.current = { x: 0, y: 0 };
        return;
      }

      const nx = ((clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((clientY - rect.top) / rect.height - 0.5) * 2;
      mouseTargetRef.current = { x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) };
    };
    const handlePointerMove = (e) => updateFromClientXY(e.clientX, e.clientY);
    const handleMouseMove = (e) => updateFromClientXY(e.clientX, e.clientY);

    const runningRef = { current: true };

    const animate = (now) => {
      if (!runningRef.current) return;
      const t = now; // ms

      // Smooth mouse movement so it feels calm/premium, not twitchy.
      const current = mouseCurrentRef.current;
      const target = mouseTargetRef.current;
      const next = {
        x: lerp(current.x, target.x, 0.085),
        y: lerp(current.y, target.y, 0.085),
      };
      mouseCurrentRef.current = next;

      // Ambient drift (subtle, always-on)
      const ambient1 = {
        x: Math.sin(t * 0.00008) * 18 + Math.cos(t * 0.00006) * 10,
        y: Math.cos(t * 0.00007) * 14 + Math.sin(t * 0.00005) * 9,
      };
      const ambient2 = {
        x: Math.cos(t * 0.000075) * 14 + Math.sin(t * 0.00005) * 8,
        y: Math.sin(t * 0.000065) * 12 + Math.cos(t * 0.000045) * 7,
      };

      // Mouse parallax overlay (subtle/premium, but clearly perceptible)
      const mouse1 = { x: next.x * 42, y: next.y * 42 };
      const mouse2 = { x: next.x * -30, y: next.y * -30 };

      const orb1 = orbTopRightRef.current;
      if (orb1) {
        orb1.style.transform = `translate3d(${ambient1.x + mouse1.x}px, ${ambient1.y + mouse1.y}px, 0)`;
      }

      const orb2 = orbBottomLeftRef.current;
      if (orb2) {
        orb2.style.transform = `translate3d(${ambient2.x + mouse2.x}px, ${ambient2.y + mouse2.y}px, 0)`;
      }

      // Starfield / particles parallax (Depth field: far/mid/near)
      const farEl = particlesFarRef.current;
      const midEl = particlesMidRef.current;
      const nearEl = particlesNearRef.current;
      if (farEl) {
        const ax = Math.sin(t * 0.000035) * 10 + Math.cos(t * 0.00002) * 6;
        const ay = Math.cos(t * 0.00003) * 7 + Math.sin(t * 0.000018) * 5;
        const mx = next.x * 10;
        const my = next.y * 10;
        farEl.style.transform = `translate3d(${ax + mx}px, ${ay + my}px, 0)`;
      }
      if (midEl) {
        const ax = Math.cos(t * 0.00003) * 14 + Math.sin(t * 0.000022) * 8;
        const ay = Math.sin(t * 0.000028) * 10 + Math.cos(t * 0.000019) * 6;
        const mx = next.x * 16;
        const my = next.y * 16;
        midEl.style.transform = `translate3d(${ax + mx}px, ${ay + my}px, 0)`;
      }
      if (nearEl) {
        const ax = Math.sin(t * 0.000028) * 18 + Math.cos(t * 0.00002) * 10;
        const ay = Math.cos(t * 0.000026) * 12 + Math.sin(t * 0.000017) * 8;
        const mx = next.x * 22;
        const my = next.y * 22;
        nearEl.style.transform = `translate3d(${ax + mx}px, ${ay + my}px, 0)`;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    // Some environments don’t reliably bubble pointer events to window; document capture is the most robust.
    document.addEventListener("pointermove", handlePointerMove, { passive: true, capture: true });
    document.addEventListener("mousemove", handleMouseMove, { passive: true, capture: true });

    const onVisibilityChange = () => {
      const isHidden = document.visibilityState === "hidden";
      runningRef.current = !isHidden;
      if (isHidden) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      } else if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove, { capture: true });
      document.removeEventListener("mousemove", handleMouseMove, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [reducedMotion]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[hsl(220,12%,98%)] relative overflow-x-hidden">
      {/* Animated background gradient orbs */}
      <div
        ref={orbTopRightRef}
        className="fixed -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px] pointer-events-none"
        style={{ willChange: "transform" }}
      ></div>
      <div
        ref={orbBottomLeftRef}
        className="fixed -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px] pointer-events-none"
        style={{ willChange: "transform" }}
      ></div>
      <div className="fixed top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px] pointer-events-none"></div>

      {/* Floating particles animation */}
      <>
        {/* Far layer */}
        <div
          ref={particlesFarRef}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {particlesByDepth.far.map((p) => (
            <div
              key={p.id}
              className={`absolute ${reducedMotion ? "" : "animate-float-soft"}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${16 + p.duration * 0.9}s`,
              }}
            >
              <div
                className={`${reducedMotion ? "" : "animate-twinkle"}`}
                style={{
                  width: "2px",
                  height: "2px",
                  borderRadius: "9999px",
                  backgroundColor: "rgb(168, 85, 247)",
                  boxShadow: "0 0 6px rgba(168, 85, 247, 0.35)",
                  "--twinkle-min": 0.22,
                  "--twinkle-max": 0.6,
                  animationDelay: `${p.twinkleDelay}s`,
                  animationDuration: `${p.twinkleDuration + 1.5}s`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Mid layer */}
        <div
          ref={particlesMidRef}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {particlesByDepth.mid.map((p) => (
            <div
              key={p.id}
              className={`absolute ${reducedMotion ? "" : "animate-float-soft"}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${14 + p.duration * 0.75}s`,
              }}
            >
              <div
                className={`${reducedMotion ? "" : "animate-twinkle"}`}
                style={{
                  width: "2.5px",
                  height: "2.5px",
                  borderRadius: "9999px",
                  backgroundColor: "rgb(168, 85, 247)",
                  boxShadow: "0 0 8px rgba(168, 85, 247, 0.4)",
                  "--twinkle-min": 0.28,
                  "--twinkle-max": 0.78,
                  animationDelay: `${p.twinkleDelay}s`,
                  animationDuration: `${p.twinkleDuration}s`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Near layer */}
        <div
          ref={particlesNearRef}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {particlesByDepth.near.map((p) => (
            <div
              key={p.id}
              className={`absolute ${reducedMotion ? "" : "animate-float-soft"}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${12 + p.duration * 0.6}s`,
              }}
            >
              <div
                className={`${reducedMotion ? "" : "animate-twinkle"}`}
                style={{
                  width: "3px",
                  height: "3px",
                  borderRadius: "9999px",
                  backgroundColor: "rgb(168, 85, 247)",
                  boxShadow: "0 0 10px rgba(168, 85, 247, 0.5)",
                  "--twinkle-min": 0.35,
                  "--twinkle-max": 0.95,
                  animationDelay: `${p.twinkleDelay}s`,
                  animationDuration: `${Math.max(2.8, p.twinkleDuration - 0.8)}s`,
                }}
              />
            </div>
          ))}
        </div>
      </>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center px-6 py-20 pt-32">
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
                  className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white px-8 py-4 rounded-full shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2 group font-semibold"
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
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 opacity-30 animate-spin-slow"
                    style={{ 
                      background: 'conic-gradient(from 0deg, rgb(192, 132, 252), rgb(168, 85, 247), rgb(192, 132, 252))',
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
                          style={{ filter: 'drop-shadow(0 0 20px rgb(168, 85, 247))' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {/* Fallback: Animated Tooth/Brain icon with circuit patterns */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Brain className="w-32 h-32 lg:w-40 lg:h-40 text-purple-400 animate-float-logo" 
                          style={{ 
                            filter: 'drop-shadow(0 0 20px rgb(168, 85, 247))',
                            strokeWidth: '1.5'
                          }}
                        />
                      </div>
                      
                      {/* Animated circuit-like glow effect - matches tooth description */}
                      <div className="absolute inset-0 opacity-30 pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="rgb(192, 132, 252)" stopOpacity="1" />
                              <stop offset="50%" stopColor="rgb(168, 85, 247)" stopOpacity="0.9" />
                              <stop offset="100%" stopColor="rgb(192, 132, 252)" stopOpacity="1" />
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
                          <circle cx="100" cy="50" r="4" fill="rgb(192, 132, 252)" filter="url(#glow)">
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
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 opacity-20 blur-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Icons - Right Edge */}
        <div className="fixed top-1/2 right-6 lg:right-8 -translate-y-1/2 hidden lg:flex flex-col items-center gap-6 z-10 animate-fade-in-right">
          <div className="w-[1.5px] h-32 bg-[hsl(220,12%,65%)] opacity-50"></div>
          <a href="#" className="text-[hsl(220,12%,98%)] hover:text-purple-400 transition-colors duration-300 hover:scale-125 transform">
            <Facebook className="w-5 h-5" />
          </a>
          <a href="#" className="text-[hsl(220,12%,98%)] hover:text-purple-400 transition-colors duration-300 hover:scale-125 transform">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" className="text-[hsl(220,12%,98%)] hover:text-purple-400 transition-colors duration-300 hover:scale-125 transform">
            <Twitter className="w-5 h-5" />
          </a>
          <a href="#" className="text-[hsl(220,12%,98%)] hover:text-purple-400 transition-colors duration-300 hover:scale-125 transform">
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
          
          <div className="relative aspect-[16/10] max-w-5xl mx-auto rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm shadow-2xl shadow-purple-500/20">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 mb-6 shadow-2xl shadow-purple-500/50">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <p className="text-[hsl(220,12%,85%)] text-lg">Advanced AI diagnostics and patient insights</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-[hsl(220,12%,65%)] mb-4">From $99/month</p>
            <Button className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 font-semibold">
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
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                </div>
                Live vital sign tracking
              </li>
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                </div>
                Predictive health analytics
              </li>
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                </div>
                Automated alert system
              </li>
            </ul>
            <Button className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 font-semibold">
              Explore Monitoring
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm shadow-2xl shadow-purple-500/20">
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-32 h-32 text-purple-400/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3 - Split Reversed */}
      <section className="relative py-32 px-6">
        <div className="max-w-[75rem] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm shadow-2xl shadow-purple-500/20">
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-32 h-32 text-purple-400/40" />
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
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                </div>
                256-bit encryption
              </li>
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                </div>
                HIPAA & GDPR compliant
              </li>
              <li className="flex items-center gap-3 text-[hsl(220,12%,90%)]">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                </div>
                Regular security audits
              </li>
            </ul>
            <Button className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 font-semibold">
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
            <Button size="lg" className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white text-lg px-8 py-6 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 font-bold">
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
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span className="text-[hsl(220,12%,98%)]">ZenLink</span>
            </div>
            <p className="text-[hsl(220,12%,65%)] text-sm">© 2025 ZenLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
