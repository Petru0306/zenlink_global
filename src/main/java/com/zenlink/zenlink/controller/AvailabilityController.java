package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.AvailabilityRequest;
import com.zenlink.zenlink.dto.AvailabilityResponse;
import com.zenlink.zenlink.model.DoctorAvailability;
import com.zenlink.zenlink.repository.AppointmentRepository;
import com.zenlink.zenlink.repository.DoctorAvailabilityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/availability")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AvailabilityController {

    @Autowired
    private DoctorAvailabilityRepository availabilityRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    /**
     * Get all availability for a doctor
     */
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AvailabilityResponse>> getDoctorAvailability(@PathVariable Long doctorId) {
        List<DoctorAvailability> availability = availabilityRepository.findByDoctorIdAndIsAvailableTrue(doctorId);
        List<AvailabilityResponse> response = availability.stream()
                .map(av -> new AvailabilityResponse(
                        av.getId(),
                        av.getDate(),
                        av.getStartTime(),
                        av.getEndTime(),
                        av.getIsAvailable()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Get availability for a specific date - generates 30-minute slots from intervals
     * and excludes already booked times
     */
    @GetMapping("/doctor/{doctorId}/date/{date}")
    public ResponseEntity<List<AvailabilityResponse>> getAvailabilityByDate(
            @PathVariable Long doctorId,
            @PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        
        // Get availability intervals for this date
        List<DoctorAvailability> availability = availabilityRepository
                .findByDoctorIdAndDateAndIsAvailableTrue(doctorId, localDate);
        
        // Get already booked appointments for this date
        Set<LocalTime> bookedTimes = appointmentRepository
                .findByDoctorIdAndDate(doctorId, localDate)
                .stream()
                .map(apt -> apt.getTime())
                .collect(Collectors.toSet());
        
        // Generate 30-minute slots from intervals
        List<AvailabilityResponse> slots = new ArrayList<>();
        for (DoctorAvailability av : availability) {
            LocalTime start = av.getStartTime();
            LocalTime end = av.getEndTime();
            
            // Generate slots every 30 minutes
            LocalTime current = start;
            while (current.isBefore(end) || current.equals(end)) {
                LocalTime slotEnd = current.plusMinutes(30);
                if (slotEnd.isAfter(end)) {
                    break;
                }
                
                // Only add slot if not already booked
                if (!bookedTimes.contains(current)) {
                    slots.add(new AvailabilityResponse(
                            null, // No ID for generated slots
                            localDate,
                            current,
                            slotEnd,
                            true
                    ));
                }
                
                current = current.plusMinutes(30);
            }
        }
        
        return ResponseEntity.ok(slots);
    }

    /**
     * Set availability for a doctor (replaces existing for that date)
     */
    @PostMapping("/doctor/{doctorId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> setAvailability(
            @PathVariable Long doctorId,
            @RequestBody AvailabilityRequest request) {
        try {
            System.out.println("=== SET AVAILABILITY ===");
            System.out.println("Doctor ID: " + doctorId);
            System.out.println("Date: " + request.getDate());
            System.out.println("Time slots: " + (request.getTimeSlots() != null ? request.getTimeSlots().size() : 0));
            
            if (request.getDate() == null) {
                return ResponseEntity.badRequest().body("Date is required");
            }
            
            // Delete existing availability for this date
            try {
                availabilityRepository.deleteByDoctorIdAndDate(doctorId, request.getDate());
                System.out.println("Deleted existing availability for date: " + request.getDate());
            } catch (Exception e) {
                System.out.println("No existing availability to delete or error: " + e.getMessage());
                // Continue anyway - might be first time setting availability
            }

            // Create new availability slots
            if (request.getTimeSlots() != null && !request.getTimeSlots().isEmpty()) {
                for (AvailabilityRequest.TimeSlot slot : request.getTimeSlots()) {
                    System.out.println("Creating slot: " + slot.getStartTime() + " - " + slot.getEndTime());
                    DoctorAvailability availability = new DoctorAvailability();
                    availability.setDoctorId(doctorId);
                    availability.setDate(request.getDate());
                    availability.setStartTime(slot.getStartTime());
                    availability.setEndTime(slot.getEndTime());
                    availability.setIsAvailable(true);
                    availabilityRepository.save(availability);
                }
                System.out.println("Created " + request.getTimeSlots().size() + " availability slots");
            } else {
                System.out.println("No time slots provided - cleared availability for this date");
            }

            System.out.println("Availability saved successfully");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("Error saving availability: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error saving availability: " + e.getMessage());
        }
    }

    /**
     * Delete availability slot
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAvailability(@PathVariable Long id) {
        availabilityRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

