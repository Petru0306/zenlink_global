import { useAuth } from '../context/AuthContext';
// @ts-ignore - JS file
import PatientDashboard from '../layouts/dashboard';
// @ts-ignore
import DoctorDashboard from '../layouts/dashboard/DoctorDashboard';
// @ts-ignore
import ClinicDashboard from '../layouts/dashboard/ClinicDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  // Debug: Log user role to console
  console.log('DashboardRouter - User role:', user.role, 'User:', user);

  // Route to appropriate dashboard based on user role
  // Handle both uppercase and any case variations
  const role = user.role?.toUpperCase();
  
  switch (role) {
    case 'DOCTOR':
      return <DoctorDashboard />;
    case 'CLINIC':
      return <ClinicDashboard />;
    case 'PATIENT':
    default:
      return <PatientDashboard />;
  }
}

