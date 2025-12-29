import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Mail, Lock, Brain, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px]" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border border-purple-400/50 flex items-center justify-center shadow-2xl shadow-purple-500/50">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">ZenLink</span>
        </div>

        <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          <div className="relative z-10">
            <h1 className="text-white text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">Nice to see you!</h1>
            <p className="text-purple-200/70 mb-8 text-lg font-medium">Enter your email and password to sign in</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="text-purple-200/70 text-sm mb-2 block font-medium uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="text-purple-200/70 text-sm mb-2 block font-medium uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="remember" className="text-purple-200/70 text-sm cursor-pointer font-medium">
                  Remember me
                </label>
              </div>

              {/* Sign In Button */}
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white py-6 text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold"
              >
                {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
              </Button>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <p className="text-purple-200/70 font-medium">
                  Don't have an account?{' '}
                  <Link to="/authentication/sign-up" className="text-purple-300 hover:text-purple-200 font-bold transition-colors">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

