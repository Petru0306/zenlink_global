package com.zenlink.zenlink.dto;

import com.zenlink.zenlink.model.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PsychProfileResponse {
    private boolean completed;
    private Temperament temperament;
    private AnxietyLevel anxietyLevel;
    private Integer anxietyScore;
    private ControlNeed controlNeed;
    private Integer controlScore;
    private CommunicationStyle communicationStyle;
    private ProcedurePreference procedurePreference;
    private List<String> triggers;
    private String notes;
    private String resultsSheet;
    private Instant completedAt;
    private Instant updatedAt;
    private Map<String, Object> answers;
}

