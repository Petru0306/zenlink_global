import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  unavailableDates?: string[]; // Array of dates in YYYY-MM-DD format
  availabilityMap?: Map<string, 'OFF' | 'PARTIAL' | 'FULL'>; // Map of date keys to availability status
}

export function Calendar({ selectedDate, onDateSelect, unavailableDates = [], availabilityMap }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];

  const dayNames = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isDateUnavailable = (date: Date) => {
    const dateKey = formatDateKey(date);
    return unavailableDates.includes(dateKey);
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDatePast(date) && !isDateUnavailable(date)) {
      onDateSelect(date);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border border-[#2d4a7c] rounded-3xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-[#2d4a7c] transition-colors text-[#a3aed0] hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-white text-xl font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-[#2d4a7c] transition-colors text-[#a3aed0] hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-[#6b7bb5] text-sm font-semibold py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const dateKey = formatDateKey(date);
          const isPast = isDatePast(date);
          const isUnavailable = isDateUnavailable(date);
          const isSelectedDate = isSelected(date);
          const isToday =
            dateKey ===
            `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
          
          // Get availability status for this date
          const availabilityStatus = availabilityMap?.get(dateKey);
          const hasAvailability = availabilityStatus && availabilityStatus !== 'OFF';

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isPast || isUnavailable}
              className={`
                aspect-square rounded-xl font-semibold transition-all relative
                ${isSelectedDate
                  ? 'bg-gradient-to-br from-[#5B8DEF] to-[#4169E1] text-white shadow-lg shadow-blue-500/30 scale-105'
                  : isPast || isUnavailable
                  ? 'bg-[#0f1f3d] text-[#4a5a7c] cursor-not-allowed opacity-50'
                  : 'bg-[#2d4a7c] text-white hover:bg-[#3d5a8c] hover:scale-105 cursor-pointer'
                }
                ${isToday && !isSelectedDate ? 'ring-2 ring-blue-500/50' : ''}
              `}
            >
              {day}
              {/* Availability indicator dot - purple for any availability */}
              {!isPast && !isUnavailable && hasAvailability && (
                <div className="absolute bottom-1 right-1">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-sm" />
                </div>
              )}
              {/* Status indicator (for FULL/PARTIAL/OFF) - shown at bottom center */}
              {!isPast && !isUnavailable && availabilityStatus && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className={`w-1 h-1 rounded-full ${
                    availabilityStatus === 'FULL' 
                      ? 'bg-green-400' 
                      : availabilityStatus === 'PARTIAL' 
                      ? 'bg-yellow-400' 
                      : 'bg-transparent'
                  }`} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-[#2d4a7c] flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#5B8DEF] to-[#4169E1]"></div>
          <span className="text-[#a3aed0]">Selectat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#2d4a7c]"></div>
          <span className="text-[#a3aed0]">Disponibil</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#0f1f3d] opacity-50"></div>
          <span className="text-[#a3aed0]">Indisponibil</span>
        </div>
      </div>
    </div>
  );
}

