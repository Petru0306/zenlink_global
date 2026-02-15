import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Brain, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const onDashboard = location.pathname.startsWith('/dashboard');
  const onConsultation = location.pathname.startsWith('/consult');
  const [isScrolled, setIsScrolled] = useState(false);
  const navbarRef = useRef<HTMLElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    // Measure navbar height
    if (navbarRef.current) {
      setNavbarHeight(navbarRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Transition when scrolled past the navbar height
      setIsScrolled(window.scrollY > navbarHeight);
    };

    window.addEventListener('scroll', handleScroll);
    // Also check on resize in case navbar height changes
    window.addEventListener('resize', () => {
      if (navbarRef.current) {
        setNavbarHeight(navbarRef.current.offsetHeight);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', () => {
        if (navbarRef.current) {
          setNavbarHeight(navbarRef.current.offsetHeight);
        }
      });
    };
  }, [navbarHeight]);

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
    <>
      {/* Full Navbar - Slides out when scrolled */}
      <nav
        ref={navbarRef}
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out ${isScrolled ? '-translate-y-full' : 'translate-y-0'
          } backdrop-blur-xl bg-black/40 border-b border-white/10 shadow-2xl`}
      >
        <div
          className={`py-4 flex items-center w-full gap-4 ${onDashboard ? 'pl-[300px] pr-6' : 'max-w-7xl mx-auto px-6'
            }`}
        >
          {/* Logo */}
          {!onDashboard && (
            <Link
              to="/"
              className="flex items-center gap-3 hover:scale-105 transition-all duration-300 group shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 via-purple-600/30 to-purple-700/30 border-2 border-purple-400/50 flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-all duration-300">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                ZenLink
              </span>
            </Link>
          )}

          {/* Navigation Links */}
          <div className="hidden md:flex flex-1 items-center justify-center min-w-0">
            <div className="flex items-center gap-2 backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium whitespace-nowrap ${isActive(link.path)
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
                <button
                  onClick={() => navigate('/dashboard')}
                  className="hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 hover:scale-105 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                    <User className="w-5 h-5 text-purple-200" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white text-sm font-semibold">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-purple-200/70 text-xs">{user?.email}</span>
                  </div>
                </button>
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
                <Link to="/auth" state={{ isSignUp: false }}>
                  <Button
                    variant="outline"
                    className="backdrop-blur-xl bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300 hover:scale-105 hidden sm:flex"
                  >
                    Log In
                  </Button>
                </Link>
                <Link to="/auth" state={{ isSignUp: true }}>
                  <Button className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Sticky Pill Navbar - Slides in when scrolled */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isScrolled && !onConsultation
          ? 'translate-y-0 opacity-100'
          : '-translate-y-[200%] opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex items-center gap-2 p-2 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl shadow-purple-500/10">
          {/* Logo Icon Only */}
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center hover:scale-110 transition-transform duration-300"
          >
            <Brain className="w-5 h-5 text-white" />
          </Link>

          {/* Separator */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Nav Links (Compact) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive(link.path)
                  ? 'text-white bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button (if needed, but usually we fallback to bottom nav or sidebar on mobile) */}
          {/* For now, keeping pill desktop-focused roughly, but ensuring it's functional */}

          {/* Separator */}
          <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />

          {/* CTA Button */}
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/5"
            >
              Dashboard
            </button>
          ) : (
            <Link to="/auth" state={{ isSignUp: true }}>
              <Button size="sm" className="rounded-full bg-purple-600 hover:bg-purple-500 text-white px-6">
                Sign Up
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation - Sidebar/Drawer style (unchanged logic) */}
      <div
        className={`md:hidden fixed inset-x-0 top-[73px] transition-all duration-300 z-40 ${isScrolled || onConsultation
          ? 'opacity-0 pointer-events-none -translate-y-4'
          : 'opacity-100 translate-y-0'
          }`}
      >
        <div className="mx-4 p-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex flex-wrap gap-2 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 font-medium flex-1 text-center ${isActive(link.path)
                  ? 'text-white bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

