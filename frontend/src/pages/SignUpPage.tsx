import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, Mail, Lock, Brain, Facebook, Apple, Phone, AlertCircle, Key } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

type UserRole = 'PATIENT' | 'DOCTOR' | 'CLINIC';

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [referralCode, setReferralCode] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSocialSignup = (provider: string) => {
    // Placeholder for social authentication
    alert(`${provider} signup will be implemented soon!`);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the Terms and Conditions');
      return;
    }

    // Validate referral code for DOCTOR and CLINIC roles
    if ((role === 'DOCTOR' || role === 'CLINIC') && !referralCode.trim()) {
      setError('Referral code is required for ' + (role === 'DOCTOR' ? 'Doctor' : 'Clinic') + ' registration');
      return;
    }

    setIsLoading(true);
    setError(''); // Clear any previous errors
    try {
      await signup(firstName, lastName, email, password, phone || undefined, role, referralCode.trim() || undefined);
      // Only navigate if signup was successful (no error thrown)
      console.log('Signup successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Signup error caught in SignUpPage:', err);
      // Show the actual error message from backend
      const errorMessage = err?.message || 'Signup failed. Please try again.';
      console.error('Setting error message:', errorMessage);
      setError(errorMessage);
      // DO NOT navigate on error - stay on signup page to show error
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
            <h1 className="text-white text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">Welcome!</h1>
            <p className="text-purple-200/70 mb-8 text-lg font-medium">Create your account to get started</p>

            {/* Social Buttons */}
            <div className="mb-6">
              <p className="text-white font-bold text-center mb-4">Register with</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => handleSocialSignup('Facebook')}
                  className="w-12 h-12 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300"
                >
                  <Facebook className="w-6 h-6 text-purple-300" />
                </button>
                <button 
                  onClick={() => handleSocialSignup('Apple')}
                  className="w-12 h-12 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300"
                >
                  <Apple className="w-6 h-6 text-purple-300" />
                </button>
                <button 
                  onClick={() => handleSocialSignup('Google')}
                  className="w-12 h-12 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300"
                >
                  <FaGoogle className="w-6 h-6 text-purple-300" />
                </button>
              </div>
            </div>

            <div className="text-center mb-6">
              <span className="text-purple-200/70 font-bold">or</span>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Type Selection */}
              <div>
                <label className="text-purple-200/70 text-sm mb-3 block font-medium uppercase tracking-wide">Account Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('PATIENT');
                      setReferralCode(''); // Clear referral code when switching to patient
                    }}
                    className={`py-3 px-4 rounded-xl border transition-all duration-300 ${
                      role === 'PATIENT'
                        ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 border-purple-500/50 text-white shadow-2xl shadow-purple-500/30'
                        : 'backdrop-blur-xl bg-white/5 border-white/10 text-purple-200/70 hover:border-purple-500/30 hover:bg-purple-500/10'
                    }`}
                  >
                    <div className="font-bold">Patient</div>
                    <div className="text-xs mt-1 opacity-80">Book appointments</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('DOCTOR')}
                    className={`py-3 px-4 rounded-xl border transition-all duration-300 ${
                      role === 'DOCTOR'
                        ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 border-purple-500/50 text-white shadow-2xl shadow-purple-500/30'
                        : 'backdrop-blur-xl bg-white/5 border-white/10 text-purple-200/70 hover:border-purple-500/30 hover:bg-purple-500/10'
                    }`}
                  >
                    <div className="font-bold">Doctor</div>
                    <div className="text-xs mt-1 opacity-80">Manage schedule</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('CLINIC')}
                    className={`py-3 px-4 rounded-xl border transition-all duration-300 ${
                      role === 'CLINIC'
                        ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 border-purple-500/50 text-white shadow-2xl shadow-purple-500/30'
                        : 'backdrop-blur-xl bg-white/5 border-white/10 text-purple-200/70 hover:border-purple-500/30 hover:bg-purple-500/10'
                    }`}
                  >
                    <div className="font-bold">Clinic</div>
                    <div className="text-xs mt-1 opacity-80">Register clinic</div>
                  </button>
                </div>
              </div>

              {/* Referral Code Field - Only for DOCTOR and CLINIC */}
              {(role === 'DOCTOR' || role === 'CLINIC') && (
                <div>
                  <label className="text-purple-200/70 text-sm mb-2 block font-medium uppercase tracking-wide">
                    Referral Code <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder={`Enter referral code for ${role === 'DOCTOR' ? 'Doctor' : 'Clinic'} registration...`}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                      required
                    />
                  </div>
                  <p className="text-purple-200/50 text-xs mt-2 font-medium">
                    Contact us to receive your referral code
                  </p>
                </div>
              )}

              {/* First Name Field */}
              <div>
                <label className="text-purple-200/70 text-sm mb-2 block font-medium uppercase tracking-wide">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              {/* Last Name Field */}
              <div>
                <label className="text-purple-200/70 text-sm mb-2 block font-medium uppercase tracking-wide">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Your last name..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

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

              {/* Phone Field */}
              <div>
                <label className="text-purple-200/70 text-sm mb-2 block font-medium uppercase tracking-wide">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
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

              {/* Confirm Password Field */}
              <div>
                <label className="text-purple-200/70 text-sm mb-2 block font-medium uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-purple-500"
                  required
                />
                <label htmlFor="terms" className="text-purple-200/70 text-sm cursor-pointer font-medium">
                  I agree to the Terms and Conditions
                </label>
              </div>

              {/* Sign Up Button */}
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white py-6 text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold"
              >
                {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
              </Button>

              {/* Sign In Link */}
              <div className="text-center mt-6">
                <p className="text-purple-200/70 font-medium">
                  Already have an account?{' '}
                  <Link to="/authentication/sign-in" className="text-purple-300 hover:text-purple-200 font-bold transition-colors">
                    Sign in
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

