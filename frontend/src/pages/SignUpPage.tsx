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
    <div className="min-h-screen bg-[#0b1437] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-semibold text-white">ZenLink</span>
        </div>

        <Card className="p-8 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl shadow-2xl">
          <h1 className="text-white text-3xl font-semibold mb-2">Welcome!</h1>
          <p className="text-[#a3aed0] mb-8">Create your account to get started</p>

          {/* Social Buttons */}
          <div className="mb-6">
            <p className="text-white font-semibold text-center mb-4">Register with</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => handleSocialSignup('Facebook')}
                className="w-12 h-12 rounded-xl bg-[#0f1f3d] border border-[#2d4a7c] flex items-center justify-center hover:border-blue-500 transition-all"
              >
                <Facebook className="w-6 h-6 text-blue-400" />
              </button>
              <button 
                onClick={() => handleSocialSignup('Apple')}
                className="w-12 h-12 rounded-xl bg-[#0f1f3d] border border-[#2d4a7c] flex items-center justify-center hover:border-blue-500 transition-all"
              >
                <Apple className="w-6 h-6 text-blue-400" />
              </button>
              <button 
                onClick={() => handleSocialSignup('Google')}
                className="w-12 h-12 rounded-xl bg-[#0f1f3d] border border-[#2d4a7c] flex items-center justify-center hover:border-blue-500 transition-all"
              >
                <FaGoogle className="w-6 h-6 text-blue-400" />
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <span className="text-[#a3aed0] font-semibold">or</span>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selection */}
            <div>
              <label className="text-[#a3aed0] text-sm mb-3 block">Account Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole('PATIENT');
                    setReferralCode(''); // Clear referral code when switching to patient
                  }}
                  className={`py-3 px-4 rounded-xl border transition-all ${
                    role === 'PATIENT'
                      ? 'bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] border-blue-500 text-white'
                      : 'bg-[#0f1f3d] border-[#2d4a7c] text-[#a3aed0] hover:border-blue-500'
                  }`}
                >
                  <div className="font-semibold">Patient</div>
                  <div className="text-xs mt-1 opacity-80">Book appointments</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('DOCTOR')}
                  className={`py-3 px-4 rounded-xl border transition-all ${
                    role === 'DOCTOR'
                      ? 'bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] border-blue-500 text-white'
                      : 'bg-[#0f1f3d] border-[#2d4a7c] text-[#a3aed0] hover:border-blue-500'
                  }`}
                >
                  <div className="font-semibold">Doctor</div>
                  <div className="text-xs mt-1 opacity-80">Manage schedule</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('CLINIC')}
                  className={`py-3 px-4 rounded-xl border transition-all ${
                    role === 'CLINIC'
                      ? 'bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] border-blue-500 text-white'
                      : 'bg-[#0f1f3d] border-[#2d4a7c] text-[#a3aed0] hover:border-blue-500'
                  }`}
                >
                  <div className="font-semibold">Clinic</div>
                  <div className="text-xs mt-1 opacity-80">Register clinic</div>
                </button>
              </div>
            </div>

            {/* Referral Code Field - Only for DOCTOR and CLINIC */}
            {(role === 'DOCTOR' || role === 'CLINIC') && (
              <div>
                <label className="text-[#a3aed0] text-sm mb-2 block">
                  Referral Code <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a3aed0]" />
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder={`Enter referral code for ${role === 'DOCTOR' ? 'Doctor' : 'Clinic'} registration...`}
                    className="w-full bg-[#0f1f3d] border border-[#2d4a7c] rounded-xl px-12 py-3 text-white placeholder-[#a3aed0] focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <p className="text-[#a3aed0] text-xs mt-2 opacity-70">
                  Contact us to receive your referral code
                </p>
              </div>
            )}

            {/* First Name Field */}
            <div>
              <label className="text-[#a3aed0] text-sm mb-2 block">First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a3aed0]" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name..."
                  className="w-full bg-[#0f1f3d] border border-[#2d4a7c] rounded-xl px-12 py-3 text-white placeholder-[#a3aed0] focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Last Name Field */}
            <div>
              <label className="text-[#a3aed0] text-sm mb-2 block">Last Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a3aed0]" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name..."
                  className="w-full bg-[#0f1f3d] border border-[#2d4a7c] rounded-xl px-12 py-3 text-white placeholder-[#a3aed0] focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="text-[#a3aed0] text-sm mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a3aed0]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email..."
                  className="w-full bg-[#0f1f3d] border border-[#2d4a7c] rounded-xl px-12 py-3 text-white placeholder-[#a3aed0] focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="text-[#a3aed0] text-sm mb-2 block">Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a3aed0]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number..."
                  className="w-full bg-[#0f1f3d] border border-[#2d4a7c] rounded-xl px-12 py-3 text-white placeholder-[#a3aed0] focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[#a3aed0] text-sm mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a3aed0]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password..."
                  className="w-full bg-[#0f1f3d] border border-[#2d4a7c] rounded-xl px-12 py-3 text-white placeholder-[#a3aed0] focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="text-[#a3aed0] text-sm mb-2 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a3aed0]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password..."
                  className="w-full bg-[#0f1f3d] border border-[#2d4a7c] rounded-xl px-12 py-3 text-white placeholder-[#a3aed0] focus:outline-none focus:border-blue-500 transition-all"
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
                className="w-4 h-4 rounded border-[#2d4a7c] bg-[#0f1f3d] text-blue-500 focus:ring-blue-500"
                required
              />
              <label htmlFor="terms" className="text-[#a3aed0] text-sm cursor-pointer">
                I agree to the Terms and Conditions
              </label>
            </div>

            {/* Sign Up Button */}
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
            </Button>

            {/* Sign In Link */}
            <div className="text-center mt-6">
              <p className="text-[#a3aed0]">
                Already have an account?{' '}
                <Link to="/authentication/sign-in" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

