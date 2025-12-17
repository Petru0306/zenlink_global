import { User, Stethoscope, FileText, Clock, Calendar, History, CreditCard, Sparkles, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface VisionSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function VisionSidebar({ isOpen, onClose, activeSection, onSectionChange }: VisionSidebarProps) {

  const menuItems = [
    { id: 'profile', label: 'Profil Pacient', icon: User },
    { id: 'medical', label: 'Profil Medical', icon: Stethoscope },
    { id: 'files', label: 'Fișiere', icon: FileText },
    { id: 'treatments', label: 'Tratamente', icon: Clock },
    { id: 'appointments', label: 'Programări', icon: Calendar },
    { id: 'history', label: 'Istoric', icon: History },
    { id: 'subscription', label: 'Abonament', icon: CreditCard },
    { id: 'ai', label: 'Asistent AI', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-[280px] z-50
          bg-[#0B1437]/80 backdrop-blur-2xl
          border-r border-white/[0.05]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-8 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-[#5B8DEF] to-[#4169E1]" />
            </div>
            <span className="text-white">ZenLink</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  onClose?.();
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-white/40" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Help Section */}
        <div className="absolute bottom-8 left-4 right-4">
          <div className="bg-gradient-to-br from-[#5B8DEF]/10 to-[#4169E1]/10 border border-[#5B8DEF]/20 rounded-xl p-5">
            <div className="w-9 h-9 rounded-lg bg-white/[0.08] flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4 text-white/60" />
            </div>
            <p className="text-white text-sm mb-1">Ai nevoie de ajutor?</p>
            <p className="text-white/40 text-xs mb-4">Consultă documentația</p>
            <button className="w-full bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs py-2.5 rounded-lg transition-all duration-200">
              Documentație
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

