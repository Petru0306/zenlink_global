package com.zenlink.zenlink.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenlink.zenlink.dto.PsychProfileRequest;
import com.zenlink.zenlink.dto.PsychProfileResponse;
import com.zenlink.zenlink.model.PsychProfile;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.model.UserRole;
import com.zenlink.zenlink.repository.PsychProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PsychProfileService {
    @Autowired
    private PsychProfileRepository psychProfileRepository;

    @Autowired
    private PsychProfileScoringService scoringService;

    @Autowired
    private PsychProfileResultsSheetBuilder resultsSheetBuilder;

    @Autowired
    private ObjectMapper objectMapper;

    public PsychProfileResponse getProfile(User user) {
        ensurePatient(user);
        Optional<PsychProfile> profileOpt = psychProfileRepository.findByUser(user);
        if (profileOpt.isEmpty()) {
            return new PsychProfileResponse(false, null, null, null, null, null, null, null, null, null, null, null, null, null);
        }
        PsychProfile profile = profileOpt.get();
        return toResponse(profile, parseAnswers(profile.getAnswersJson()));
    }

    public PsychProfileResponse upsertProfile(User user, PsychProfileRequest request) {
        ensurePatient(user);
        PsychProfileScoringService.PsychProfileAnswers answers = scoringService.validateAndNormalize(request.getAnswers());
        PsychProfileScoringService.PsychProfileScore score = scoringService.score(answers);

        String answersJson = writeJson(scoringService.toAnswerMap(answers));
        String triggersJson = writeJson(score.triggers());
        String resultsSheet = resultsSheetBuilder.build(score, answers);

        PsychProfile profile = psychProfileRepository.findByUser(user).orElseGet(PsychProfile::new);
        profile.setUser(user);
        profile.setAnswersJson(answersJson);
        profile.setTemperament(score.temperament());
        profile.setAnxietyLevel(score.anxietyLevel());
        profile.setAnxietyScore(score.anxietyScore());
        profile.setControlNeed(score.controlNeed());
        profile.setControlScore(score.controlScore());
        profile.setCommunicationStyle(score.communicationStyle());
        profile.setProcedurePreference(score.procedurePreference());
        profile.setTriggersJson(triggersJson);
        profile.setNotes(answers.q12());
        profile.setResultsSheet(resultsSheet);
        profile.setCompletedAt(Instant.now());
        profile.setUpdatedAt(Instant.now());

        PsychProfile saved = psychProfileRepository.save(profile);
        return toResponse(saved, scoringService.toAnswerMap(answers));
    }

    private PsychProfileResponse toResponse(PsychProfile profile, Map<String, Object> answers) {
        List<String> triggers = parseTriggers(profile.getTriggersJson());
        return new PsychProfileResponse(
                true,
                profile.getTemperament(),
                profile.getAnxietyLevel(),
                profile.getAnxietyScore(),
                profile.getControlNeed(),
                profile.getControlScore(),
                profile.getCommunicationStyle(),
                profile.getProcedurePreference(),
                triggers,
                profile.getNotes(),
                profile.getResultsSheet(),
                profile.getCompletedAt(),
                profile.getUpdatedAt(),
                answers
        );
    }

    private Map<String, Object> parseAnswers(String answersJson) {
        if (answersJson == null || answersJson.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(answersJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private List<String> parseTriggers(String triggersJson) {
        if (triggersJson == null || triggersJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(triggersJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize psych profile");
        }
    }

    private void ensurePatient(User user) {
        if (user.getRole() != UserRole.PATIENT) {
            throw new RuntimeException("Psych profile is only available for patients");
        }
    }
}

