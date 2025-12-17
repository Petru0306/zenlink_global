import { Brain, User, Stethoscope, FileText, Calendar, History, CreditCard, Sparkles, ChevronRight } from 'lucide-react';

interface VisionSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  menuItems?: Array<{ id: string; label: string; icon: any }>;
}

export function VisionSidebar({ isOpen, onClose, activeSection, onSectionChange, menuItems }: VisionSidebarProps) {

  const defaultMenu = [
    { id: 'profile', label: 'Profil Pacient', icon: User },
    { id: 'medical', label: 'Profil Medical', icon: Stethoscope },
    { id: 'files', label: 'Fișiere', icon: FileText },
    { id: 'appointments', label: 'Programări', icon: Calendar },
    { id: 'history', label: 'Istoric', icon: History },
    { id: 'subscription', label: 'Abonament', icon: CreditCard },
    { id: 'ai', label: 'Asistent AI', icon: Sparkles },
  ];

  const items = menuItems ?? defaultMenu;

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
          fixed left-0 top-0 h-dvh w-[280px] z-50
          flex flex-col min-h-0
          bg-[#0B1437]/80 backdrop-blur-2xl
          border-r border-white/[0.05]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-6 lg:p-8 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-white">ZenLink</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 min-h-0 p-3 lg:p-4 overflow-y-auto overflow-x-hidden">
          <div className="w-full min-h-full flex flex-col gap-1">
            {items.map((item) => {
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
                    w-full flex items-center justify-between px-3.5 lg:px-4 py-2 lg:py-2.5 rounded-xl
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[13px] lg:text-sm leading-tight truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

      </aside>
    </>
  );
}

