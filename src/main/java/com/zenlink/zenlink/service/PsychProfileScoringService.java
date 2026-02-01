package com.zenlink.zenlink.service;

import com.zenlink.zenlink.model.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PsychProfileScoringService {
    private static final Set<String> Q1_OPTIONS = Set.of(
            "relaxed",
            "slightly tense",
            "anxious",
            "very anxious",
            "avoid visits"
    );
    private static final Set<String> Q2_OPTIONS = Set.of(
            "no",
            "minor",
            "significant",
            "traumatic"
    );
    private static final Set<String> Q3_OPTIONS = Set.of(
            "pain",
            "sounds tools",
            "lack of control",
            "anesthesia",
            "time in chair",
            "nothing specific"
    );
    private static final Set<String> Q4_OPTIONS = Set.of(
            "tolerate well",
            "tense but cooperate",
            "restless need breaks",
            "panic stop"
    );
    private static final Set<String> Q5_OPTIONS = Set.of(
            "stay calm",
            "irritated impatient",
            "worry catastrophize",
            "withdraw avoid"
    );
    private static final Set<String> Q6_OPTIONS = Set.of(
            "direct short",
            "calm encouraging",
            "detailed explanations",
            "minimal necessary"
    );
    private static final Set<String> Q7_OPTIONS = Set.of(
            "explain each step",
            "only essentials",
            "constant check-ins",
            "fast no talking"
    );
    private static final Set<String> Q8_OPTIONS = Set.of(
            "sociable adapt easily",
            "like control want fast",
            "detail oriented worry easily",
            "calm avoid conflicts"
    );
    private static final Set<String> Q9_OPTIONS = Set.of(
            "ask immediately",
            "wait for explanation",
            "become uneasy",
            "prefer not ask"
    );
    private static final Set<String> Q10_OPTIONS = Set.of(
            "low importance",
            "important",
            "very important"
    );
    private static final Set<String> Q11_OPTIONS = Set.of(
            "panic attacks",
            "needle blood fear",
            "anesthesia adverse reactions",
            "fainting in medical contexts",
            "none"
    );

    public PsychProfileAnswers validateAndNormalize(Map<String, Object> answers) {
        if (answers == null || answers.isEmpty()) {
            throw new IllegalArgumentException("answers are required");
        }

        String q1 = requireOption(answers, "q1", Q1_OPTIONS);
        String q2 = requireOption(answers, "q2", Q2_OPTIONS);
        List<String> q3 = requireMulti(answers, "q3", Q3_OPTIONS);
        String q4 = requireOption(answers, "q4", Q4_OPTIONS);
        String q5 = requireOption(answers, "q5", Q5_OPTIONS);
        String q6 = requireOption(answers, "q6", Q6_OPTIONS);
        String q7 = requireOption(answers, "q7", Q7_OPTIONS);
        List<String> q8 = requireMulti(answers, "q8", Q8_OPTIONS);
        String q9 = requireOption(answers, "q9", Q9_OPTIONS);
        String q10 = requireOption(answers, "q10", Q10_OPTIONS);
        List<String> q11 = requireMulti(answers, "q11", Q11_OPTIONS);
        String q12 = optionalText(answers, "q12", 500);

        if (q8.size() > 2) {
            throw new IllegalArgumentException("Q8 allows a maximum of 2 selections");
        }
        if (q11.contains("none") && q11.size() > 1) {
            throw new IllegalArgumentException("Q11 'none' must be the only selection");
        }

        return new PsychProfileAnswers(q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12);
    }

    public PsychProfileScore score(PsychProfileAnswers answers) {
        int anxietyScore = scoreAnxiety(answers);
        AnxietyLevel anxietyLevel = anxietyLevel(anxietyScore);

        int controlScore = scoreControl(answers);
        ControlNeed controlNeed = controlNeed(controlScore);

        CommunicationStyle communicationStyle = mapCommunicationStyle(answers.q6());
        ProcedurePreference procedurePreference = mapProcedurePreference(answers.q7());

        Temperament temperament = scoreTemperament(
                answers.q8(),
                anxietyLevel,
                controlNeed,
                communicationStyle
        );

        List<String> triggers = extractTriggers(answers.q3(), answers.q11());

        return new PsychProfileScore(
                temperament,
                anxietyLevel,
                anxietyScore,
                controlNeed,
                controlScore,
                communicationStyle,
                procedurePreference,
                triggers
        );
    }

    public Map<String, Object> toAnswerMap(PsychProfileAnswers answers) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("q1", answers.q1());
        map.put("q2", answers.q2());
        map.put("q3", answers.q3());
        map.put("q4", answers.q4());
        map.put("q5", answers.q5());
        map.put("q6", answers.q6());
        map.put("q7", answers.q7());
        map.put("q8", answers.q8());
        map.put("q9", answers.q9());
        map.put("q10", answers.q10());
        map.put("q11", answers.q11());
        map.put("q12", answers.q12());
        return map;
    }

    private int scoreAnxiety(PsychProfileAnswers answers) {
        int q1 = switch (answers.q1()) {
            case "relaxed" -> 0;
            case "slightly tense" -> 1;
            case "anxious" -> 2;
            case "very anxious" -> 3;
            case "avoid visits" -> 4;
            default -> 0;
        };
        int q4 = switch (answers.q4()) {
            case "tolerate well" -> 0;
            case "tense but cooperate" -> 1;
            case "restless need breaks" -> 2;
            case "panic stop" -> 3;
            default -> 0;
        };
        int q2 = switch (answers.q2()) {
            case "no" -> 0;
            case "minor" -> 1;
            case "significant" -> 2;
            case "traumatic" -> 3;
            default -> 0;
        };
        return q1 + q2 + q4;
    }

    private AnxietyLevel anxietyLevel(int score) {
        if (score <= 2) return AnxietyLevel.LOW;
        if (score <= 6) return AnxietyLevel.MEDIUM;
        return AnxietyLevel.HIGH;
    }

    private int scoreControl(PsychProfileAnswers answers) {
        int score = switch (answers.q10()) {
            case "low importance" -> 0;
            case "important" -> 1;
            case "very important" -> 2;
            default -> 0;
        };
        if (answers.q3().contains("lack of control")) {
            score += 1;
        }
        if ("explain each step".equals(answers.q7())) {
            score += 1;
        }
        return score;
    }

    private ControlNeed controlNeed(int score) {
        if (score <= 1) return ControlNeed.LOW;
        if (score <= 3) return ControlNeed.MEDIUM;
        return ControlNeed.HIGH;
    }

    private CommunicationStyle mapCommunicationStyle(String q6) {
        return switch (q6) {
            case "direct short" -> CommunicationStyle.DIRECT_SHORT;
            case "calm encouraging" -> CommunicationStyle.CALM_ENCOURAGING;
            case "detailed explanations" -> CommunicationStyle.DETAILED_EXPLANATIONS;
            case "minimal necessary" -> CommunicationStyle.MINIMAL_NECESSARY;
            default -> CommunicationStyle.CALM_ENCOURAGING;
        };
    }

    private ProcedurePreference mapProcedurePreference(String q7) {
        return switch (q7) {
            case "explain each step" -> ProcedurePreference.EXPLAIN_EACH_STEP;
            case "only essentials" -> ProcedurePreference.ONLY_ESSENTIALS;
            case "constant check-ins" -> ProcedurePreference.CONSTANT_CHECKINS;
            case "fast no talking" -> ProcedurePreference.FAST_NO_TALKING;
            default -> ProcedurePreference.EXPLAIN_EACH_STEP;
        };
    }

    private Temperament scoreTemperament(
            List<String> q8Selections,
            AnxietyLevel anxietyLevel,
            ControlNeed controlNeed,
            CommunicationStyle communicationStyle
    ) {
        Map<Temperament, Integer> counts = new EnumMap<>(Temperament.class);
        for (Temperament t : Temperament.values()) {
            counts.put(t, 0);
        }
        if (q8Selections.contains("sociable adapt easily")) {
            counts.put(Temperament.SANGUINE, counts.get(Temperament.SANGUINE) + 1);
        }
        if (q8Selections.contains("like control want fast")) {
            counts.put(Temperament.CHOLERIC, counts.get(Temperament.CHOLERIC) + 1);
        }
        if (q8Selections.contains("detail oriented worry easily")) {
            counts.put(Temperament.MELANCHOLIC, counts.get(Temperament.MELANCHOLIC) + 1);
        }
        if (q8Selections.contains("calm avoid conflicts")) {
            counts.put(Temperament.PHLEGMATIC, counts.get(Temperament.PHLEGMATIC) + 1);
        }

        int max = counts.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        List<Temperament> tied = new ArrayList<>();
        for (var entry : counts.entrySet()) {
            if (entry.getValue() == max) {
                tied.add(entry.getKey());
            }
        }

        if (tied.size() == 1) {
            return tied.get(0);
        }

        if (anxietyLevel == AnxietyLevel.HIGH && tied.contains(Temperament.MELANCHOLIC)) {
            return Temperament.MELANCHOLIC;
        }
        if (controlNeed == ControlNeed.HIGH && tied.contains(Temperament.CHOLERIC)) {
            return Temperament.CHOLERIC;
        }
        if (communicationStyle == CommunicationStyle.CALM_ENCOURAGING && tied.contains(Temperament.PHLEGMATIC)) {
            return Temperament.PHLEGMATIC;
        }
        if (tied.contains(Temperament.SANGUINE)) {
            return Temperament.SANGUINE;
        }

        return tied.get(0);
    }

    private List<String> extractTriggers(List<String> q3, List<String> q11) {
        LinkedHashSet<String> triggers = new LinkedHashSet<>();
        for (String option : q3) {
            if (!"nothing specific".equals(option)) {
                triggers.add(option);
            }
        }
        for (String option : q11) {
            if (!"none".equals(option)) {
                triggers.add(option);
            }
        }
        return new ArrayList<>(triggers);
    }

    private String requireOption(Map<String, Object> answers, String key, Set<String> allowed) {
        Object raw = answers.get(key);
        if (!(raw instanceof String)) {
            throw new IllegalArgumentException("Missing or invalid " + key);
        }
        String value = normalize((String) raw);
        if (value.isEmpty() || !allowed.contains(value)) {
            throw new IllegalArgumentException("Invalid value for " + key);
        }
        return value;
    }

    private List<String> requireMulti(Map<String, Object> answers, String key, Set<String> allowed) {
        Object raw = answers.get(key);
        if (!(raw instanceof List<?> list)) {
            throw new IllegalArgumentException("Missing or invalid " + key);
        }
        List<String> values = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof String)) {
                throw new IllegalArgumentException("Invalid value for " + key);
            }
            String normalized = normalize((String) item);
            if (normalized.isEmpty() || !allowed.contains(normalized)) {
                throw new IllegalArgumentException("Invalid value for " + key);
            }
            if (!values.contains(normalized)) {
                values.add(normalized);
            }
        }
        if (values.isEmpty()) {
            throw new IllegalArgumentException("Missing or invalid " + key);
        }
        return values;
    }

    private String optionalText(Map<String, Object> answers, String key, int maxLen) {
        Object raw = answers.get(key);
        if (raw == null) {
            return "";
        }
        if (!(raw instanceof String)) {
            throw new IllegalArgumentException("Invalid value for " + key);
        }
        String value = ((String) raw).trim();
        if (value.length() > maxLen) {
            throw new IllegalArgumentException("Q12 must be at most " + maxLen + " characters");
        }
        return value;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    public record PsychProfileAnswers(
            String q1,
            String q2,
            List<String> q3,
            String q4,
            String q5,
            String q6,
            String q7,
            List<String> q8,
            String q9,
            String q10,
            List<String> q11,
            String q12
    ) {}

    public record PsychProfileScore(
            Temperament temperament,
            AnxietyLevel anxietyLevel,
            int anxietyScore,
            ControlNeed controlNeed,
            int controlScore,
            CommunicationStyle communicationStyle,
            ProcedurePreference procedurePreference,
            List<String> triggers
    ) {}
}

