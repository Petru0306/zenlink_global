import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipPsychProfileCheck?: boolean;
}

export default function ProtectedRoute({ children, skipPsychProfileCheck = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, psychProfile, psychProfileLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b1437] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to sign-in page with return url
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const requiresPsychProfile = user?.role?.toUpperCase?.() === 'PATIENT';
  if (!skipPsychProfileCheck && requiresPsychProfile && psychProfileLoading) {
    return (
      <div className="min-h-screen bg-[#0b1437] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!skipPsychProfileCheck && requiresPsychProfile && psychProfile?.completed !== true && location.pathname !== '/onboarding/psych-profile') {
    return <Navigate to="/onboarding/psych-profile" replace />;
  }

  return <>{children}</>;
}

