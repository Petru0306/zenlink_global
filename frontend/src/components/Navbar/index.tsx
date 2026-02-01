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
    { name: 'AI', path: '/ai' },
    { name: 'About', path: '/about' },
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
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10 shadow-2xl">
      <div
        className={`py-4 flex items-center w-full gap-4 ${
          onDashboard ? 'pl-[300px] pr-6' : 'max-w-7xl mx-auto px-6'
        }`}
      >
        {/* Logo and Site Name (hidden on dashboard view) */}
        {!onDashboard && (
          <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 via-purple-600/30 to-purple-700/30 border-2 border-purple-400/50 flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-all duration-300">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">ZenLink</span>
          </Link>
        )}

        {/* Navigation Links - centered in remaining space, no overlap */}
        <div className="hidden md:flex flex-1 items-center justify-center min-w-0">
          <div className="flex items-center gap-2 backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium whitespace-nowrap ${
                  isActive(link.path)
                    ? 'text-white bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 shadow-lg shadow-purple-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Auth Section */}
        <div className={`flex items-center gap-4 shrink-0 ${onDashboard ? 'ml-auto' : ''}`}>
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-105 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-5 h-5 text-purple-200" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-purple-200/70 text-xs">{user?.email}</span>
                </div>
              </button>
              
              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="backdrop-blur-xl bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-300 hover:scale-105"
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
                  className="backdrop-blur-xl bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 hover:scale-105 hidden sm:flex"
                >
                  Log In
                </Button>
              </Link>
              
              {/* Sign Up Button */}
              <Link to="/authentication/sign-up">
                <Button 
                  className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                >
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/10 backdrop-blur-xl bg-black/40">
        <div className="px-6 py-4 flex flex-wrap gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 font-medium ${
                isActive(link.path)
                  ? 'text-white bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
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

