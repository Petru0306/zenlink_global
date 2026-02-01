import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar as CalendarIcon, Clock, Users, Bot, User, 
  Stethoscope, Mail, Phone, Plus, X, Pencil
} from 'lucide-react';
import { Calendar } from '../../components/Calendar';
import { VisionSidebar } from './components/VisionSidebar';
import { Input } from '../../components/ui/input';
import { AiChat } from '../../components/AiChat';

export default function DoctorDashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
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
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
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

  const aiPatients = useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach((a: any) => {
      const pid = String(a?.raw?.patientId ?? a?.patientId ?? '');
      const name = String(a?.patientName ?? '');
      if (pid) map.set(pid, name || `Patient ${pid}`);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [appointments]);

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

  const canStartConsultation = (apt: any) => {
    const role = (user?.role || '').toString().toLowerCase();
    const status = (apt?.status || '').toString().toLowerCase();
    const allowedStatuses = ['scheduled', 'confirmed', 'upcoming'];
    return role === 'doctor' && allowedStatuses.includes(status);
  };

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

            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-purple-200/70 text-sm font-medium uppercase tracking-wide">Date personale</p>
                    <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Profil doctor</h2>
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
                    className="px-3 py-1 text-xs rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white/80 flex items-center gap-2 transition-all duration-300 font-semibold"
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
                      className="px-4 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-60 transition-all duration-300 font-semibold"
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
                      className="px-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white rounded-xl transition-all duration-300 font-semibold"
                      disabled={saving}
                    >
                      Anulează
                    </button>
                  </div>
                )}
                </div>
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
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <h2 className="text-white text-2xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Set Your Availability</h2>
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
                          className="px-3 py-1 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-lg flex items-center gap-1 text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                          Add Slot
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {timeSlots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-3 backdrop-blur-xl bg-white/5 border border-white/10 p-3 rounded-xl">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                            />
                            <span className="text-purple-200/70">-</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
                            />
                            <button
                              onClick={() => removeTimeSlot(index)}
                              className="ml-auto p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {timeSlots.length === 0 && (
                          <p className="text-purple-200/70 text-sm text-center py-4 font-medium">
                            No time slots set. Click "Add Slot" to add availability.
                          </p>
                        )}
                      </div>
                      
                      {timeSlots.length > 0 && (
                        <button
                          onClick={saveAvailability}
                          disabled={savingAvailability}
                          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl font-semibold shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 transition-all duration-300"
                        >
                          {savingAvailability ? 'Saving...' : 'Save Availability'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Upcoming Appointments</h2>
                    <span className="text-xs font-semibold uppercase tracking-wide text-purple-200/70 border border-white/10 rounded-full px-3 py-1 backdrop-blur-sm bg-white/5">
                      ZenLink Ready (Silent Mode)
                    </span>
                  </div>
                  <div className="space-y-4">
                    {upcomingAppointments.length === 0 ? (
                      <div className="text-purple-200/70 text-center py-8 font-medium">
                        No upcoming appointments. Appointments will appear here once patients book with you.
                      </div>
                    ) : (
                      upcomingAppointments.map((apt) => (
                        <div key={apt.id} className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30">
                          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Stethoscope className="w-6 h-6 text-purple-300" />
                              </div>
                              <div>
                                <h3 className="text-white font-bold">{apt.patientName}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-purple-200/70 text-sm flex items-center gap-1 font-medium">
                                    <CalendarIcon className="w-4 h-4 text-purple-300" />
                                    {apt.date}
                                  </span>
                                  <span className="text-purple-200/70 text-sm flex items-center gap-1 font-medium">
                                    <Clock className="w-4 h-4 text-purple-300" />
                                    {apt.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-semibold">
                                {apt.status}
                              </span>
                              <button
                                onClick={() => navigate(`/consult/${apt.id}`)}
                                disabled={!canStartConsultation(apt)}
                                className="px-4 py-2 bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Începe consultația
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
              <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Users className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-purple-200/70 text-sm font-medium uppercase tracking-wide">Total Patients</p>
                    <p className="text-white text-2xl font-bold">{derivedPatients.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-8 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10">
                <h2 className="text-white text-2xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">All Patients</h2>
                <div className="space-y-4">
                  {derivedPatients.length === 0 ? (
                    <div className="text-purple-200/70 text-center py-8 font-medium">
                      No patients yet. Patients will appear here once they book appointments with you.
                    </div>
                  ) : (
                    derivedPatients.map((patient: any) => (
                      <div key={patient.id} className="relative group/patient backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover/patient:opacity-100 transition-opacity duration-500 blur-xl" />
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                              <User className="w-6 h-6 text-purple-300" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold">{patient.name}</h3>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-purple-200/70 text-sm flex items-center gap-1 font-medium">
                                  <Mail className="w-4 h-4 text-purple-300" />
                                  {patient.email}
                                </span>
                                <span className="text-purple-200/70 text-sm flex items-center gap-1 font-medium">
                                  <Phone className="w-4 h-4 text-purple-300" />
                                  {patient.phone}
                                </span>
                              </div>
                              {patient.nextAppointment && (
                                <div className="mt-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-purple-200/80 text-sm flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-purple-200/70 font-medium">
                                    <CalendarIcon className="w-4 h-4 text-purple-300" />
                                    {patient.nextAppointment.date}
                                  </span>
                                  <span className="flex items-center gap-1 text-purple-200/70 font-medium">
                                    <Clock className="w-4 h-4 text-purple-300" />
                                    {patient.nextAppointment.time}
                                  </span>
                                  <span className="ml-auto px-3 py-1 bg-green-500/15 text-green-300 border border-green-500/30 rounded-lg text-xs font-semibold">
                                    {patient.nextAppointment.status || 'upcoming'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setActionModal({ type: 'files', patient })}
                              className="px-4 py-2 backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white rounded-xl text-sm font-semibold transition-all duration-300"
                            >
                              View Files
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'medical', patient })}
                              className="px-4 py-2 backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white rounded-xl text-sm font-semibold transition-all duration-300"
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
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-white text-3xl font-semibold mb-2">AI Assistant</h1>
              <p className="text-white/40">Get help with medical questions and patient care</p>
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
                    <p className="text-purple-200/70 text-sm font-medium">Your intelligent medical assistant</p>
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
                    {aiPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {aiPatients.length === 0 && (
                    <p className="text-purple-200/50 text-xs mt-2 font-medium">
                      Nu există încă pacienți (ai nevoie de programări ca să apară aici).
                    </p>
                  )}
                </div>

                {selectedPatientId ? (
                  <AiChat
                    userId={String(user?.id || '')}
                    userRole={(user?.role || 'DOCTOR') as any}
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

