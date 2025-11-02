import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Appointment {
  id: string;
  doctorId: number;
  doctorName: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: string;
  notes?: string;
}

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  getAppointmentsByDoctor: (doctorId: number) => Appointment[];
  getAvailableTimeSlots: (doctorId: number, date: string) => string[];
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

interface AppointmentProviderProps {
  children: ReactNode;
}

export const AppointmentProvider: React.FC<AppointmentProviderProps> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Load appointments from localStorage on mount
  useEffect(() => {
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      try {
        const parsedAppointments = JSON.parse(storedAppointments);
        setAppointments(parsedAppointments);
      } catch (error) {
        console.error('Error parsing stored appointments:', error);
        localStorage.removeItem('appointments');
      }
    }
  }, []);

  // Save appointments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }, [appointments]);

  const addAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setAppointments((prev) => [...prev, newAppointment]);
    return newAppointment;
  };

  const updateAppointmentStatus = (appointmentId: string, status: Appointment['status']) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
    );
  };

  const getAppointmentsByDoctor = (doctorId: number): Appointment[] => {
    return appointments.filter((apt) => apt.doctorId === doctorId);
  };

  const getAvailableTimeSlots = (doctorId: number, date: string): string[] => {
    // Standard working hours: 9:00 - 17:00, 30-minute slots
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Filter out already booked slots for this doctor and date
    const bookedSlots = appointments
      .filter(
        (apt) =>
          apt.doctorId === doctorId &&
          apt.date === date &&
          apt.status !== 'cancelled'
      )
      .map((apt) => apt.time);

    return allSlots.filter((slot) => !bookedSlots.includes(slot));
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        addAppointment,
        updateAppointmentStatus,
        getAppointmentsByDoctor,
        getAvailableTimeSlots,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

