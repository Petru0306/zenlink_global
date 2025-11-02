import { Button } from "../../components/ui/button";
import { ArrowRight, Brain, Activity, Shield, Sparkles } from "lucide-react";
import { CounterAnimation } from "../../components/CounterAnimation";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Background gradient orbs */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-[#5B8DEF]/20 via-[#5B8DEF]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-[#4169E1]/20 via-[#4169E1]/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-radial from-[#5B8DEF]/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none"></div>


      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-[#5B8DEF]/20 to-[#4169E1]/20 border border-[#5B8DEF]/30">
            <span className="text-sm text-white/90">Introducing ZenLink AI Platform</span>
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Healthcare,
            <br />
            reimagined.
          </h1>
          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto">
            Experience the future of medical care with AI-powered insights, 
            seamless patient management, and intelligent diagnostics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white text-lg px-8 py-6">
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-20">
            <div className="relative aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#5B8DEF]/10 to-[#4169E1]/10 backdrop-blur-sm">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] flex items-center justify-center animate-pulse">
                  <Brain className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Slider Band */}
      <section className="relative py-16 overflow-hidden border-y border-white/10 bg-[#0f0f19]/30">
        <div className="relative">
          <div className="flex animate-scroll gap-6">
            {/* First set of clinics */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Mayo Clinic</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Cleveland Clinic</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Johns Hopkins</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Mass General</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">UCSF Health</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Stanford Health</span>
              </div>
            </div>
            {/* Duplicate set for seamless loop */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Mayo Clinic</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Cleveland Clinic</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Johns Hopkins</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Mass General</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">UCSF Health</span>
              </div>
              <div className="px-12 py-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg text-white/70 whitespace-nowrap">Stanford Health</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1 - Large */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl lg:text-7xl mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              AI Assistant PRO
            </h2>
            <p className="text-xl md:text-2xl text-white/60">
              Intelligence that understands healthcare.
            </p>
          </div>
          
          <div className="relative aspect-[16/10] max-w-5xl mx-auto rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#5B8DEF]/20 to-[#4169E1]/20 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] mb-6">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <p className="text-white/60 text-lg">Advanced AI diagnostics and patient insights</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-white/50 mb-4">From $99/month</p>
            <Button className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white">
              Learn More
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Section 2 - Split */}
      <section className="relative py-32 px-6 bg-[#0f0f19]/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Real-time Patient Monitoring
            </h2>
            <p className="text-lg md:text-xl text-white/60 mb-8">
              Track vitals, analyze trends, and receive instant alerts. 
              All from a single, beautiful interface.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-[#5B8DEF]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#5B8DEF]"></div>
                </div>
                Live vital sign tracking
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-[#5B8DEF]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#5B8DEF]"></div>
                </div>
                Predictive health analytics
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-[#5B8DEF]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#5B8DEF]"></div>
                </div>
                Automated alert system
              </li>
            </ul>
            <Button className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white">
              Explore Monitoring
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#4169E1]/20 to-[#5B8DEF]/20 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-32 h-32 text-[#5B8DEF]/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3 - Split Reversed */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#5B8DEF]/20 to-[#4169E1]/20 backdrop-blur-sm">
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-32 h-32 text-[#4169E1]/40" />
            </div>
          </div>
          
          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl lg:text-6xl mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg md:text-xl text-white/60 mb-8">
              HIPAA compliant, end-to-end encrypted, and built with 
              privacy at its core. Your patients' data is always protected.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-[#4169E1]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#4169E1]"></div>
                </div>
                256-bit encryption
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-[#4169E1]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#4169E1]"></div>
                </div>
                HIPAA & GDPR compliant
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <div className="w-6 h-6 rounded-full bg-[#4169E1]/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#4169E1]"></div>
                </div>
                Regular security audits
              </li>
            </ul>
            <Button className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white">
              Security Details
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-32 px-6 bg-[#0f0f19]/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl mb-16 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Trusted by healthcare leaders worldwide
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <CounterAnimation end={10000} suffix="+" duration={2500} />
              <p className="text-white/60 text-lg">Active Clinics</p>
            </div>
            <div>
              <CounterAnimation end={2} suffix="M+" decimals={0} duration={2500} />
              <p className="text-white/60 text-lg">Patients Served</p>
            </div>
            <div>
              <CounterAnimation end={98.5} suffix="%" decimals={1} duration={2500} />
              <p className="text-white/60 text-lg">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Ready to transform your practice?
          </h2>
          <p className="text-xl md:text-2xl text-white/60 mb-12">
            Join thousands of healthcare providers using ZenLink every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white text-lg px-8 py-6">
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
      <footer className="relative border-t border-white/10 bg-[#0f0f19]/50 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-white">Resources</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#5B8DEF]"></div>
              <span className="text-white">ZenLink</span>
            </div>
            <p className="text-white/40 text-sm">© 2025 ZenLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

