import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VisionSidebar } from './components/VisionSidebar';
import ClinicProfileEditor from '../../components/clinic/ClinicProfileEditor';
import { clinicDoctorService, type ClinicDoctor } from '../../services/clinicDoctorService';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { 
  Building2, Users, UserCheck, CreditCard, 
  Mail, Phone, Edit, Calendar, Stethoscope, Search, X, Plus, Trash2, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClinicDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real data - fetched from backend
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [clinicPatients, setClinicPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClinicDoctor[]>([]);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id && activeSection === 'doctors') {
      loadClinicDoctors();
    }
  }, [user?.id, activeSection]);

  const loadClinicDoctors = async () => {
    if (!user?.id) return;
    try {
      const clinicDoctors = await clinicDoctorService.getClinicDoctors(user.id);
      setDoctors(clinicDoctors);
    } catch (error) {
      console.error('Error loading clinic doctors:', error);
      setDoctors([]);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await clinicDoctorService.searchDoctors(query);
      // Filter out doctors already in clinic
      const existingDoctorIds = new Set(doctors.map(d => d.id));
      const filteredResults = results.filter(d => !existingDoctorIds.has(d.id));
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching doctors:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddDoctor = async (doctorId: number) => {
    if (!user?.id) return;
    try {
      await clinicDoctorService.addDoctor(user.id, doctorId);
      await loadClinicDoctors();
      setSearchQuery('');
      setSearchResults([]);
      setShowAddDoctor(false);
      // Note: Doctor's profile will be updated automatically by backend
      // The doctor will see the clinic in their profile after refresh
    } catch (error) {
      console.error('Error adding doctor:', error);
      alert(error instanceof Error ? error.message : 'Failed to add doctor');
    }
  };

  const handleRemoveDoctor = async (doctorId: number) => {
    if (!user?.id) return;
    if (!confirm('Are you sure you want to remove this doctor from your clinic?')) return;
    
    try {
      await clinicDoctorService.removeDoctor(user.id, doctorId);
      await loadClinicDoctors();
    } catch (error) {
      console.error('Error removing doctor:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove doctor');
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    if (activeSection !== 'patients') return;

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
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <ClinicProfileEditor 
            userId={user?.id || 0} 
            onSave={() => {
              // Refresh data if needed
              console.log('Clinic profile saved');
            }} 
          />
        );

      case 'doctors':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Our Doctors</h1>
              <p className="text-white/40">Manage your clinic's medical staff</p>
            </div>

            {/* Add Doctor Section */}
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Add Doctor</h2>
                  {!showAddDoctor && (
                    <Button
                      onClick={() => setShowAddDoctor(true)}
                      className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Doctor
                    </Button>
                  )}
                </div>

                {showAddDoctor && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                      <Input
                        type="text"
                        placeholder="Search doctors by name..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
                      />
                    </div>

                    {searching && (
                      <div className="text-white/60 text-center py-4">Searching...</div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {searchResults.map((doctor) => (
                          <div
                            key={doctor.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {doctor.profileImageUrl ? (
                                <img
                                  src={doctor.profileImageUrl}
                                  alt={`${doctor.firstName} ${doctor.lastName}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                                  <User className="w-5 h-5 text-purple-300" />
                                </div>
                              )}
                              <div>
                                <p className="text-white font-semibold">
                                  {doctor.firstName} {doctor.lastName}
                                </p>
                                {doctor.specializations && (
                                  <p className="text-purple-200/70 text-sm">
                                    {doctor.specializations.split(',')[0]}
                                  </p>
                                )}
                                <p className="text-purple-200/50 text-xs">{doctor.email}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAddDoctor(doctor.id)}
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                      <div className="text-white/60 text-center py-4">No doctors found</div>
                    )}

                    <Button
                      onClick={() => {
                        setShowAddDoctor(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-purple-500/30"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Doctor List */}
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <h2 className="text-white text-2xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Doctor List ({doctors.length})
                </h2>

                <div className="space-y-4">
                  {doctors.length === 0 ? (
                    <div className="text-white/60 text-center py-8">
                      No doctors registered yet. Use the search above to add doctors to your clinic.
                    </div>
                  ) : (
                    doctors.map((doctor) => (
                      <div key={doctor.id} className="relative group/item backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 blur-xl" />
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {doctor.profileImageUrl ? (
                              <img
                                src={doctor.profileImageUrl}
                                alt={`${doctor.firstName} ${doctor.lastName}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Stethoscope className="w-6 h-6 text-purple-300" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-white font-bold">
                                {doctor.firstName} {doctor.lastName}
                              </h3>
                              {doctor.specializations && (
                                <p className="text-purple-300 text-sm font-medium">
                                  {doctor.specializations.split(',')[0]}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-purple-200/70 text-sm flex items-center gap-1 font-medium">
                                  <Mail className="w-4 h-4 text-purple-300" />
                                  {doctor.email}
                                </span>
                                {doctor.phone && (
                                  <span className="text-purple-200/70 text-sm flex items-center gap-1 font-medium">
                                    <Phone className="w-4 h-4 text-purple-300" />
                                    {doctor.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => navigate(`/doctor/${doctor.id}`)}
                              variant="outline"
                              className="bg-white/5 border-white/10 text-white/80 hover:text-white hover:border-purple-500/30"
                            >
                              View Profile
                            </Button>
                            <Button
                              onClick={() => handleRemoveDoctor(doctor.id)}
                              variant="outline"
                              size="icon"
                              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

