import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar as CalendarIcon, Clock, Users, Bot, User, 
  Stethoscope, Mail, Phone, Plus, X, Pencil, Edit2, CalendarDays, CheckCircle2
} from 'lucide-react';
import { Calendar } from '../../components/Calendar';
import { VisionSidebar } from './components/VisionSidebar';
import { Input } from '../../components/ui/input';
import { AiChat } from '../../components/AiChat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

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
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{add?: string, edit?: {[key: number]: string}}>({});
  
  // Consistent date formatting function (local time, YYYY-MM-DD)
  const formatDateKeyLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate availability status map for calendar (must be at top level, not in switch)
  const availabilityStatusMap = useMemo(() => {
    const map = new Map<string, 'OFF' | 'PARTIAL' | 'FULL'>();
    const slotsByDate = new Map<string, any[]>();
    
    availability.forEach(av => {
      // Ensure date key is in YYYY-MM-DD format (normalize from backend)
      let dateKey = av.date;
      // If date comes in different format, normalize it
      if (dateKey.includes('T')) {
        dateKey = dateKey.split('T')[0];
      }
      // Ensure it's YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        // Try to parse and reformat
        const parsed = new Date(dateKey);
        if (!isNaN(parsed.getTime())) {
          dateKey = formatDateKeyLocal(parsed);
        }
      }
      
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey)!.push(av);
    });
    
    slotsByDate.forEach((slots, dateKey) => {
      if (slots.length === 0) {
        map.set(dateKey, 'OFF');
      } else {
        // Calculate total hours
        let totalMinutes = 0;
        slots.forEach(slot => {
          const start = slot.startTime.split(':').map(Number);
          const end = slot.endTime.split(':').map(Number);
          const startMin = start[0] * 60 + start[1];
          const endMin = end[0] * 60 + end[1];
          totalMinutes += (endMin - startMin);
        });
        const totalHours = totalMinutes / 60;
        // Consider full day if >= 7 hours, partial if >= 2 hours
        map.set(dateKey, totalHours >= 7 ? 'FULL' : totalHours >= 2 ? 'PARTIAL' : 'OFF');
      }
    });
    
    return map;
  }, [availability]);

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
        // Validation helper functions
        const timeToMinutes = (time: string): number => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        const isValidRange = (start: string, end: string): boolean => {
          return timeToMinutes(end) > timeToMinutes(start);
        };

        const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
          const aStartMin = timeToMinutes(aStart);
          const aEndMin = timeToMinutes(aEnd);
          const bStartMin = timeToMinutes(bStart);
          const bEndMin = timeToMinutes(bEnd);
          return aStartMin < bEndMin && bStartMin < aEndMin;
        };

        const findOverlappingSlot = (start: string, end: string, excludeIndex?: number): number | null => {
          for (let i = 0; i < timeSlots.length; i++) {
            if (excludeIndex !== undefined && i === excludeIndex) continue;
            if (overlaps(start, end, timeSlots[i].startTime, timeSlots[i].endTime)) {
              return i;
            }
          }
          return null;
        };

        const isDuplicate = (start: string, end: string, excludeIndex?: number): boolean => {
          for (let i = 0; i < timeSlots.length; i++) {
            if (excludeIndex !== undefined && i === excludeIndex) continue;
            if (timeSlots[i].startTime === start && timeSlots[i].endTime === end) {
              return true;
            }
          }
          return false;
        };

        const validateSlot = (start: string, end: string, excludeIndex?: number): string | null => {
          if (!isValidRange(start, end)) {
            return 'Ora de final trebuie să fie după ora de început.';
          }
          if (isDuplicate(start, end, excludeIndex)) {
            return 'Acest interval există deja.';
          }
          const overlapIndex = findOverlappingSlot(start, end, excludeIndex);
          if (overlapIndex !== null) {
            const overlapping = timeSlots[overlapIndex];
            return `Intervalul se suprapune cu ${overlapping.startTime}–${overlapping.endTime}. Alege alt interval.`;
          }
          return null;
        };

        // Toast notification helper
        const showToast = (message: string) => {
          setToastMessage(message);
          setTimeout(() => setToastMessage(null), 3000);
        };

        const handleDateSelect = (date: Date) => {
          setSelectedDate(date);
          setEditingSlotIndex(null);
          setShowAddSlot(false);
          setValidationErrors({});
          const dateStr = formatDateKeyLocal(date);
          // Check if there's existing availability for this date
          const existingSlots = availability.filter(av => {
            let avDate = av.date;
            if (avDate.includes('T')) avDate = avDate.split('T')[0];
            return avDate === dateStr;
          });
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
          if (!newSlotStart || !newSlotEnd) return;
          const error = validateSlot(newSlotStart, newSlotEnd);
          if (error) {
            setValidationErrors({ add: error });
            return;
          }
          setValidationErrors({});
          setTimeSlots([...timeSlots, { startTime: newSlotStart, endTime: newSlotEnd }]);
          setNewSlotStart('09:00');
          setNewSlotEnd('10:00');
          setShowAddSlot(false);
        };

        const removeTimeSlot = (index: number) => {
          setTimeSlots(timeSlots.filter((_, i) => i !== index));
          setEditingSlotIndex(null);
        };

        const updateTimeSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
          const updated = [...timeSlots];
          updated[index] = { ...updated[index], [field]: value };
          const slot = updated[index];
          const error = validateSlot(slot.startTime, slot.endTime, index);
          setValidationErrors(prev => {
            const newEdit = { ...(prev.edit || {}) };
            if (error) {
              newEdit[index] = error;
            } else {
              delete newEdit[index];
            }
            return { ...prev, edit: Object.keys(newEdit).length > 0 ? newEdit : undefined };
          });
          setTimeSlots(updated);
        };

        const startEditSlot = (index: number) => {
          setEditingSlotIndex(index);
          setShowAddSlot(false);
        };

        const saveEditSlot = (index: number) => {
          const slot = timeSlots[index];
          const error = validateSlot(slot.startTime, slot.endTime, index);
          if (error) {
            setValidationErrors(prev => ({
              ...prev,
              edit: { ...prev.edit, [index]: error }
            }));
            return;
          }
          setValidationErrors(prev => {
            const newEdit = { ...prev.edit };
            delete newEdit[index];
            return { ...prev, edit: newEdit };
          });
          setEditingSlotIndex(null);
        };

        const cancelEdit = () => {
          setEditingSlotIndex(null);
          setShowAddSlot(false);
          // Reload slots for selected date
          if (selectedDate) {
            handleDateSelect(selectedDate);
          }
        };


        const applyToWeekdays = async () => {
          if (!selectedDate || timeSlots.length === 0) {
            showToast('Selectează o zi și adaugă sloturi mai întâi.');
            return;
          }
          
          const month = selectedDate.getMonth();
          const year = selectedDate.getFullYear();
          const monthName = selectedDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
          
          if (!confirm(`Aplici acest program la toate zilele lucrătoare (Lun–Vin) din ${monthName}?`)) {
            return;
          }
          
          // Get all weekdays (Mon-Fri ONLY, exclude weekends) in the current month
          const weekdays: Date[] = [];
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            // Only include Monday (1) through Friday (5), exclude Saturday (6) and Sunday (0)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              weekdays.push(date);
            }
          }
          
          if (weekdays.length === 0) {
            showToast('Nu există zile lucrătoare în această lună.');
            return;
          }
          
          // Validate slots don't overlap with each other
          const sortedSlots = [...timeSlots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
          for (let i = 0; i < sortedSlots.length - 1; i++) {
            if (overlaps(sortedSlots[i].startTime, sortedSlots[i].endTime, sortedSlots[i + 1].startTime, sortedSlots[i + 1].endTime)) {
              showToast('Sloturile se suprapun. Nu pot fi aplicate.');
              return;
            }
          }
          
          if (!user?.id) {
            showToast('Eroare: utilizator neidentificat.');
            return;
          }
          
          const doctorId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
          let appliedCount = 0;
          let skippedCount = 0;
          
          // Apply to each weekday (Mon-Fri ONLY)
          for (const weekday of weekdays) {
            // Use local date formatting to avoid timezone issues
            const dateStr = formatDateKeyLocal(weekday);
            
            // Double-check it's a weekday (shouldn't happen, but safety check)
            const dayOfWeek = weekday.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              // Skip weekends (shouldn't be in weekdays array, but extra safety)
              continue;
            }
            
            // Check existing slots for this date
            const existingSlots = availability.filter(av => {
              let avDate = av.date;
              if (avDate.includes('T')) avDate = avDate.split('T')[0];
              return avDate === dateStr;
            });
            const existingSlotsFormatted = existingSlots.map(av => ({
              startTime: av.startTime.substring(0, 5),
              endTime: av.endTime.substring(0, 5)
            }));
            
            // Check for overlaps
            let hasOverlap = false;
            for (const newSlot of timeSlots) {
              for (const existingSlot of existingSlotsFormatted) {
                if (overlaps(newSlot.startTime, newSlot.endTime, existingSlot.startTime, existingSlot.endTime)) {
                  hasOverlap = true;
                  break;
                }
              }
              if (hasOverlap) break;
            }
            
            if (hasOverlap) {
              skippedCount++;
              continue;
            }
            
            // Save slots for this date
            try {
              const requestBody = {
                date: dateStr,
                timeSlots: timeSlots.map(slot => ({
                  startTime: slot.startTime + ':00',
                  endTime: slot.endTime + ':00'
                }))
              };
              
              const response = await fetch(`http://localhost:8080/api/availability/doctor/${doctorId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
              });
              
              if (response.status >= 200 && response.status < 300) {
                appliedCount++;
              } else {
                skippedCount++;
              }
            } catch (error) {
              skippedCount++;
            }
          }
          
          // Refresh availability
          try {
            const updatedAvailability = await fetch(`http://localhost:8080/api/availability/doctor/${doctorId}`)
              .then(res => res.json());
            setAvailability(updatedAvailability);
          } catch (error) {
            console.error('Error refreshing availability:', error);
          }
          
          if (skippedCount > 0) {
            showToast(`Aplicat la ${appliedCount} zile. ${skippedCount} zile au fost sărite din cauza suprapunerilor.`);
          } else {
            showToast(`Aplicat cu succes la ${appliedCount} zile lucrătoare (Lun–Vin).`);
          }
        };

        // Calculate summary for selected date
        const calculateSummary = () => {
          if (timeSlots.length === 0) return { totalHours: 0, slotCount: 0 };
          let totalMinutes = 0;
          timeSlots.forEach(slot => {
            const start = slot.startTime.split(':').map(Number);
            const end = slot.endTime.split(':').map(Number);
            const startMin = start[0] * 60 + start[1];
            const endMin = end[0] * 60 + end[1];
            totalMinutes += (endMin - startMin);
          });
          return {
            totalHours: (totalMinutes / 60).toFixed(1),
            slotCount: timeSlots.length
          };
        };

        const summary = calculateSummary();

        // Generate time options with 15/30 min increments
        const generateTimeOptions = () => {
          const options = [];
          for (let hour = 0; hour < 24; hour++) {
            for (let min of [0, 15, 30, 45]) {
              const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
              options.push(timeStr);
            }
          }
          return options;
        };

        const timeOptions = generateTimeOptions();

        const saveAvailability = async () => {
          if (!selectedDate || !user?.id) {
            showToast('Selectează o zi mai întâi.');
            return;
          }
          
          if (timeSlots.length === 0) {
            showToast('Adaugă cel puțin un interval de timp.');
            return;
          }
          
          // Final validation: check all slots are valid and don't overlap
          const sortedSlots = [...timeSlots].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
          const validatedSlots: Array<{startTime: string, endTime: string}> = [];
          
          for (let i = 0; i < sortedSlots.length; i++) {
            const slot = sortedSlots[i];
            if (!slot.startTime || !slot.endTime) continue;
            
            // Validate range
            if (!isValidRange(slot.startTime, slot.endTime)) {
              showToast(`Slot invalid: ${slot.startTime}–${slot.endTime}. Ora de final trebuie să fie după ora de început.`);
              setSavingAvailability(false);
              return;
            }
            
            // Check for overlaps with already validated slots
            let hasOverlap = false;
            for (const validated of validatedSlots) {
              if (overlaps(slot.startTime, slot.endTime, validated.startTime, validated.endTime)) {
                hasOverlap = true;
                break;
              }
            }
            
            if (hasOverlap) {
              showToast(`Slot ${slot.startTime}–${slot.endTime} se suprapune cu alt slot.`);
              setSavingAvailability(false);
              return;
            }
            
            validatedSlots.push(slot);
          }
          
          if (validatedSlots.length === 0) {
            showToast('Nu există sloturi valide de salvat.');
            setSavingAvailability(false);
            return;
          }
          
          setSavingAvailability(true);
          try {
            const dateStr = formatDateKeyLocal(selectedDate);
            
            const requestBody = {
              date: dateStr,
              timeSlots: validatedSlots.map(slot => ({
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
                showToast('Disponibilitate salvată cu succes!');
              } catch (refreshError) {
                console.error('Error refreshing availability:', refreshError);
                showToast('Disponibilitate salvată cu succes! (Notă: Lista nu a putut fi actualizată)');
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
            showToast(`Eroare la salvare: ${error.message || 'Te rugăm să încerci din nou.'}`);
          } finally {
            setSavingAvailability(false);
          }
        };
        
        return (
          <div className="space-y-8">
            {/* Toast Notification */}
            {toastMessage && (
              <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
                <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent border border-purple-500/30 rounded-xl p-4 shadow-2xl shadow-purple-500/30 flex items-center gap-3 min-w-[300px]">
                  <CheckCircle2 className="w-5 h-5 text-purple-300 flex-shrink-0" />
                  <p className="text-white text-sm font-medium">{toastMessage}</p>
                  <button
                    onClick={() => setToastMessage(null)}
                    className="ml-auto text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
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
                    availabilityMap={availabilityStatusMap}
                  />
                  
                  {selectedDate && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold">
                            Availability for {selectedDate.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h3>
                          {timeSlots.length > 0 && (
                            <p className="text-purple-200/60 text-sm mt-1">
                              Total hours: <span className="text-purple-200 font-semibold">{summary.totalHours}h</span> • 
                              Slots: <span className="text-purple-200 font-semibold">{summary.slotCount}</span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setShowAddSlot(!showAddSlot);
                            setEditingSlotIndex(null);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-lg flex items-center gap-1.5 text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                          Add Slot
                        </button>
                      </div>

                      {/* Add Slot Editor */}
                      {showAddSlot && (
                        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 p-4 rounded-xl space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <label className="text-purple-200/70 text-xs mb-1 block font-medium">Start Time</label>
                              <Select value={newSlotStart} onValueChange={setNewSlotStart}>
                                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1">
                              <label className="text-purple-200/70 text-xs mb-1 block font-medium">End Time</label>
                              <Select value={newSlotEnd} onValueChange={(value) => {
                                setNewSlotEnd(value);
                                const error = validateSlot(newSlotStart, value);
                                setValidationErrors({ add: error || undefined });
                              }}>
                                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeOptions.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {validationErrors.add && (
                                <p className="text-red-400 text-xs mt-1">{validationErrors.add}</p>
                              )}
                            </div>
                            <div className="flex items-end gap-2 pt-6">
                              <button
                                onClick={addTimeSlot}
                                disabled={!!validationErrors.add || !isValidRange(newSlotStart, newSlotEnd)}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddSlot(false);
                                  setValidationErrors({});
                                }}
                                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-sm font-semibold transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Visual Time Blocks */}
                      <div className="space-y-2">
                        {timeSlots.map((slot, index) => (
                          editingSlotIndex === index ? (
                            <div key={index} className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 p-4 rounded-xl space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-1">
                                  <label className="text-purple-200/70 text-xs mb-1 block font-medium">Start Time</label>
                                  <Select 
                                    value={slot.startTime} 
                                    onValueChange={(value) => updateTimeSlot(index, 'startTime', value)}
                                  >
                                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {timeOptions.map(time => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex-1">
                                  <label className="text-purple-200/70 text-xs mb-1 block font-medium">End Time</label>
                                  <Select 
                                    value={slot.endTime} 
                                    onValueChange={(value) => updateTimeSlot(index, 'endTime', value)}
                                  >
                                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {timeOptions.map(time => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {validationErrors.edit?.[index] && (
                                    <p className="text-red-400 text-xs mt-1">{validationErrors.edit[index]}</p>
                                  )}
                                </div>
                                <div className="flex items-end gap-2 pt-6">
                                  <button
                                    onClick={() => saveEditSlot(index)}
                                    disabled={!!validationErrors.edit?.[index]}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-sm font-semibold transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div key={index} className="group relative backdrop-blur-xl bg-gradient-to-br from-white/8 via-white/5 to-transparent border border-white/10 hover:border-purple-500/30 p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-purple-600"></div>
                                  <span className="text-white font-semibold text-base">
                                    {slot.startTime} – {slot.endTime}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEditSlot(index)}
                                    className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-300 transition-all"
                                    title="Edit slot"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => removeTimeSlot(index)}
                                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                                    title="Delete slot"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                        {timeSlots.length === 0 && !showAddSlot && (
                          <div className="text-center py-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl">
                            <Clock className="w-8 h-8 text-purple-300/50 mx-auto mb-2" />
                            <p className="text-purple-200/70 text-sm font-medium">
                              No time slots set. Click "Add Slot" to add availability.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Weekly Convenience Actions */}
                      {timeSlots.length > 0 && (
                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          <button
                            onClick={applyToWeekdays}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/10 text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all"
                            title="Apply to all weekdays (Mon–Fri) in current month"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            Apply to Mon–Fri
                          </button>
                        </div>
                      )}
                      
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
                      <div className="text-center py-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl">
                        <CalendarIcon className="w-12 h-12 text-purple-300/50 mx-auto mb-3" />
                        <p className="text-purple-200/70 text-sm font-medium mb-1">
                          No upcoming appointments
                        </p>
                        <p className="text-purple-200/50 text-xs">
                          Appointments booked by patients will appear here.
                        </p>
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

