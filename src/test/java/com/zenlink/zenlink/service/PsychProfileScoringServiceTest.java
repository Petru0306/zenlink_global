package com.zenlink.zenlink.service;

import com.zenlink.zenlink.model.*;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PsychProfileScoringServiceTest {
    private final PsychProfileScoringService scoringService = new PsychProfileScoringService();

    @Test
    void lowAnxietySanguine() {
        Map<String, Object> answers = baseAnswers();
        answers.put("q1", "relaxed");
        answers.put("q2", "no");
        answers.put("q4", "tolerate well");
        answers.put("q8", List.of("sociable adapt easily"));

        var normalized = scoringService.validateAndNormalize(answers);
        var score = scoringService.score(normalized);

        assertEquals(0, score.anxietyScore());
        assertEquals(AnxietyLevel.LOW, score.anxietyLevel());
        assertEquals(Temperament.SANGUINE, score.temperament());
    }

    @Test
    void highAnxietyTieBreaksToMelancholic() {
        Map<String, Object> answers = baseAnswers();
        answers.put("q1", "avoid visits");
        answers.put("q2", "traumatic");
        answers.put("q4", "panic stop");
        answers.put("q8", List.of("sociable adapt easily", "detail oriented worry easily"));

        var normalized = scoringService.validateAndNormalize(answers);
        var score = scoringService.score(normalized);

        assertEquals(AnxietyLevel.HIGH, score.anxietyLevel());
        assertEquals(Temperament.MELANCHOLIC, score.temperament());
    }

    @Test
    void highControlTieBreaksToCholeric() {
        Map<String, Object> answers = baseAnswers();
        answers.put("q3", List.of("lack of control"));
        answers.put("q7", "explain each step");
        answers.put("q10", "very important");
        answers.put("q8", List.of("sociable adapt easily", "like control want fast"));

        var normalized = scoringService.validateAndNormalize(answers);
        var score = scoringService.score(normalized);

        assertEquals(ControlNeed.HIGH, score.controlNeed());
        assertEquals(Temperament.CHOLERIC, score.temperament());
    }

    @Test
    void q11NoneMustBeOnlySelection() {
        Map<String, Object> answers = baseAnswers();
        answers.put("q11", List.of("none", "panic attacks"));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> scoringService.validateAndNormalize(answers)
        );
        assertTrue(ex.getMessage().toLowerCase().contains("none"));
    }

    @Test
    void q8MaxTwoSelections() {
        Map<String, Object> answers = baseAnswers();
        answers.put("q8", List.of(
                "sociable adapt easily",
                "like control want fast",
                "detail oriented worry easily"
        ));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> scoringService.validateAndNormalize(answers)
        );
        assertTrue(ex.getMessage().toLowerCase().contains("maximum"));
    }

    @Test
    void triggersExcludeNoneAndNothingSpecific() {
        Map<String, Object> answers = baseAnswers();
        answers.put("q3", List.of("pain", "nothing specific"));
        answers.put("q11", List.of("none"));

        var normalized = scoringService.validateAndNormalize(answers);
        var score = scoringService.score(normalized);

        assertEquals(List.of("pain"), score.triggers());
    }

    private Map<String, Object> baseAnswers() {
        Map<String, Object> answers = new HashMap<>();
        answers.put("q1", "slightly tense");
        answers.put("q2", "minor");
        answers.put("q3", List.of("pain"));
        answers.put("q4", "tense but cooperate");
        answers.put("q5", "stay calm");
        answers.put("q6", "calm encouraging");
        answers.put("q7", "only essentials");
        answers.put("q8", List.of("calm avoid conflicts"));
        answers.put("q9", "ask immediately");
        answers.put("q10", "important");
        answers.put("q11", List.of("panic attacks"));
        answers.put("q12", "");
        return answers;
    }
}

