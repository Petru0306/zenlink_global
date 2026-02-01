package com.zenlink.zenlink.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenlink.zenlink.dto.*;
import com.zenlink.zenlink.model.Appointment;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.repository.AppointmentRepository;
import com.zenlink.zenlink.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConsultationService {

    private static final Logger log = LoggerFactory.getLogger(ConsultationService.class);

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OpenAiChatService openAiChatService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Analyze a consultation segment and return AI recommendations
     */
    public ConsultationSegmentAnalyzeResponse analyzeSegment(
            Long appointmentId,
            ConsultationSegmentAnalyzeRequest request) throws Exception {
        
        // Build patient context string
        String patientContextStr = buildPatientContextString(request.getPatientContext());
        
        // Build context for AI
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("PATIENT CONTEXT:\n").append(patientContextStr).append("\n\n");
        
        if (request.getRollingSummary() != null && !request.getRollingSummary().isEmpty()) {
            contextBuilder.append("PREVIOUS CONVERSATION SUMMARY:\n").append(request.getRollingSummary()).append("\n\n");
        }
        
        if (request.getLastSegments() != null && !request.getLastSegments().isEmpty()) {
            contextBuilder.append("LAST 3 SEGMENTS:\n");
            for (int i = 0; i < request.getLastSegments().size(); i++) {
                contextBuilder.append("Segment ").append(i + 1).append(": ").append(request.getLastSegments().get(i)).append("\n");
            }
            contextBuilder.append("\n");
        }
        
        contextBuilder.append("CURRENT SEGMENT TO ANALYZE:\n").append(request.getLastSegment()).append("\n\n");
        
        // System prompt - Doctor Copilot format
        String systemPrompt = "You are ZenLink Doctor Copilot for dentists. You assist the DOCTOR during consultations.\n" +
                "Your role: Provide doctor-facing clinical insights, questions to ask, and differential considerations.\n" +
                "DO NOT provide patient-facing instructions or advice.\n" +
                "DO NOT use question/answer format or interactive UI elements.\n" +
                "Output language: match conversation (RO/EN) automatically.\n" +
                "\n" +
                "CRITICAL: You MUST return ONLY JSON in this EXACT format. NEVER use mode=\"question\" or any triage format:\n" +
                "{\n" +
                "  \"type\": \"doctor_copilot\",\n" +
                "  \"title\": \"[Short title with emoji]\",\n" +
                "  \"language\": \"ro\" or \"en\",\n" +
                "  \"segments_used\": 3,\n" +
                "  \"content_markdown\": \"[Markdown content with sections below]\",\n" +
                "  \"suggested_actions\": [\n" +
                "    {\"id\": \"followup_questions\", \"label\": \"Întrebări de clarificare\", \"icon\": \"help-circle\"},\n" +
                "    {\"id\": \"differential\", \"label\": \"Posibile cauze\", \"icon\": \"stethoscope\"},\n" +
                "    {\"id\": \"red_flags\", \"label\": \"Red flags\", \"icon\": \"alert-triangle\"},\n" +
                "    {\"id\": \"research\", \"label\": \"Research rapid (surse)\", \"icon\": \"book-open\"}\n" +
                "  ]\n" +
                "}\n" +
                "\n" +
                "The content_markdown MUST be professional doctor-facing text with these sections:\n" +
                "## ✅ Recap segment\n" +
                "- Bullet 1: [2-4 bullets summarizing what patient said]\n" +
                "- Bullet 2\n" +
                "\n" +
                "## ❓ Ce să întrebi pacientul acum\n" +
                "- [5-8 practical questions the doctor should ask, e.g. \"De cât timp persistă durerea?\", \"Ce anume declanșează durerea? (rece/cald/dulce)\"]\n" +
                "\n" +
                "## 🧠 Posibile cauze (orientativ)\n" +
                "1. **[Condition name]** (probabilitate ~X%): [Brief note]\n" +
                "2. **[Condition name]** (probabilitate ~Y%): [Brief note]\n" +
                "3. **[Condition name]** (probabilitate ~Z%): [Brief note]\n" +
                "\n" +
                "## 🧩 Ce să verifici / next steps\n" +
                "- [Clinical action 1, e.g. \"Evaluează sensibilitatea la percusie\"]\n" +
                "- [Clinical action 2]\n" +
                "\n" +
                "## ⚠️ Red flags (dacă aplicabil)\n" +
                "- [Red flag 1, e.g. \"Verifică tumefacție facială\"]\n" +
                "\n" +
                "## 📚 Research (surse)\n" +
                "- **[Source title]** - [Brief description, e.g. \"ADA Guidelines on...\", \"NHS Clinical Reference...\", \"PubMed: Study on...\"]\n" +
                "\n" +
                "Use professional, clinical language. Be concise. No patient-facing instructions.";
        
        String userPrompt = "Analyze this consultation segment from the DOCTOR's perspective.\n\n" +
                contextBuilder.toString() +
                "\n\nReturn ONLY valid JSON in the doctor_copilot format specified above. No other text.";
        
        // Call OpenAI
        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPrompt));
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        String assistantResponse = openAiChatService.streamChat(messages, "", null, outputStream);
        
        // Extract rolling summary (look for "ROLLING SUMMARY:" or similar pattern)
        String updatedRollingSummary = extractRollingSummary(assistantResponse, request.getRollingSummary());
        
        // Try to parse as doctor_copilot JSON
        ConsultationSegmentAnalyzeResponse response = new ConsultationSegmentAnalyzeResponse();
        response.setAssistantMarkdown(assistantResponse); // Fallback
        response.setUpdatedRollingSummary(updatedRollingSummary);
        
        try {
            // Remove markdown code blocks if present
            String jsonStr = assistantResponse.trim();
            jsonStr = jsonStr.replaceAll("(?i)^```json\\s*", "");
            jsonStr = jsonStr.replaceAll("^```\\s*", "");
            jsonStr = jsonStr.replaceAll("\\s*```$", "");
            
            // Try to extract JSON object
            int jsonStart = jsonStr.indexOf("{");
            int jsonEnd = jsonStr.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }
            
            // Parse JSON
            Map<String, Object> parsed = objectMapper.readValue(jsonStr, Map.class);
            
            // REJECT old question/urgent/conclusion mode formats - convert to doctor_copilot
            String mode = (String) parsed.get("mode");
            if ("question".equals(mode) || "urgent".equals(mode) || "conclusion".equals(mode)) {
                log.warn("AI returned old format (mode: {}), converting to doctor_copilot format", mode);
                // Convert to doctor_copilot format
                response.setType("doctor_copilot");
                response.setTitle((String) parsed.get("title"));
                response.setLanguage("ro");
                response.setSegments_used(1);
                
                // Build markdown content from old format
                StringBuilder markdown = new StringBuilder();
                
                // Handle urgent/conclusion format
                if ("urgent".equals(mode) || "conclusion".equals(mode)) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> conclusion = (Map<String, Object>) parsed.get("conclusion");
                    if (conclusion != null) {
                        if (conclusion.get("summary") != null) {
                            markdown.append("## ✅ Rezumat\n\n");
                            markdown.append(conclusion.get("summary")).append("\n\n");
                        }
                        
                        // Probabilities
                        if (conclusion.get("probabilities") instanceof List) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> probs = (List<Map<String, Object>>) conclusion.get("probabilities");
                            if (probs != null && !probs.isEmpty()) {
                                markdown.append("## 🧠 Posibile cauze (orientativ)\n\n");
                                for (Map<String, Object> prob : probs) {
                                    String label = (String) prob.get("label");
                                    Object percentObj = prob.get("percent");
                                    String note = (String) prob.get("note");
                                    String percent = percentObj != null ? percentObj.toString() : "?";
                                    markdown.append("1. **").append(label != null ? label : "Cauză").append("** (probabilitate ~").append(percent).append("%)");
                                    if (note != null && !note.isEmpty()) {
                                        markdown.append(": ").append(note);
                                    }
                                    markdown.append("\n");
                                }
                                markdown.append("\n");
                            }
                        }
                        
                        // Next steps
                        if (conclusion.get("nextSteps") instanceof List) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> steps = (List<Map<String, Object>>) conclusion.get("nextSteps");
                            if (steps != null && !steps.isEmpty()) {
                                markdown.append("## 🧩 Ce să faci / next steps\n\n");
                                for (Map<String, Object> step : steps) {
                                    String title = (String) step.get("title");
                                    String text = (String) step.get("text");
                                    if (title != null || text != null) {
                                        markdown.append("- ");
                                        if (title != null) {
                                            markdown.append("**").append(title).append("**: ");
                                        }
                                        if (text != null) {
                                            markdown.append(text);
                                        }
                                        markdown.append("\n");
                                    }
                                }
                                markdown.append("\n");
                            }
                        }
                        
                        // Red flags
                        if (conclusion.get("redFlags") instanceof List) {
                            @SuppressWarnings("unchecked")
                            List<String> flags = (List<String>) conclusion.get("redFlags");
                            if (flags != null && !flags.isEmpty()) {
                                markdown.append("## ⚠️ Red flags\n\n");
                                for (String flag : flags) {
                                    markdown.append("- ").append(flag).append("\n");
                                }
                                markdown.append("\n");
                            }
                        }
                    }
                } else if ("question".equals(mode)) {
                    // Handle question format
                    markdown.append("## ✅ Recap segment\n\n");
                    markdown.append("- Pacientul raportează: ").append(request.getLastSegment()).append("\n\n");
                    markdown.append("## ❓ Ce să întrebi pacientul acum\n\n");
                    if (parsed.get("question") != null) {
                        markdown.append("- ").append(parsed.get("question")).append("\n\n");
                    }
                    markdown.append("## 🧠 Posibile cauze (orientativ)\n\n");
                    markdown.append("Evaluează în contextul simptomelor raportate.\n\n");
                    markdown.append("## 🧩 Ce să verifici / next steps\n\n");
                    markdown.append("- Evaluează zona afectată\n");
                    markdown.append("- Verifică sensibilitatea\n\n");
                }
                
                response.setContent_markdown(markdown.toString());
                
                // Add suggested actions
                List<Map<String, String>> actions = new ArrayList<>();
                actions.add(createAction("followup_questions", "Întrebări de clarificare", "help-circle"));
                actions.add(createAction("differential", "Posibile cauze", "stethoscope"));
                actions.add(createAction("red_flags", "Red flags", "alert-triangle"));
                actions.add(createAction("research", "Research rapid (surse)", "book-open"));
                response.setSuggested_actions(actions);
            } else if ("doctor_copilot".equals(parsed.get("type"))) {
                response.setType("doctor_copilot");
                response.setTitle((String) parsed.get("title"));
                response.setLanguage((String) parsed.get("language"));
                if (parsed.get("segments_used") instanceof Number) {
                    response.setSegments_used(((Number) parsed.get("segments_used")).intValue());
                }
                response.setContent_markdown((String) parsed.get("content_markdown"));
                if (parsed.get("suggested_actions") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, String>> actions = (List<Map<String, String>>) parsed.get("suggested_actions");
                    response.setSuggested_actions(actions);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse doctor_copilot JSON, using raw response: {}", e.getMessage());
        }
        
        return response;
    }

    /**
     * Execute a copilot action
     */
    public CopilotResponse executeCopilotAction(Long appointmentId, CopilotActionRequest request) {
        String patientContextStr = buildPatientContextString(request.getPatientContext());
        
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("PATIENT CONTEXT:\n").append(patientContextStr).append("\n\n");
        
        if (request.getRollingSummary() != null && !request.getRollingSummary().isEmpty()) {
            contextBuilder.append("PREVIOUS CONVERSATION SUMMARY:\n").append(request.getRollingSummary()).append("\n\n");
        }
        
        if (request.getLastSegments() != null && !request.getLastSegments().isEmpty()) {
            contextBuilder.append("LAST SEGMENTS:\n");
            for (int i = 0; i < request.getLastSegments().size(); i++) {
                contextBuilder.append("Segment ").append(i + 1).append(": ").append(request.getLastSegments().get(i)).append("\n");
            }
            contextBuilder.append("\n");
        }
        
        String systemPrompt = "You are ZenLink Doctor Copilot for dentists. Provide doctor-facing clinical insights.\n" +
                "Output language: match conversation (RO/EN) automatically.\n" +
                "\n" +
                "Return your response as JSON in this EXACT format:\n" +
                "{\n" +
                "  \"type\": \"doctor_copilot\",\n" +
                "  \"title\": \"[Short title with emoji]\",\n" +
                "  \"language\": \"ro\" or \"en\",\n" +
                "  \"segments_used\": " + (request.getLastSegments() != null ? request.getLastSegments().size() : 0) + ",\n" +
                "  \"content_markdown\": \"[Markdown content]\",\n" +
                "  \"suggested_actions\": [\n" +
                "    {\"id\": \"followup_questions\", \"label\": \"Întrebări de clarificare\", \"icon\": \"help-circle\"},\n" +
                "    {\"id\": \"differential\", \"label\": \"Posibile cauze\", \"icon\": \"stethoscope\"},\n" +
                "    {\"id\": \"red_flags\", \"label\": \"Red flags\", \"icon\": \"alert-triangle\"},\n" +
                "    {\"id\": \"research\", \"label\": \"Research rapid (surse)\", \"icon\": \"book-open\"}\n" +
                "  ]\n" +
                "}";
        
        String actionPrompt = getActionPrompt(request.getActionId());
        String userPrompt = actionPrompt + "\n\n" + contextBuilder.toString() + "\n\nReturn ONLY valid JSON in the doctor_copilot format.";
        
        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPrompt));
        
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            String assistantResponse = openAiChatService.streamChat(messages, "", null, outputStream);
            
            return parseCopilotResponse(assistantResponse, request.getLastSegments() != null ? request.getLastSegments().size() : 0);
        } catch (Exception e) {
            log.error("Error executing copilot action: {}", e.getMessage(), e);
            CopilotResponse errorResponse = new CopilotResponse();
            errorResponse.setType("doctor_copilot");
            errorResponse.setTitle("❌ Eroare");
            errorResponse.setLanguage("ro");
            errorResponse.setSegments_used(0);
            errorResponse.setContent_markdown("## ⚠️ Eroare\n\nEroare la executarea acțiunii: " + e.getMessage());
            errorResponse.setSuggested_actions(new ArrayList<>());
            return errorResponse;
        }
    }

    /**
     * Handle copilot chat message
     */
    public CopilotResponse handleCopilotChat(Long appointmentId, CopilotChatRequest request) {
        String patientContextStr = buildPatientContextString(request.getPatientContext());
        
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("PATIENT CONTEXT:\n").append(patientContextStr).append("\n\n");
        
        if (request.getRollingSummary() != null && !request.getRollingSummary().isEmpty()) {
            contextBuilder.append("PREVIOUS CONVERSATION SUMMARY:\n").append(request.getRollingSummary()).append("\n\n");
        }
        
        if (request.getLastSegments() != null && !request.getLastSegments().isEmpty()) {
            contextBuilder.append("LAST SEGMENTS:\n");
            for (int i = 0; i < request.getLastSegments().size(); i++) {
                contextBuilder.append("Segment ").append(i + 1).append(": ").append(request.getLastSegments().get(i)).append("\n");
            }
            contextBuilder.append("\n");
        }
        
        String systemPrompt = "You are ZenLink Doctor Copilot for dentists. Provide doctor-facing clinical insights.\n" +
                "Output language: match conversation (RO/EN) automatically.\n" +
                "\n" +
                "Return your response as JSON in this EXACT format:\n" +
                "{\n" +
                "  \"type\": \"doctor_copilot\",\n" +
                "  \"title\": \"[Short title with emoji]\",\n" +
                "  \"language\": \"ro\" or \"en\",\n" +
                "  \"segments_used\": " + (request.getLastSegments() != null ? request.getLastSegments().size() : 0) + ",\n" +
                "  \"content_markdown\": \"[Markdown content]\",\n" +
                "  \"suggested_actions\": [\n" +
                "    {\"id\": \"followup_questions\", \"label\": \"Întrebări de clarificare\", \"icon\": \"help-circle\"},\n" +
                "    {\"id\": \"differential\", \"label\": \"Posibile cauze\", \"icon\": \"stethoscope\"},\n" +
                "    {\"id\": \"red_flags\", \"label\": \"Red flags\", \"icon\": \"alert-triangle\"},\n" +
                "    {\"id\": \"research\", \"label\": \"Research rapid (surse)\", \"icon\": \"book-open\"}\n" +
                "  ]\n" +
                "}";
        
        String userPrompt = "DOCTOR ASKS: " + request.getUserMessage() + "\n\n" +
                contextBuilder.toString() + "\n\nReturn ONLY valid JSON in the doctor_copilot format.";
        
        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPrompt));
        
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            String assistantResponse = openAiChatService.streamChat(messages, "", null, outputStream);
            
            return parseCopilotResponse(assistantResponse, request.getLastSegments() != null ? request.getLastSegments().size() : 0);
        } catch (Exception e) {
            log.error("Error handling copilot chat: {}", e.getMessage(), e);
            CopilotResponse errorResponse = new CopilotResponse();
            errorResponse.setType("doctor_copilot");
            errorResponse.setTitle("❌ Eroare");
            errorResponse.setLanguage("ro");
            errorResponse.setSegments_used(0);
            errorResponse.setContent_markdown("## ⚠️ Eroare\n\nEroare la procesarea mesajului: " + e.getMessage());
            errorResponse.setSuggested_actions(new ArrayList<>());
            return errorResponse;
        }
    }

    private String getActionPrompt(String actionId) {
        switch (actionId) {
            case "followup_questions":
                return "Generate 5-8 practical follow-up questions the doctor should ask the patient. Focus on: duration, severity, triggers, location, associated symptoms.";
            case "differential":
                return "Provide possible causes/differential diagnosis with confidence ranges (non-diagnostic). List 3-5 possibilities with brief notes.";
            case "red_flags":
                return "List any red flags or urgent signs the doctor should check for. Be specific and actionable.";
            case "research":
                return "Provide 2-4 credible research sources (ADA, NHS, PubMed, textbooks). Include titles and brief descriptions, not raw URLs.";
            default:
                return "Provide relevant clinical information based on the consultation context.";
        }
    }

    private CopilotResponse parseCopilotResponse(String assistantResponse, int segmentsUsed) throws Exception {
        CopilotResponse response = new CopilotResponse();
        
        try {
            // Remove markdown code blocks if present
            String jsonStr = assistantResponse.trim();
            jsonStr = jsonStr.replaceAll("(?i)^```json\\s*", "");
            jsonStr = jsonStr.replaceAll("^```\\s*", "");
            jsonStr = jsonStr.replaceAll("\\s*```$", "");
            
            // Try to extract JSON object
            int jsonStart = jsonStr.indexOf("{");
            int jsonEnd = jsonStr.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }
            
            // Parse JSON
            Map<String, Object> parsed = objectMapper.readValue(jsonStr, Map.class);
            
            if ("doctor_copilot".equals(parsed.get("type"))) {
                response.setType("doctor_copilot");
                response.setTitle((String) parsed.get("title"));
                response.setLanguage((String) parsed.get("language"));
                response.setSegments_used(segmentsUsed);
                response.setContent_markdown((String) parsed.get("content_markdown"));
                if (parsed.get("suggested_actions") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, String>> actions = (List<Map<String, String>>) parsed.get("suggested_actions");
                    response.setSuggested_actions(actions);
                }
            } else {
                // Fallback: create response from markdown
                response.setType("doctor_copilot");
                response.setTitle("📋 Răspuns Copilot");
                response.setLanguage("ro");
                response.setSegments_used(segmentsUsed);
                response.setContent_markdown(assistantResponse);
                response.setSuggested_actions(new ArrayList<>());
            }
        } catch (Exception e) {
            log.warn("Failed to parse copilot JSON, using raw response: {}", e.getMessage());
            // Fallback
            response.setType("doctor_copilot");
            response.setTitle("📋 Răspuns Copilot");
            response.setLanguage("ro");
            response.setSegments_used(segmentsUsed);
            response.setContent_markdown(assistantResponse);
            response.setSuggested_actions(new ArrayList<>());
        }
        
        return response;
    }

    /**
     * Finalize consultation and generate Clarity Sheets
     */
    public ConsultationFinalizeResponse finalizeConsultation(
            Long appointmentId,
            ConsultationFinalizeRequest request) throws Exception {
        
        // Build patient context
        String patientContextStr = buildPatientContextString(request.getPatientContext());
        
        // System prompt for finalization
        String systemPrompt = "You are ZenLink Clinical Assistant for dentists. Generate TWO structured outputs:\n" +
                "1. Patient Clarity Sheet (friendly, non-technical language)\n" +
                "2. Doctor Summary (technical, clinical notes)\n" +
                "No medication dosing. Safe language. Informational only.\n" +
                "\n" +
                "IMPORTANT: Return your response as valid JSON only. Use this exact structure:\n" +
                "{\n" +
                "  \"patientClaritySheet\": {\n" +
                "    \"whatWeDiscussed\": \"[friendly summary of what was discussed]\",\n" +
                "    \"whatDoctorFound\": \"[gentle language about findings]\",\n" +
                "    \"plan\": [\"step1\", \"step2\", \"step3\"],\n" +
                "    \"homeCareInstructions\": [\"instruction1\", \"instruction2\"],\n" +
                "    \"whenToSeekUrgentCare\": \"[when to seek urgent care]\",\n" +
                "    \"followUp\": \"[follow-up instructions]\"\n" +
                "  },\n" +
                "  \"doctorSummary\": {\n" +
                "    \"chiefComplaint\": \"[chief complaint]\",\n" +
                "    \"historyOfPresentIllness\": \"[history]\",\n" +
                "    \"examinationFindings\": \"[findings]\",\n" +
                "    \"assessment\": \"[assessment]\",\n" +
                "    \"plan\": \"[plan]\",\n" +
                "    \"clinicalNotes\": [\"note1\", \"note2\"]\n" +
                "  }\n" +
                "}";
        
        // User prompt
        StringBuilder userPromptBuilder = new StringBuilder();
        userPromptBuilder.append("PATIENT CONTEXT:\n").append(patientContextStr).append("\n\n");
        userPromptBuilder.append("FULL TRANSCRIPT:\n").append(request.getFullTranscript()).append("\n\n");
        userPromptBuilder.append("Generate both sheets and return ONLY valid JSON in the exact format specified above.\n");
        userPromptBuilder.append("Do not include any markdown code blocks, explanations, or extra text - only the JSON object.");
        
        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPromptBuilder.toString()));
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        String aiResponse = openAiChatService.streamChat(messages, "", null, outputStream);
        
        // Parse AI response and create structured response
        // For now, create a structured response from the AI text
        ConsultationFinalizeResponse response = parseFinalizeResponse(aiResponse, request);
        
        // TODO: Save to database/link to appointment
        log.info("Consultation {} finalized", appointmentId);
        
        return response;
    }

    private String buildPatientContextString(Map<String, Object> patientContext) {
        if (patientContext == null || patientContext.isEmpty()) {
            return "No patient context available.";
        }
        
        StringBuilder sb = new StringBuilder();
        if (patientContext.containsKey("name")) {
            sb.append("Name: ").append(patientContext.get("name")).append("\n");
        }
        if (patientContext.containsKey("age")) {
            sb.append("Age: ").append(patientContext.get("age")).append("\n");
        }
        if (patientContext.containsKey("reason")) {
            sb.append("Reason for visit: ").append(patientContext.get("reason")).append("\n");
        }
        if (patientContext.containsKey("allergies")) {
            sb.append("Allergies: ").append(patientContext.get("allergies")).append("\n");
        }
        if (patientContext.containsKey("conditions")) {
            sb.append("Known conditions: ").append(patientContext.get("conditions")).append("\n");
        }
        if (patientContext.containsKey("medications")) {
            sb.append("Current medications: ").append(patientContext.get("medications")).append("\n");
        }
        
        return sb.toString();
    }

    private String extractRollingSummary(String assistantResponse, String currentSummary) {
        // Try to extract from response, or use current if not found
        if (assistantResponse.contains("ROLLING SUMMARY:")) {
            int start = assistantResponse.indexOf("ROLLING SUMMARY:") + "ROLLING SUMMARY:".length();
            int end = assistantResponse.indexOf("\n\n", start);
            if (end == -1) end = assistantResponse.length();
            return assistantResponse.substring(start, end).trim();
        }
        // If no explicit summary, use current or generate a short one
        if (currentSummary != null && !currentSummary.isEmpty()) {
            return currentSummary.length() > 700 ? currentSummary.substring(0, 700) : currentSummary;
        }
        return assistantResponse.length() > 700 ? assistantResponse.substring(0, 700) : assistantResponse;
    }
    
    /**
     * Estimate how many questions have been asked so far
     */
    private int estimateQuestionCount(String rollingSummary, List<String> lastSegments) {
        int count = 0;
        if (rollingSummary != null && !rollingSummary.isEmpty()) {
            // Count question marks in summary
            count += rollingSummary.split("\\?").length - 1;
        }
        if (lastSegments != null) {
            for (String segment : lastSegments) {
                count += segment.split("\\?").length - 1;
            }
        }
        return count;
    }
    
    private Map<String, String> createAction(String id, String label, String icon) {
        Map<String, String> action = new HashMap<>();
        action.put("id", id);
        action.put("label", label);
        action.put("icon", icon);
        return action;
    }

    private ConsultationFinalizeResponse parseFinalizeResponse(String aiResponse, ConsultationFinalizeRequest request) {
        // Try to parse JSON from AI response
        try {
            // Remove markdown code blocks if present
            String jsonStr = aiResponse.trim();
            jsonStr = jsonStr.replaceAll("(?i)^```json\\s*", "");
            jsonStr = jsonStr.replaceAll("^```\\s*", "");
            jsonStr = jsonStr.replaceAll("\\s*```$", "");
            
            // Try to extract JSON object
            int jsonStart = jsonStr.indexOf("{");
            int jsonEnd = jsonStr.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }
            
            // Parse JSON
            Map<String, Object> parsed = objectMapper.readValue(jsonStr, Map.class);
            
            // Extract patientClaritySheet
            Map<String, Object> patientSheetMap = (Map<String, Object>) parsed.get("patientClaritySheet");
            ConsultationFinalizeResponse.PatientClaritySheet claritySheet = new ConsultationFinalizeResponse.PatientClaritySheet();
            if (patientSheetMap != null) {
                claritySheet.setWhatWeDiscussed((String) patientSheetMap.get("whatWeDiscussed"));
                claritySheet.setWhatDoctorFound((String) patientSheetMap.get("whatDoctorFound"));
                if (patientSheetMap.get("plan") instanceof List) {
                    claritySheet.setPlan((List<String>) patientSheetMap.get("plan"));
                }
                if (patientSheetMap.get("homeCareInstructions") instanceof List) {
                    claritySheet.setHomeCareInstructions((List<String>) patientSheetMap.get("homeCareInstructions"));
                }
                claritySheet.setWhenToSeekUrgentCare((String) patientSheetMap.get("whenToSeekUrgentCare"));
                claritySheet.setFollowUp((String) patientSheetMap.get("followUp"));
            }
            
            // Extract doctorSummary
            Map<String, Object> doctorSummaryMap = (Map<String, Object>) parsed.get("doctorSummary");
            ConsultationFinalizeResponse.DoctorSummary doctorSummary = new ConsultationFinalizeResponse.DoctorSummary();
            if (doctorSummaryMap != null) {
                doctorSummary.setChiefComplaint((String) doctorSummaryMap.get("chiefComplaint"));
                doctorSummary.setHistoryOfPresentIllness((String) doctorSummaryMap.get("historyOfPresentIllness"));
                doctorSummary.setExaminationFindings((String) doctorSummaryMap.get("examinationFindings"));
                doctorSummary.setAssessment((String) doctorSummaryMap.get("assessment"));
                doctorSummary.setPlan((String) doctorSummaryMap.get("plan"));
                if (doctorSummaryMap.get("clinicalNotes") instanceof List) {
                    doctorSummary.setClinicalNotes((List<String>) doctorSummaryMap.get("clinicalNotes"));
                }
            }
            
            // Fill in defaults if missing
            if (claritySheet.getWhatWeDiscussed() == null || claritySheet.getWhatWeDiscussed().isEmpty()) {
                claritySheet.setWhatWeDiscussed("Discussed during consultation: " + 
                    request.getFullTranscript().substring(0, Math.min(200, request.getFullTranscript().length())));
            }
            if (claritySheet.getPlan() == null || claritySheet.getPlan().isEmpty()) {
                claritySheet.setPlan(Arrays.asList("Follow doctor's recommendations", "Schedule follow-up if needed"));
            }
            if (doctorSummary.getChiefComplaint() == null || doctorSummary.getChiefComplaint().isEmpty()) {
                doctorSummary.setChiefComplaint("Patient consultation");
            }
            if (doctorSummary.getClinicalNotes() == null || doctorSummary.getClinicalNotes().isEmpty()) {
                doctorSummary.setClinicalNotes(Arrays.asList("Full transcript available", "See consultation notes"));
            }
            
            return new ConsultationFinalizeResponse(claritySheet, doctorSummary);
            
        } catch (Exception e) {
            log.warn("Failed to parse JSON from AI response, using fallback: {}", e.getMessage());
            
            // Fallback: create structured response from text parsing
            ConsultationFinalizeResponse.PatientClaritySheet claritySheet = new ConsultationFinalizeResponse.PatientClaritySheet();
            claritySheet.setWhatWeDiscussed("Discussed during consultation: " + 
                request.getFullTranscript().substring(0, Math.min(200, request.getFullTranscript().length())));
            claritySheet.setWhatDoctorFound("Doctor's findings will be available after review.");
            claritySheet.setPlan(Arrays.asList("Follow doctor's recommendations", "Schedule follow-up if needed"));
            claritySheet.setHomeCareInstructions(Arrays.asList("Maintain good oral hygiene", "Follow any specific instructions given"));
            claritySheet.setWhenToSeekUrgentCare("Seek urgent care if experiencing severe pain, swelling, or other concerning symptoms.");
            claritySheet.setFollowUp("Follow-up appointment recommended as discussed.");
            
            ConsultationFinalizeResponse.DoctorSummary doctorSummary = new ConsultationFinalizeResponse.DoctorSummary();
            doctorSummary.setChiefComplaint("Patient consultation");
            doctorSummary.setHistoryOfPresentIllness("As per transcript");
            doctorSummary.setExaminationFindings("To be documented");
            doctorSummary.setAssessment("Assessment pending");
            doctorSummary.setPlan("Plan as discussed");
            doctorSummary.setClinicalNotes(Arrays.asList("Full transcript available", "See consultation notes"));
            
            return new ConsultationFinalizeResponse(claritySheet, doctorSummary);
        }
    }
}
