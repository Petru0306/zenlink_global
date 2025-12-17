import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, Users, UserCheck, CreditCard, Bot, 
  Mail, Phone, Edit, Calendar, Stethoscope
} from 'lucide-react';
import { VisionSidebar } from './components/VisionSidebar';

export default function ClinicDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real data - fetched from backend
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clinicPatients, setClinicPatients] = useState<any[]>([]);

  useEffect(() => {
    // Fetch doctors from backend
    // Future: replace with GET /clinics/{id}/invites or /clinics/{id}/doctors
    setDoctors([]);
    setClinicPatients([]);
  }, []);

  const subscriptions = {
    plan: 'Premium',
    status: 'Active',
    nextBilling: '2025-12-24',
    price: '500 RON/month',
    features: ['Unlimited Doctors', 'Unlimited Patients', 'AI Assistant', 'Priority Support']
  };

  const sidebarItems = [
    { id: 'overview', label: 'Clinic Overview', icon: Building2 },
    { id: 'doctors', label: 'Doctors', icon: UserCheck },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Clinic Overview</h1>
              <p className="text-white/40">Welcome to your clinic management portal</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-sm">Total Doctors</p>
                    <p className="text-white text-2xl font-semibold">{doctors.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-sm">Total Patients</p>
                    <p className="text-white text-2xl font-semibold">{clinicPatients.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-sm">Appointments Today</p>
                    <p className="text-white text-2xl font-semibold">12</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">Clinic Information</h2>
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-white/40 text-sm mb-2 block">Clinic Name</label>
                  <p className="text-white text-lg">{user?.firstName} {user?.lastName} Clinic</p>
                </div>
                <div>
                  <label className="text-white/40 text-sm mb-2 block">Email</label>
                  <p className="text-white text-lg">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-white/40 text-sm mb-2 block">Phone</label>
                  <p className="text-white text-lg">{user?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'doctors':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Our Doctors</h1>
              <p className="text-white/40">Manage your clinic's medical staff</p>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">Doctor List</h2>
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                  Add Doctor
                </button>
              </div>

              <div className="space-y-4">
                {doctors.length === 0 ? (
                  <div className="text-white/60 text-center py-8">
                    No doctors registered yet. Doctors will appear here once they create accounts.
                  </div>
                ) : (
                  doctors.map((doctor) => (
                    <div key={doctor.id} className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{doctor.name}</h3>
                          <p className="text-blue-400 text-sm">{doctor.specialization}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-white/40 text-sm flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {doctor.email}
                            </span>
                            <span className="text-white/40 text-sm flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {doctor.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm">
                        View Profile
                      </button>
                    </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'patients':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Patients</h1>
              <p className="text-white/40">View all patients in your clinic</p>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <h2 className="text-white text-xl font-semibold mb-6">All Patients</h2>
              <div className="space-y-4">
                {clinicPatients.length === 0 ? (
                  <div className="text-white/60 text-center py-8">
                    No patients yet. Patients will appear here once they book appointments with your doctors.
                  </div>
                ) : (
                  clinicPatients.map((patient) => (
                    <div key={patient.id} className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{patient.name}</h3>
                          <p className="text-white/40 text-sm">{patient.email}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-white/40 text-sm">Doctor: {patient.doctor}</span>
                            <span className="text-white/40 text-sm">Last visit: {patient.lastVisit}</span>
                          </div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm">
                        View Details
                      </button>
                    </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'subscriptions':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Subscriptions</h1>
              <p className="text-white/40">Manage your clinic's subscription plan</p>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">Current Plan</h2>
                <span className={`px-3 py-1 rounded-lg text-sm ${
                  subscriptions.status === 'Active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {subscriptions.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-white/40 text-sm mb-2 block">Plan Name</label>
                  <p className="text-white text-2xl font-semibold">{subscriptions.plan}</p>
                </div>
                <div>
                  <label className="text-white/40 text-sm mb-2 block">Price</label>
                  <p className="text-white text-2xl font-semibold">{subscriptions.price}</p>
                </div>
                <div>
                  <label className="text-white/40 text-sm mb-2 block">Next Billing Date</label>
                  <p className="text-white text-lg">{subscriptions.nextBilling}</p>
                </div>
              </div>

              <div className="border-t border-white/[0.05] pt-6">
                <h3 className="text-white font-semibold mb-4">Plan Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subscriptions.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                      <span className="text-white/60">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                  Upgrade Plan
                </button>
                <button className="px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl">
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">AI Assistant</h1>
              <p className="text-white/40">Get help with clinic management and medical questions</p>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-semibold">ZenLink AI Assistant</h2>
                  <p className="text-white/40 text-sm">Your intelligent clinic assistant</p>
                </div>
              </div>

              <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
                <p className="text-white/60 text-center py-12">
                  AI Assistant feature coming soon...
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#1e3a8a]/30 via-[#1e40af]/20 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#0e7490]/25 via-[#0891b2]/15 to-transparent blur-[80px]" />
      </div>

      <VisionSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        menuItems={sidebarItems}
      />

      <div className="lg:pl-[280px] min-h-screen relative z-10 pt-12 lg:pt-16">
        <main className="p-8 lg:p-12 max-w-[1600px] mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

