import { Search, Bell, User, Menu } from 'lucide-react';

interface VisionTopBarProps {
  onMenuClick: () => void;
}

export function VisionTopBar({ onMenuClick }: VisionTopBarProps) {
  return (
    <header className="h-20 border-b border-white/[0.05] bg-[#0B1437]/50 backdrop-blur-2xl">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden text-white/40 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-white/30">Dashboard</span>
            <span className="text-white/20">/</span>
            <span className="text-white/80">Profil Pacient</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-2.5 min-w-[280px]">
            <Search className="w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Caută..."
              className="bg-transparent border-none outline-none text-white text-sm placeholder:text-white/30 flex-1"
            />
          </div>

          {/* Bell Icon */}
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all">
            <Bell className="w-4 h-4 text-white/40" />
          </button>

          {/* User Profile */}
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all">
            <User className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>
    </header>
  );
}

