package com.zenlink.zenlink.service;

import com.zenlink.zenlink.model.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class PsychProfileResultsSheetBuilder {
    public String build(
            PsychProfileScoringService.PsychProfileScore score,
            PsychProfileScoringService.PsychProfileAnswers answers
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Quick Profile").append("\n");
        sb.append("- Temperament: ").append(formatTemperament(score.temperament())).append("\n");
        sb.append("- Anxiety: ").append(formatAnxiety(score.anxietyLevel()))
                .append(" (score ").append(score.anxietyScore()).append(")").append("\n");
        sb.append("- Control need: ").append(formatControl(score.controlNeed()))
                .append(" (score ").append(score.controlScore()).append(")").append("\n\n");

        sb.append("Communication").append("\n");
        sb.append("- Style: ").append(formatCommunication(score.communicationStyle())).append("\n");
        sb.append("- During procedure: ").append(formatProcedure(score.procedurePreference())).append("\n\n");

        sb.append("Key triggers").append("\n");
        if (score.triggers().isEmpty()) {
            sb.append("- None reported").append("\n\n");
        } else {
            sb.append("- ").append(formatTriggers(score.triggers())).append("\n\n");
        }

        sb.append("Patient notes").append("\n");
        if (answers.q12() == null || answers.q12().trim().isEmpty()) {
            sb.append("- (none)");
        } else {
            sb.append("- ").append(answers.q12().trim());
        }

        return truncate(sb.toString(), 1200);
    }

    private String formatTemperament(Temperament temperament) {
        return capitalize(temperament.name());
    }

    private String formatAnxiety(AnxietyLevel level) {
        return capitalize(level.name());
    }

    private String formatControl(ControlNeed level) {
        return capitalize(level.name());
    }

    private String formatCommunication(CommunicationStyle style) {
        return switch (style) {
            case DIRECT_SHORT -> "Direct short";
            case CALM_ENCOURAGING -> "Calm encouraging";
            case DETAILED_EXPLANATIONS -> "Detailed explanations";
            case MINIMAL_NECESSARY -> "Minimal necessary";
        };
    }

    private String formatProcedure(ProcedurePreference pref) {
        return switch (pref) {
            case EXPLAIN_EACH_STEP -> "Explain each step";
            case ONLY_ESSENTIALS -> "Only essentials";
            case CONSTANT_CHECKINS -> "Constant check-ins";
            case FAST_NO_TALKING -> "Fast no talking";
        };
    }

    private String formatTriggers(List<String> triggers) {
        return triggers.stream()
                .map(this::capitalizeWords)
                .collect(Collectors.joining(", "));
    }

    private String capitalizeWords(String text) {
        String[] parts = text.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(" ");
            sb.append(capitalize(parts[i]));
        }
        return sb.toString();
    }

    private String capitalize(String value) {
        String lowered = value.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lowered.charAt(0)) + lowered.substring(1);
    }

    private String truncate(String value, int maxLen) {
        if (value.length() <= maxLen) {
            return value.trim();
        }
        return value.substring(0, maxLen - 3).trim() + "...";
    }
}

