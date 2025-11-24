package com.zenlink.zenlink.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class AvailabilityRequest {
    private LocalDate date;
    private List<TimeSlot> timeSlots;
    
    @Data
    public static class TimeSlot {
        private LocalTime startTime;
        private LocalTime endTime;
    }
}

