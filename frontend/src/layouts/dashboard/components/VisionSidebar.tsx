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
          backdrop-blur-xl bg-black/40 border-r border-white/10
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-6 lg:p-8 border-b border-white/10 shrink-0 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 via-purple-600/30 to-purple-700/30 border-2 border-purple-400/50 flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-all duration-300">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">ZenLink</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 min-h-0 p-3 lg:p-4 overflow-y-auto overflow-x-hidden">
          <div className="w-full min-h-full flex flex-col gap-2">
            {items.map((item, index) => {
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
                    relative group w-full flex items-center justify-between px-4 py-3 rounded-2xl
                    transition-all duration-300
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/20 scale-105'
                        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-purple-500/20'
                    }
                  `}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Active glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  )}
                  
                  <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/30 border border-purple-400/50 shadow-lg shadow-purple-500/30' 
                        : 'bg-white/5 border border-white/10 group-hover:border-purple-500/30 group-hover:bg-purple-500/10'
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-purple-200' : 'text-white/60 group-hover:text-purple-200'}`} />
                    </div>
                    <span className="text-sm font-medium leading-tight truncate">{item.label}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-5 h-5 text-purple-200 shrink-0 relative z-10" />
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

