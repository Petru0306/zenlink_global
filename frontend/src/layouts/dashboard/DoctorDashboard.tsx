import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar as CalendarIcon, Clock, Users, Bot, User, 
  Stethoscope, Mail, Phone, Edit, Plus, X
} from 'lucide-react';
import { Calendar } from '../../components/Calendar';

export default function DoctorDashboard() {
  const { user, setUser } = useAuth();
  const [activeSection, setActiveSection] = useState('schedule');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  // Real data - fetched from backend
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  
  // Schedule management
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<Array<{startTime: string, endTime: string}>>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);

  useEffect(() => {
    // Fetch appointments for current doctor
    if (user?.id) {
      fetch(`http://localhost:8080/api/appointments/doctor/${user.id}`)
        .then(res => res.json())
        .then((data: any[]) => {
          const transformed = data.map(apt => ({
            id: apt.id,
            patientName: apt.patientName,
            date: apt.date,
            time: apt.time.substring(0, 5), // Get HH:MM
            status: apt.status,
          }));
          setAppointments(transformed);
        })
        .catch(err => console.error('Error fetching appointments:', err));
      
      // Fetch availability
      fetch(`http://localhost:8080/api/availability/doctor/${user.id}`)
        .then(res => res.json())
        .then(data => setAvailability(data))
        .catch(err => console.error('Error fetching availability:', err));
    }
    
    // TODO: Fetch patients from backend when endpoint is ready
    setPatients([]);
  }, [user]);

  const sidebarItems = [
    { id: 'profile', label: 'Personal Information', icon: User },
    { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    { id: 'patients', label: 'Patient List', icon: Users },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        const handleSave = async () => {
          if (!user?.id) return;
          
          setSaving(true);
          try {
            const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(editForm),
            });

            if (!response.ok) {
              throw new Error('Failed to update profile');
            }

            const updatedUser = await response.json();
            // Update user in context
            const newUserData = {
              ...user,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              phone: updatedUser.phone,
            };
            setUser(newUserData);
            localStorage.setItem('user', JSON.stringify(newUserData));
            setIsEditing(false);
          } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
          } finally {
            setSaving(false);
          }
        };

        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Personal Information</h1>
              <p className="text-white/40">Manage your profile and account settings</p>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-semibold">Profile Details</h2>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                          phone: user?.phone || '',
                        });
                      }}
                      className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">Email</label>
                    <p className="text-white/60 text-lg">{user?.email || 'N/A'}</p>
                    <p className="text-white/30 text-xs mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="text-white/40 text-sm mb-2 block">Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        );

      case 'schedule':
        const handleDateSelect = (date: Date) => {
          setSelectedDate(date);
          const dateStr = date.toISOString().split('T')[0];
          // Check if there's existing availability for this date
          const existingSlots = availability.filter(av => av.date === dateStr);
          if (existingSlots.length > 0) {
            setTimeSlots(existingSlots.map(av => ({
              startTime: av.startTime.substring(0, 5),
              endTime: av.endTime.substring(0, 5)
            })));
          } else {
            setTimeSlots([]);
          }
        };

        const addTimeSlot = () => {
          setTimeSlots([...timeSlots, { startTime: '09:00', endTime: '10:00' }]);
        };

        const removeTimeSlot = (index: number) => {
          setTimeSlots(timeSlots.filter((_, i) => i !== index));
        };

        const updateTimeSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
          const updated = [...timeSlots];
          updated[index] = { ...updated[index], [field]: value };
          setTimeSlots(updated);
        };

        const saveAvailability = async () => {
          if (!selectedDate || !user?.id) {
            alert('Please select a date first');
            return;
          }
          
          if (timeSlots.length === 0) {
            alert('Please add at least one time slot');
            return;
          }
          
          setSavingAvailability(true);
          try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            
            // Validate time slots
            const validSlots = timeSlots.filter(slot => {
              if (!slot.startTime || !slot.endTime) return false;
              const start = slot.startTime.split(':').map(Number);
              const end = slot.endTime.split(':').map(Number);
              if (start.length !== 2 || end.length !== 2) return false;
              const startMinutes = start[0] * 60 + start[1];
              const endMinutes = end[0] * 60 + end[1];
              return endMinutes > startMinutes;
            });
            
            if (validSlots.length === 0) {
              throw new Error('Please provide valid time slots (end time must be after start time)');
            }
            
            const requestBody = {
              date: dateStr,
              timeSlots: validSlots.map(slot => ({
                startTime: slot.startTime + ':00',
                endTime: slot.endTime + ':00'
              }))
            };

            console.log('Saving availability:', JSON.stringify(requestBody, null, 2));

            const doctorId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
            console.log('Doctor ID:', doctorId, 'Type:', typeof doctorId);
            
            const response = await fetch(`http://localhost:8080/api/availability/doctor/${doctorId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            console.log('Response status:', response.status);
            
            // Check if response is ok (200-299)
            if (response.status >= 200 && response.status < 300) {
              // Success - refresh availability list
              try {
                const updatedAvailability = await fetch(`http://localhost:8080/api/availability/doctor/${doctorId}`)
                  .then(res => res.json());
                setAvailability(updatedAvailability);
                console.log('Availability refreshed:', updatedAvailability);
                alert('Availability saved successfully!');
              } catch (refreshError) {
                console.error('Error refreshing availability:', refreshError);
                // Still show success since save worked
                alert('Availability saved successfully! (Note: Could not refresh list)');
              }
            } else {
              // Error response
              let errorText;
              try {
                errorText = await response.text();
                console.error('Error response body:', errorText);
              } catch (e) {
                errorText = `HTTP ${response.status}: ${response.statusText}`;
              }
              throw new Error(errorText || 'Failed to save availability');
            }
          } catch (error: any) {
            console.error('Error saving availability:', error);
            alert(`Failed to save availability: ${error.message || 'Please try again.'}`);
          } finally {
            setSavingAvailability(false);
          }
        };
        
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">Schedule & Appointments</h1>
              <p className="text-white/40">Manage your availability and appointments</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendar for setting availability */}
              <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
                <h2 className="text-white text-xl font-semibold mb-6">Set Your Availability</h2>
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  unavailableDates={[]}
                />
                
                {selectedDate && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">
                        Time slots for {selectedDate.toLocaleDateString('ro-RO')}
                      </h3>
                      <button
                        onClick={addTimeSlot}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Slot
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-xl">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                            className="px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-white/40">-</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                            className="px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => removeTimeSlot(index)}
                            className="ml-auto p-2 hover:bg-white/[0.1] rounded-lg text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {timeSlots.length === 0 && (
                        <p className="text-white/40 text-sm text-center py-4">
                          No time slots set. Click "Add Slot" to add availability.
                        </p>
                      )}
                    </div>
                    
                    {timeSlots.length > 0 && (
                      <button
                        onClick={saveAvailability}
                        disabled={savingAvailability}
                        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50"
                      >
                        {savingAvailability ? 'Saving...' : 'Save Availability'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Upcoming Appointments */}
              <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
                <h2 className="text-white text-xl font-semibold mb-6">Upcoming Appointments</h2>
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="text-white/60 text-center py-8">
                      No appointments scheduled. Appointments will appear here once patients book with you.
                    </div>
                  ) : (
                    appointments.map((apt) => (
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
                                  <CalendarIcon className="w-4 h-4" />
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
                {patients.length === 0 ? (
                  <div className="text-white/60 text-center py-8">
                    No patients yet. Patients will appear here once they book appointments with you.
                  </div>
                ) : (
                  patients.map((patient) => (
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
                  ))
                )}
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

