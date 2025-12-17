import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar as CalendarIcon, Clock, Users, Bot, User, 
  Stethoscope, Mail, Phone, Plus, X, Pencil
} from 'lucide-react';
import { Calendar } from '../../components/Calendar';
import { VisionSidebar } from './components/VisionSidebar';
import { Input } from '../../components/ui/input';

export default function DoctorDashboard() {
  const { user, setUser } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: 'files' | 'medical'; patient: any } | null>(null);

  // Real data - fetched from backend
  const [appointments, setAppointments] = useState<any[]>([]);
  // Placeholder for future backend list; currently deriving from appointments
  // const [patients, setPatients] = useState<any[]>([]);
  
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
            raw: apt,
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
    // setPatients([]);
  }, [user]);

  const toLocalTimestamp = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return NaN;
    const dateParts = dateStr.includes('.') ? dateStr.split('.') : dateStr.split('-');
    let y: number, m: number, d: number;
    if (dateStr.includes('.')) {
      // dd.MM.yyyy
      [d, m, y] = dateParts.map(Number);
    } else {
      // yyyy-MM-dd
      [y, m, d] = dateParts.map(Number);
    }
    const [hh, mm] = timeStr.split(':').map(Number);
    if ([y, m, d, hh, mm].some((v) => Number.isNaN(v))) return NaN;
    const dt = new Date(y, (m ?? 1) - 1, d, hh, mm);
    // Adjust one day forward to compensate backend date shift
    dt.setDate(dt.getDate() + 1);
    return dt.getTime();
  };

  const upcomingAppointments = appointments.filter((apt) => {
    const ts = toLocalTimestamp(apt.date, apt.time);
    if (Number.isNaN(ts)) return false;
    const status = (apt.status || '').toLowerCase();
    if (status === 'cancelled') return false;
    // consider future slots upcoming regardless of status
    return ts >= Date.now();
  });

  const derivedPatients = useMemo(() => {
    const map = new Map();
    upcomingAppointments.forEach((apt) => {
      const key = apt.patientName || `patient-${apt.id}`;
      const existing = map.get(key);
      const aptInfo = {
        date: apt.date,
        time: apt.time,
        status: apt.status,
      };
      if (!existing) {
        map.set(key, {
          id: key,
          name: apt.patientName || 'Patient',
          email: apt.raw?.patientEmail || 'N/A',
          phone: apt.raw?.patientPhone || 'N/A',
          medical: {
            bloodType: apt.raw?.patientBloodType || apt.raw?.bloodType || 'N/A',
            allergies: apt.raw?.patientAllergies || apt.raw?.allergies || '',
            chronic: apt.raw?.patientChronic || apt.raw?.chronicConditions || '',
            medications: apt.raw?.patientMedications || apt.raw?.medications || '',
            insurance: apt.raw?.patientInsurance || apt.raw?.insuranceNumber || '',
          },
          nextAppointment: aptInfo,
          appointments: [aptInfo],
          files: apt.raw?.patientFiles || apt.raw?.files || [],
          profile: apt.raw?.patientProfile || null,
        });
      } else {
        existing.appointments.push(aptInfo);
      }
    });
    return Array.from(map.values());
  }, [upcomingAppointments]);

  const sidebarItems = [
    { id: 'profile', label: 'Cont', icon: User },
    { id: 'schedule', label: 'Programări', icon: CalendarIcon },
    { id: 'patients', label: 'Pacienți', icon: Users },
    { id: 'ai', label: 'Asistent AI', icon: Bot },
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
                <div>
                  <p className="text-white/60 text-sm">Date personale</p>
                  <h2 className="text-white text-xl font-semibold">Profil doctor</h2>
                </div>
                <button
                  onClick={() => {
                    const next = !isEditing;
                    if (!next) {
                      setEditForm({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        phone: user?.phone || '',
                      });
                    }
                    setIsEditing(next);
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-white/5 text-white/80 flex items-center gap-2 hover:bg-white/10 transition"
                  disabled={saving}
                >
                  <Pencil className="w-4 h-4" /> {isEditing ? 'Anulează' : 'Editare'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Prenume</label>
                    <Input
                      disabled={!isEditing}
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      placeholder="Prenume"
                      className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Nume</label>
                    <Input
                      disabled={!isEditing}
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      placeholder="Nume"
                      className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Email</label>
                    <Input
                      disabled
                      value={user?.email || 'N/A'}
                      className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                    />
                    <p className="text-white/30 text-xs mt-1">Email-ul nu poate fi schimbat</p>
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Telefon</label>
                    <Input
                      disabled={!isEditing}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Telefon"
                      className="bg-white/[0.04] border-white/[0.08] text-white disabled:opacity-60"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-3 bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90 text-white rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-60"
                    >
                      {saving ? 'Se salvează...' : 'Salvează profilul'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                          phone: user?.phone || '',
                        });
                      }}
                      className="px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl border border-white/[0.08]"
                      disabled={saving}
                    >
                      Anulează
                    </button>
                  </div>
                )}
              </div>
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
                  {upcomingAppointments.length === 0 ? (
                    <div className="text-white/60 text-center py-8">
                      No upcoming appointments. Appointments will appear here once patients book with you.
                    </div>
                  ) : (
                    upcomingAppointments.map((apt) => (
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
                    <p className="text-white text-2xl font-semibold">{derivedPatients.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.05]">
              <h2 className="text-white text-xl font-semibold mb-6">All Patients</h2>
              <div className="space-y-4">
                {derivedPatients.length === 0 ? (
                  <div className="text-white/60 text-center py-8">
                    No patients yet. Patients will appear here once they book appointments with you.
                  </div>
                ) : (
                  derivedPatients.map((patient: any) => (
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
                            {patient.nextAppointment && (
                              <div className="mt-3 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 text-sm flex items-center gap-3">
                                <span className="flex items-center gap-1 text-white/70">
                                  <CalendarIcon className="w-4 h-4" />
                                  {patient.nextAppointment.date}
                                </span>
                                <span className="flex items-center gap-1 text-white/70">
                                  <Clock className="w-4 h-4" />
                                  {patient.nextAppointment.time}
                                </span>
                                <span className="ml-auto px-3 py-1 bg-green-500/15 text-green-300 rounded-lg text-xs">
                                  {patient.nextAppointment.status || 'upcoming'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActionModal({ type: 'files', patient })}
                            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm"
                          >
                            View Files
                          </button>
                          <button
                            onClick={() => setActionModal({ type: 'medical', patient })}
                            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm"
                          >
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
      <VisionSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        menuItems={sidebarItems}
      />

      {/* Main Content */}
      <div className="lg:pl-[280px] min-h-screen relative z-10 pt-12 lg:pt-16">
        <main className="p-8 lg:p-12 max-w-[1600px] mx-auto">
          {renderContent()}
        </main>
      </div>

      {actionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6">
          <div className="bg-[#0b1437] border border-white/10 rounded-2xl max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white text-lg font-semibold">
                  {actionModal.type === 'files' ? 'Patient Files' : 'Medical Profile'}
                </p>
                <p className="text-white/60 text-sm">
                  {actionModal.patient?.name || 'Patient'}
                </p>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionModal.type === 'files' ? (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-white/70 text-sm space-y-3">
                {actionModal.patient?.files && actionModal.patient.files.length > 0 ? (
                  actionModal.patient.files.map((file: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="text-white">{file.name || 'Fișier'}</p>
                        <p className="text-white/40 text-xs">
                          {file.type || 'N/A'} {file.size ? `• ${file.size}` : ''}
                        </p>
                      </div>
                      <span className="text-white/50 text-xs">nu poate fi deschis aici</span>
                    </div>
                  ))
                ) : (
                  <p className="text-white/60">Niciun fișier disponibil pentru acest pacient.</p>
                )}
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-white/70 text-sm space-y-3">
                <div>
                  <p className="text-white text-sm">Email</p>
                  <p className="text-white/60 text-sm">{actionModal.patient?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-white text-sm">Telefon</p>
                  <p className="text-white/60 text-sm">{actionModal.patient?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-white text-sm">Grupă sangvină</p>
                  <p className="text-white/60 text-sm">{actionModal.patient?.medical?.bloodType || 'N/A'}</p>
                </div>
                {actionModal.patient?.medical?.allergies && (
                  <div>
                    <p className="text-white text-sm">Alergii</p>
                    <p className="text-white/60 text-sm">{actionModal.patient.medical.allergies}</p>
                  </div>
                )}
                {actionModal.patient?.medical?.chronic && (
                  <div>
                    <p className="text-white text-sm">Condiții cronice</p>
                    <p className="text-white/60 text-sm">{actionModal.patient.medical.chronic}</p>
                  </div>
                )}
                {actionModal.patient?.medical?.medications && (
                  <div>
                    <p className="text-white text-sm">Medicație</p>
                    <p className="text-white/60 text-sm">{actionModal.patient.medical.medications}</p>
                  </div>
                )}
                {actionModal.patient?.medical?.insurance && (
                  <div>
                    <p className="text-white text-sm">Asigurare</p>
                    <p className="text-white/60 text-sm">{actionModal.patient.medical.insurance}</p>
                  </div>
                )}
                {actionModal.patient?.appointments && actionModal.patient.appointments.length > 0 && (
                  <div>
                    <p className="text-white text-sm mb-2">Programări viitoare</p>
                    <div className="space-y-2">
                      {actionModal.patient.appointments.map((apt: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 text-white/70 text-sm">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {apt.date} {apt.time}
                          </span>
                          <span className="px-2 py-1 bg-green-500/15 text-green-300 rounded-lg text-xs">
                            {apt.status || 'upcoming'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

