import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Brain, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const onDashboard = location.pathname.startsWith('/dashboard');

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Doctors', path: '/doctori' },
    { name: 'Clinics', path: '/clinici' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0b1437]/80 border-b border-[#2d4a7c]/50">
      <div
        className={`py-4 flex items-center w-full relative ${
          onDashboard ? 'pl-[300px] pr-6' : 'max-w-7xl mx-auto px-6 justify-between'
        }`}
      >
        {/* Logo and Site Name (hidden on dashboard view) */}
        {!onDashboard && (
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">ZenLink</span>
          </Link>
        )}

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors duration-200 ${
                isActive(link.path)
                  ? 'text-white font-semibold'
                  : 'text-[#a3aed0] hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        <div
          className={`flex items-center gap-4 ${
            onDashboard ? 'ml-auto' : ''
          }`}
          style={onDashboard ? { position: 'relative', zIndex: 5 } : {}}
        >
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-[#1a2f5c] border border-[#2d4a7c] hover:border-blue-500 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-[#a3aed0] text-xs">{user?.email}</span>
                </div>
              </button>
              
              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-[#1a2f5c] border-[#2d4a7c] text-[#a3aed0] hover:text-white hover:border-red-500 transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              {/* Login Button */}
              <Link to="/authentication/sign-in">
                <Button 
                  variant="outline" 
                  className="bg-[#1a2f5c] border-[#2d4a7c] text-[#a3aed0] hover:text-white hover:border-blue-500 transition-all hidden sm:flex"
                >
                  Log In
                </Button>
              </Link>
              
              {/* Sign Up Button */}
              <Link to="/authentication/sign-up">
                <Button 
                  className="bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white"
                >
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-[#2d4a7c]/50 bg-[#0b1437]/95">
        <div className="px-6 py-3 flex flex-wrap gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm transition-colors duration-200 ${
                isActive(link.path)
                  ? 'text-white font-semibold'
                  : 'text-[#a3aed0] hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

