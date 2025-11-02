import { Bell, Search, User, LayoutDashboard, Users, Bot, FileText, Settings, Stethoscope } from 'lucide-react';
import { Input } from './ui/input';

interface TopBarProps {
  currentPage?: string;
}

export default function TopBar({ currentPage = 'doctors' }: TopBarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white"></div>
            </div>
            <div>
              <span className="text-xl text-white font-semibold">ZenLink</span>
              <p className="text-xs text-slate-400">Medical Platform</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 flex items-center justify-center">
            <ul className="flex items-center gap-1 bg-slate-800/50 rounded-full p-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Search */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10 bg-slate-800 border-slate-700 rounded-full w-48 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-slate-800 rounded-full transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <button className="flex items-center gap-2 hover:bg-slate-800 rounded-full py-2 px-3 transition-colors">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-sm text-white">Dr. Smith</p>
                <p className="text-xs text-slate-400">Admin</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
