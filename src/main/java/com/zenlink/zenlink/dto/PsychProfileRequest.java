package com.zenlink.zenlink.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PsychProfileRequest {
    @NotNull(message = "answers are required")
    private Map<String, Object> answers;
}

