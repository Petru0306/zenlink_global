import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, Clock, Users, FileText, Bot, User, 
  Stethoscope, Mail, Phone, Edit, Sparkles
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('schedule');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock data - will be replaced with API calls
  const appointments = [
    { id: 1, patientName: 'Ion Popescu', date: '2025-11-25', time: '10:00', status: 'upcoming' },
    { id: 2, patientName: 'Maria Ionescu', date: '2025-11-25', time: '11:00', status: 'upcoming' },
  ];

  const patients = [
    { id: 1, name: 'Ion Popescu', email: 'ion@example.com', phone: '+40 123 456 789', lastVisit: '2025-11-20' },
    { id: 2, name: 'Maria Ionescu', email: 'maria@example.com', phone: '+40 987 654 321', lastVisit: '2025-11-18' },
  ];

  const sidebarItems = [
    { id: 'profile', label: 'Personal Information', icon: User },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'patients', label: 'Patient List', icon: Users },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Personal Information</h1>
              <p className="text-white/40">Manage your profile and account settings</p>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">Profile Details</h2>
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-white/40 text-sm mb-2 block">First Name</label>
                  <p className="text-white text-lg">{user?.firstName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-white/40 text-sm mb-2 block">Last Name</label>
                  <p className="text-white text-lg">{user?.lastName || 'N/A'}</p>
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

      case 'schedule':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Schedule & Appointments</h1>
              <p className="text-white/40">Manage your appointments and availability</p>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">Upcoming Appointments</h2>
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                  Add Appointment
                </button>
              </div>

              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Stethoscope className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{apt.patientName}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-white/40 text-sm flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {apt.date}
                            </span>
                            <span className="text-white/40 text-sm flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {apt.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'patients':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Patient List</h1>
              <p className="text-white/40">View and manage your patients</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.05]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-sm">Total Patients</p>
                    <p className="text-white text-2xl font-semibold">{patients.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <h2 className="text-white text-xl font-semibold mb-6">All Patients</h2>
              <div className="space-y-4">
                {patients.map((patient) => (
                  <div key={patient.id} className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{patient.name}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-white/40 text-sm flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {patient.email}
                            </span>
                            <span className="text-white/40 text-sm flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {patient.phone}
                            </span>
                          </div>
                          <p className="text-white/30 text-xs mt-2">Last visit: {patient.lastVisit}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm">
                          View Files
                        </button>
                        <button className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm">
                          Treatment
                        </button>
                        <button className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm">
                          Medical Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">AI Assistant</h1>
              <p className="text-white/40">Get help with medical questions and patient care</p>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-semibold">ZenLink AI Assistant</h2>
                  <p className="text-white/40 text-sm">Your intelligent medical assistant</p>
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

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white/[0.02] backdrop-blur-xl border-r border-white/[0.05] z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold">Doctor Portal</span>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === item.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 min-h-screen relative z-10">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.05] px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white/60 hover:text-white"
            >
              Menu
            </button>
            <div className="flex items-center gap-4">
              <span className="text-white/60">Dr. {user?.firstName} {user?.lastName}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className="p-8 lg:p-12 max-w-[1600px] mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

