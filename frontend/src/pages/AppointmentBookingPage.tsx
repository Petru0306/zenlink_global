import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Calendar } from '../components/Calendar';
import { getDoctorById } from '../data/mockData';
import { useAppointments } from '../context/AppointmentContext';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function AppointmentBookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addAppointment, getAvailableTimeSlots } = useAppointments();
  
  const doctorId = id ? parseInt(id, 10) : null;
  const doctor = doctorId ? getDoctorById(doctorId) : null;
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/authentication/sign-in', { state: { from: `/doctor/${id}/book` } });
    }
  }, [isAuthenticated, navigate, id]);

  useEffect(() => {
    if (selectedDate && doctorId) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const slots = getAvailableTimeSlots(doctorId, dateStr);
      setAvailableSlots(slots);
      setSelectedTime(null);
    }
  }, [selectedDate, doctorId, getAvailableTimeSlots]);

  if (!doctor || !doctorId) {
    return (
      <div className="min-h-screen bg-[#0b1437] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Doctor not found</h1>
          <Button onClick={() => navigate('/doctori')}>Back to Doctors</Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime || !user) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    
    addAppointment({
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: dateStr,
      time: selectedTime,
      status: 'upcoming',
    });

    setBookingSuccess(true);
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const formatDateDisplay = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('ro-RO', options);
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-[#0b1437] flex items-center justify-center">
        <Card className="p-12 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-white text-2xl font-semibold mb-4">Programare Confirmată!</h2>
          <p className="text-[#a3aed0] mb-6">
            Programarea ta cu {doctor.name} a fost confirmată pentru{' '}
            {selectedDate && formatDateDisplay(selectedDate)} la ora {selectedTime}
          </p>
          <p className="text-blue-400 text-sm">Redirecționare către dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1437]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate(`/doctor/${doctorId}`)}
          variant="outline"
          className="mb-6 bg-[#1a2f5c] border-[#2d4a7c] text-[#a3aed0] hover:text-white hover:border-blue-500 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi la Profilul Doctorului
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-transparent border-none">
              <div className="flex items-center gap-3 mb-6">
                <CalendarIcon className="w-6 h-6 text-blue-400" />
                <h1 className="text-white text-3xl font-bold">Programează-te</h1>
              </div>
              <p className="text-[#a3aed0] mb-8">
                Selectează data și ora pentru programarea ta cu {doctor.name}
              </p>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </Card>
          </div>

          {/* Right Column - Doctor Info & Time Slots */}
          <div className="space-y-6">
            {/* Doctor Card */}
            <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
              <div className="flex items-center gap-4 mb-4">
                {doctor.imageUrl ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#2d4a7c]">
                    <ImageWithFallback
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
                <div>
                  <h3 className="text-white font-semibold text-lg">{doctor.name}</h3>
                  <p className="text-blue-400 text-sm">{doctor.specialization}</p>
                </div>
              </div>
              {doctor.consultationFee && (
                <div className="pt-4 border-t border-[#2d4a7c]">
                  <p className="text-[#a3aed0] text-sm">Consult:</p>
                  <p className="text-white font-semibold">{doctor.consultationFee} RON</p>
                </div>
              )}
            </Card>

            {/* Selected Date Display */}
            {selectedDate && (
              <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">
                    {formatDateDisplay(selectedDate)}
                  </h3>
                </div>
                {availableSlots.length === 0 ? (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">Nu sunt sloturi disponibile în această zi</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[#a3aed0] text-sm mb-4">Selectează ora:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => handleTimeSelect(slot)}
                          className={`
                            py-3 px-4 rounded-xl font-semibold transition-all
                            ${selectedTime === slot
                              ? 'bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] text-white shadow-lg shadow-blue-500/30'
                              : 'bg-[#2d4a7c] text-white hover:bg-[#3d5a8c]'
                            }
                          `}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* Booking Button */}
            {selectedDate && selectedTime && (
              <Button
                onClick={handleBookAppointment}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl py-6 text-lg shadow-lg shadow-blue-500/30"
              >
                Confirmă Programarea
              </Button>
            )}

            {/* Instructions */}
            <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl">
              <h4 className="text-white font-semibold mb-3">Informații</h4>
              <ul className="space-y-2 text-sm text-[#a3aed0]">
                <li>• Programările sunt confirmate imediat</li>
                <li>• Poți anula cu minimum 24h înainte</li>
                <li>• Consultul durează aproximativ 30 minute</li>
                <li>• Vei primi un email de confirmare</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

