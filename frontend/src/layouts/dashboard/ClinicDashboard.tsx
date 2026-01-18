import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VisionSidebar } from './components/VisionSidebar';
import { 
  Building2, Users, UserCheck, CreditCard, Bot, 
  Mail, Phone, Edit, Calendar, Stethoscope
} from 'lucide-react';
import { AiChat } from '../../components/AiChat';

export default function ClinicDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Real data - fetched from backend
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clinicPatients, setClinicPatients] = useState<any[]>([]);

  useEffect(() => {
    // Fetch doctors from backend
    // Future: replace with GET /clinics/{id}/invites or /clinics/{id}/doctors
    setDoctors([]);
    setClinicPatients([]);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    if (activeSection !== 'ai') return;

    fetch(`http://localhost:8080/api/clinics/${user.id}/patients`)
      .then((r) => r.json())
      .then((list) => setClinicPatients(Array.isArray(list) ? list : []))
      .catch((err) => {
        console.error('Error fetching clinic patients:', err);
        setClinicPatients([]);
      });
  }, [activeSection, user?.id]);

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
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <UserCheck className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-purple-200/70 text-sm font-medium uppercase tracking-wide">Total Doctors</p>
                    <p className="text-white text-2xl font-bold">{doctors.length}</p>
                  </div>
                </div>
              </div>

              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <Users className="w-6 h-6 text-green-300" />
                  </div>
                  <div>
                    <p className="text-purple-200/70 text-sm font-medium uppercase tracking-wide">Total Patients</p>
                    <p className="text-white text-2xl font-bold">{clinicPatients.length}</p>
                  </div>
                </div>
              </div>

              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Calendar className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-purple-200/70 text-sm font-medium uppercase tracking-wide">Appointments Today</p>
                    <p className="text-white text-2xl font-bold">12</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Clinic Information</h2>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl flex items-center gap-2 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-semibold">
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
          </div>
        );

      case 'doctors':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Our Doctors</h1>
              <p className="text-white/40">Manage your clinic's medical staff</p>
            </div>

            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Doctor List</h2>
                  <button className="px-4 py-2 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-semibold">
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
                    <div key={doctor.id} className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30">
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Stethoscope className="w-6 h-6 text-purple-300" />
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{doctor.name}</h3>
                            <p className="text-purple-300 text-sm font-medium">{doctor.specialization}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-purple-200/70 text-sm flex items-center gap-1 font-medium">
                                <Mail className="w-4 h-4 text-purple-300" />
                                {doctor.email}
                              </span>
                              <span className="text-purple-200/70 text-sm flex items-center gap-1 font-medium">
                                <Phone className="w-4 h-4 text-purple-300" />
                                {doctor.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="px-4 py-2 backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white rounded-xl text-sm font-semibold transition-all duration-300">
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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

            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <h2 className="text-white text-2xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">All Patients</h2>
                <div className="space-y-4">
                  {clinicPatients.length === 0 ? (
                    <div className="text-white/60 text-center py-8">
                      No patients yet. Patients will appear here once they book appointments with your doctors.
                    </div>
                  ) : (
                    clinicPatients.map((patient) => (
                      <div key={patient.id} className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/20">
                              <Users className="w-6 h-6 text-green-300" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold">{patient.name}</h3>
                              <p className="text-purple-200/70 text-sm font-medium">{patient.email}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-purple-200/70 text-sm font-medium">Doctor: {patient.doctor}</span>
                                <span className="text-purple-200/70 text-sm font-medium">Last visit: {patient.lastVisit}</span>
                              </div>
                            </div>
                          </div>
                          <button className="px-4 py-2 backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white rounded-xl text-sm font-semibold transition-all duration-300">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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

            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Current Plan</h2>
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    subscriptions.status === 'Active' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
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
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-semibold">
                    Upgrade Plan
                  </button>
                  <button className="px-6 py-3 backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white rounded-xl transition-all duration-300 font-semibold">
                    Manage Billing
                  </button>
                </div>
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

            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border border-purple-400/50 flex items-center justify-center shadow-2xl shadow-purple-500/50">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">ZenLink AI Assistant</h2>
                    <p className="text-purple-200/70 text-sm font-medium">Your intelligent clinic assistant</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-purple-200/70 text-sm mb-2 font-medium uppercase tracking-wide">Selectează pacientul</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm backdrop-blur-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  >
                    <option value="">— alege pacient —</option>
                    {clinicPatients.map((p: any) => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {p.name || `Patient ${p.id}`}
                      </option>
                    ))}
                  </select>
                  {clinicPatients.length === 0 && (
                    <p className="text-purple-200/50 text-xs mt-2 font-medium">
                      Nu există pacienți disponibili. Un clinic vede pacienții doar dacă are doctori asociați (și acei doctori au programări).
                    </p>
                  )}
                </div>

                {selectedPatientId ? (
                  <AiChat
                    userId={String(user?.id || '')}
                    userRole={(user?.role || 'CLINIC') as any}
                    scopeType="PATIENT"
                    scopeId={selectedPatientId}
                    title="ZenLink AI Assistant"
                    subtitle="Întrebări despre pacientul selectat (cu citări din fișierele pacientului)."
                  />
                ) : (
                  <div className="text-purple-200/70 text-sm backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 font-medium">
                    Selectează un pacient ca să poți folosi AI cu fișierele lui.
                  </div>
                )}
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
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px]" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px]" />
      </div>

      {/* Sidebar */}
      <VisionSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        menuItems={sidebarItems}
      />

      {/* Main Content */}
      <div className="lg:pl-[280px] min-h-screen relative z-10">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-40 text-white/60 hover:text-white bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] px-4 py-2 rounded-xl"
        >
          Menu
        </button>

        {/* Content Area */}
        <main className="p-8 lg:p-12 max-w-[1600px] mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

