package com.zenlink.zenlink.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateAppointmentRequest {
    private Long doctorId;
    private LocalDate date;
    private LocalTime time;
}

