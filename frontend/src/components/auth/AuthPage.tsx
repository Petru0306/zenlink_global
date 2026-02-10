import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, Loader2, CheckCircle, Phone, Stethoscope, Building2, Heart } from 'lucide-react';
import { useAuth, type UserRole } from '../../context/AuthContext';
import zenlinkLogo from '../../images/zenlink-logo.png';

export default function AuthPage() {
  // Animation state
  const [isSignUp, setIsSignUp] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  // Sign Up form state
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [accountType, setAccountType] = useState<UserRole>('PATIENT');
  const [referralCode, setReferralCode] = useState('');

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Common state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { login, signup, refreshPsychProfile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Clear messages when switching modes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [isSignUp]);

  // Reset account type when switching to sign up
  useEffect(() => {
    if (isSignUp) {
      setAccountType('PATIENT');
      setReferralCode('');
    }
  }, [isSignUp]);

  const toggleAuthMode = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setContentVisible(false);
    setError('');
    setSuccess('');
    
    // Switch form at midpoint of animation
    setTimeout(() => {
      setIsSignUp(!isSignUp);
    }, 400);

    // Fade content back in
    setTimeout(() => {
      setContentVisible(true);
    }, 500);

    // Animation complete
    setTimeout(() => {
      setIsAnimating(false);
    }, 800);
  };


  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!signUpFirstName || !signUpLastName || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (!signUpEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the Terms and Conditions');
      return;
    }

    // Validate referral code for DOCTOR and CLINIC
    if ((accountType === 'DOCTOR' || accountType === 'CLINIC') && !referralCode.trim()) {
      setError('Referral code is required for Doctor and Clinic accounts');
      return;
    }

    setIsLoading(true);
    try {
      await signup(
        signUpFirstName, 
        signUpLastName, 
        signUpEmail, 
        signUpPassword, 
        signUpPhone || undefined, 
        accountType,
        accountType === 'DOCTOR' || accountType === 'CLINIC' ? referralCode : undefined
      );
      setSuccess('Account created successfully! Redirecting...');
      
      // Only redirect to psych profile for PATIENT accounts
      if (accountType === 'PATIENT') {
        await refreshPsychProfile();
        setTimeout(() => navigate('/onboarding/psych-profile'), 1500);
      } else {
        // For DOCTOR and CLINIC, go directly to dashboard
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!signInEmail || !signInPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!signInEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const loggedInUser = await login(signInEmail, signInPassword);
      setSuccess('Login successful! Redirecting...');
      
      // Only check psych profile for PATIENT accounts
      if (loggedInUser?.role === 'PATIENT') {
        const profile = await refreshPsychProfile();
        const nextPath = profile?.completed ? from : '/onboarding/psych-profile';
        setTimeout(() => navigate(nextPath, { replace: true }), 1000);
      } else {
        // For DOCTOR and CLINIC, go directly to dashboard
        setTimeout(() => navigate(from, { replace: true }), 1000);
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-hidden auth-page-bg">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-orb auth-orb-4" />
      </div>

      {/* Decorative Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              '--twinkle-min': 0.1,
              '--twinkle-max': 0.7,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Main Card Container - wider for Sign Up */}
      <div 
        className="relative w-full h-[680px]"
        style={{
          maxWidth: isSignUp ? '1150px' : '1050px',
          transition: 'max-width 800ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        }}
      >
        {/* Cards Wrapper */}
        <div className="relative w-full h-full flex items-center">
          
          {/* Image Card - Slides between left and right */}
          <div
            className="absolute h-full auth-image-card-dark flex items-center justify-center p-6 rounded-[2rem] z-10 auth-card-glow"
            style={{
              width: isSignUp ? '42%' : '48%',
              left: isSignUp ? '58%' : '0%',
              transition: 'left 800ms cubic-bezier(0.4, 0.0, 0.2, 1), width 800ms cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
          >
            <LogoDisplay />
          </div>

          {/* Form Card - Slides between left and right (shorter than image) */}
          <div
            className="absolute h-[88%] auth-glass-card p-8 flex flex-col justify-center overflow-hidden rounded-[2rem]"
            style={{
              width: isSignUp ? '60%' : '54%',
              left: isSignUp ? '0%' : '46%',
              transition: 'left 800ms cubic-bezier(0.4, 0.0, 0.2, 1), width 800ms cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
          >
            {/* Subtle inner glow */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
            
            {/* Form Content with fade animation */}
            <div
              className="relative z-10"
              style={{
                opacity: contentVisible ? 1 : 0,
                transition: 'opacity 300ms ease-in-out',
              }}
            >
              {isSignUp ? (
                /* Sign Up Form */
                <div className="relative">
                  {/* Overlay error/success messages */}
                  {error && (
                    <div className="absolute -top-2 left-0 right-0 p-2.5 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 animate-shake z-20">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="absolute -top-2 left-0 right-0 p-2.5 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400 z-20">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">{success}</span>
                    </div>
                  )}

                  <h1 className="text-3xl font-bold text-purple-400 mb-4 tracking-tight text-center">
                    Sign Up
                  </h1>

                  <form onSubmit={handleSignUp} className="space-y-3">
                    {/* Account Type Selection */}
                    <div className="mb-1.5">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAccountType('PATIENT')}
                          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 flex-1 rounded-lg border transition-all duration-200 ${
                            accountType === 'PATIENT'
                              ? 'border-purple-400 bg-purple-500/20 shadow-sm shadow-purple-500/20'
                              : 'border-purple-300/20 bg-white/5 hover:border-purple-300/40 hover:bg-white/10'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${accountType === 'PATIENT' ? 'text-purple-300' : 'text-purple-300/60'}`} />
                          <span className={`text-[11px] font-medium ${accountType === 'PATIENT' ? 'text-purple-200' : 'text-purple-200/70'}`}>
                            Pacient
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountType('DOCTOR')}
                          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 flex-1 rounded-lg border transition-all duration-200 ${
                            accountType === 'DOCTOR'
                              ? 'border-purple-400 bg-purple-500/20 shadow-sm shadow-purple-500/20'
                              : 'border-purple-300/20 bg-white/5 hover:border-purple-300/40 hover:bg-white/10'
                          }`}
                        >
                          <Stethoscope className={`w-3.5 h-3.5 ${accountType === 'DOCTOR' ? 'text-purple-300' : 'text-purple-300/60'}`} />
                          <span className={`text-[11px] font-medium ${accountType === 'DOCTOR' ? 'text-purple-200' : 'text-purple-200/70'}`}>
                            Doctor
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountType('CLINIC')}
                          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 flex-1 rounded-lg border transition-all duration-200 ${
                            accountType === 'CLINIC'
                              ? 'border-purple-400 bg-purple-500/20 shadow-sm shadow-purple-500/20'
                              : 'border-purple-300/20 bg-white/5 hover:border-purple-300/40 hover:bg-white/10'
                          }`}
                        >
                          <Building2 className={`w-3.5 h-3.5 ${accountType === 'CLINIC' ? 'text-purple-300' : 'text-purple-300/60'}`} />
                          <span className={`text-[11px] font-medium ${accountType === 'CLINIC' ? 'text-purple-200' : 'text-purple-200/70'}`}>
                            Clinică
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Referral Code (for Doctor and Clinic) */}
                    {(accountType === 'DOCTOR' || accountType === 'CLINIC') && (
                      <div className="relative group">
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                          placeholder="Referral Code (required)"
                          className="auth-input"
                        />
                        <Lock className="auth-input-icon-right" />
                      </div>
                    )}

                    {/* Name Row */}
                    <div className="flex gap-3">
                      <div className="flex-1 relative group">
                        <input
                          type="text"
                          value={signUpFirstName}
                          onChange={(e) => setSignUpFirstName(e.target.value)}
                          placeholder="First name"
                          className="auth-input"
                        />
                        <User className="auth-input-icon-right" />
                      </div>
                      <div className="flex-1 relative group">
                        <input
                          type="text"
                          value={signUpLastName}
                          onChange={(e) => setSignUpLastName(e.target.value)}
                          placeholder="Last name"
                          className="auth-input"
                        />
                        <User className="auth-input-icon-right" />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="relative group">
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="Email"
                        className="auth-input"
                      />
                      <Mail className="auth-input-icon-right" />
                    </div>

                    {/* Phone */}
                    <div className="relative group">
                      <input
                        type="tel"
                        value={signUpPhone}
                        onChange={(e) => setSignUpPhone(e.target.value)}
                        placeholder="Phone (optional)"
                        className="auth-input"
                      />
                      <Phone className="auth-input-icon-right" />
                    </div>

                    {/* Password */}
                    <div className="relative group">
                      <input
                        type="password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Password"
                        className="auth-input"
                      />
                      <Lock className="auth-input-icon-right" />
                    </div>

                    {/* Confirm Password */}
                    <div className="relative group">
                      <input
                        type="password"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="auth-input"
                      />
                      <Lock className="auth-input-icon-right" />
                    </div>

                    {/* Terms */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-purple-300/30 bg-white/5 text-purple-500 focus:ring-purple-500/50 cursor-pointer accent-purple-500"
                      />
                      <label htmlFor="terms" className="text-sm text-purple-200/70 cursor-pointer">
                        I agree to the <span className="text-purple-300 hover:text-purple-200 transition-colors">Terms and Conditions</span>
                      </label>
                    </div>

                    {/* Submit Button - centered */}
                    <div className="flex justify-center pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="auth-btn"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating account...
                          </span>
                        ) : (
                          'Sign Up'
                        )}
                      </button>
                    </div>

                    {/* Toggle Link */}
                    <p className="text-center text-purple-200/60 text-sm">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={toggleAuthMode}
                        disabled={isAnimating}
                        className="text-purple-300 hover:text-white font-semibold transition-colors underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        Sign In
                      </button>
                    </p>
                  </form>
                </div>
              ) : (
                /* Sign In Form */
                <div className="relative">
                  {/* Overlay error/success messages */}
                  {error && (
                    <div className="absolute -top-2 left-0 right-0 p-2.5 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 animate-shake z-20">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="absolute -top-2 left-0 right-0 p-2.5 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400 z-20">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">{success}</span>
                    </div>
                  )}

                  <h1 className="text-3xl font-bold text-purple-400 mb-6 tracking-tight text-center">
                    Login
                  </h1>

                  <form onSubmit={handleSignIn} className="space-y-6">
                    {/* Email */}
                    <div className="relative group">
                      <input
                        type="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="Email"
                        className="auth-input"
                      />
                        <Mail className="auth-input-icon-right" />
                    </div>

                    {/* Password */}
                    <div className="relative group">
                      <input
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Password"
                        className="auth-input"
                      />
                      <Lock className="auth-input-icon-right" />
                    </div>

                    {/* Submit Button - centered */}
                    <div className="flex justify-center pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="auth-btn"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing in...
                          </span>
                        ) : (
                          'Login'
                        )}
                      </button>
                    </div>

                    {/* Toggle Links */}
                    <div className="flex items-center justify-center gap-6 pt-2">
                      <button
                        type="button"
                        onClick={toggleAuthMode}
                        disabled={isAnimating}
                        className="text-sm text-purple-200/70 hover:text-white font-medium transition-colors disabled:opacity-50"
                      >
                        Create An Account
                      </button>
                      <button type="button" className="text-sm text-purple-200/70 hover:text-white transition-colors">
                        Forgot Password?
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ZenLink Logo Display Component - Clean version
function LogoDisplay() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[2rem]">
      {/* Subtle stars in background */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/60 animate-twinkle"
          style={{
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: Math.random() * 4 + 's',
            '--twinkle-min': 0.1,
            '--twinkle-max': 0.5,
          } as React.CSSProperties}
        />
      ))}
      
      {/* Subtle glow at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-500/20 blur-[60px] rounded-full" />
      
      {/* Logo image */}
      <img 
        src={zenlinkLogo} 
        alt="ZenLink" 
        className="relative z-10 w-[85%] h-[85%] object-contain drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]"
      />
    </div>
  );
}
