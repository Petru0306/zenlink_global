package com.zenlink.zenlink.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenlink.zenlink.dto.*;
import com.zenlink.zenlink.model.Appointment;
import com.zenlink.zenlink.model.ConsultationSegment;
import com.zenlink.zenlink.model.ConsultationMessage;
import com.zenlink.zenlink.model.FinalizedConsultation;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.repository.AppointmentRepository;
import com.zenlink.zenlink.repository.ConsultationSegmentRepository;
import com.zenlink.zenlink.repository.ConsultationMessageRepository;
import com.zenlink.zenlink.repository.FinalizedConsultationRepository;
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

    @Autowired
    private ConsultationSegmentRepository consultationSegmentRepository;

    @Autowired
    private ConsultationMessageRepository consultationMessageRepository;

    @Autowired
    private FinalizedConsultationRepository finalizedConsultationRepository;

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
        
        // Get appointment data
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        User doctor = userRepository.findById(appointment.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        String doctorName = "Dr. " + doctor.getFirstName() + " " + doctor.getLastName();
        String consultationDate = appointment.getDate().toString();
        String specialty = "Stomatologie"; // Default, can be enhanced later with specialty field
        
        // Determine presentation type (simplified - can be enhanced)
        String presentationType = "prima prezentare"; // Default, can be determined from history
        
        // Build patient context
        String patientContextStr = buildPatientContextString(request.getPatientContext());
        
        // System prompt for finalization - TWO DIFFERENT FORMATS
        String systemPrompt = "You are ZenLink Clinical Assistant for dentists. Generate TWO different outputs:\n" +
                "1. Patient Clarity Sheet: Simple, friendly, non-technical language for patients (6 sections)\n" +
                "2. Doctor Summary: Technical, detailed clinical notes for doctors (9 sections)\n" +
                "\n" +
                "Return ONLY valid JSON, no markdown, no explanations:\n" +
                "{\n" +
                "  \"patientClaritySheet\": {\n" +
                "    \"whatHappenedToday\": \"[problema/disconfort descris de pacient, 1-2 propoziții simple]\",\n" +
                "    \"todayActions\": [\"am vorbit despre ce simți\", \"am verificat zona care te îngrijora\", \"am strâns informațiile importante\"],\n" +
                "    \"whatThisMeans\": [\"situația ta a fost evaluată\", \"informațiile sunt acum clare și organizate\", \"nu este nevoie să reții detalii medicale\"],\n" +
                "    \"nextSteps\": [\"vom continua discuția la următoarea vizită\", \"vom reveni asupra situației tale când va fi necesar\", \"între timp, este util să fii atent la cum te simți\"],\n" +
                "    \"nextAppointment\": \"[data următoarei întâlniri dacă este stabilită, altfel string gol]\",\n" +
                "    \"whatToWatchFor\": [\"schimbări ale disconfortului\", \"senzații noi\", \"ceva care te îngrijorează\"],\n" +
                "    \"quickCheckQuestions\": [\"Care este lucrul principal pe care l-ai reținut din vizită?\", \"Ce vei urmări până data viitoare?\", \"Ce întrebare ai vrea să pui?\"],\n" +
                "    \"importantNote\": [\"te ajută să îți amintești ce s-a discutat\", \"te ajută să înțelegi situația ta\", \"nu îți cere să iei decizii medicale\"]\n" +
                "  },\n" +
                "  \"doctorSummary\": {\n" +
                "    \"consultationDate\": \"" + consultationDate + "\",\n" +
                "    \"clinician\": \"" + doctorName + "\",\n" +
                "    \"specialty\": \"" + specialty + "\",\n" +
                "    \"presentationType\": \"" + presentationType + "\",\n" +
                "    \"chiefComplaint\": \"[motiv principal, 1-2 propoziții]\",\n" +
                "    \"generalMedicalHistory\": [\"item1\", \"item2\"],\n" +
                "    \"dentalHistory\": [\"item1\", \"item2\"],\n" +
                "    \"generalObservations\": [\"item1\", \"item2\"],\n" +
                "    \"specialtySpecificObservations\": [\"item1\", \"item2\"],\n" +
                "    \"availableInvestigations\": [\"item1\"],\n" +
                "    \"clinicalPhotos\": [\"item1\"],\n" +
                "    \"otherDocuments\": [\"item1\"],\n" +
                "    \"clinicianNote\": \"[notă clinică scurtă]\",\n" +
                "    \"actionsPerformed\": [\"item1\", \"item2\"],\n" +
                "    \"informationSources\": [\"raport pacient\", \"observații clinician\"],\n" +
                "    \"includeChiefComplaint\": true,\n" +
                "    \"includeObservationsSummary\": true,\n" +
                "    \"includeActionsPerformed\": true,\n" +
                "    \"includeNextSteps\": true,\n" +
                "    \"excludeClinicianNote\": true,\n" +
                "    \"excludeSensitiveObservations\": false\n" +
                "  }\n" +
                "}\n" +
                "\n" +
                "PATIENT CLARITY SHEET RULES (simple, friendly):\n" +
                "- Use simple, everyday language. NO medical jargon.\n" +
                "- whatHappenedToday: Extract patient's main concern in simple words.\n" +
                "- todayActions: What was done during visit (talking, checking, gathering info).\n" +
                "- whatThisMeans: Reassuring, simple explanation of what happened.\n" +
                "- nextSteps: Simple next steps, not technical.\n" +
                "- whatToWatchFor: Simple things to pay attention to.\n" +
                "- quickCheckQuestions: Questions to help patient reflect.\n" +
                "- importantNote: Reassuring note about the document and doctor's role.\n" +
                "\n" +
                "DOCTOR SUMMARY RULES (technical, detailed):\n" +
                "- Extract ALL clinical information from transcript.\n" +
                "- Be thorough, technical, and detailed.\n" +
                "- MUST fill ALL 9 sections with meaningful data extracted from transcript.\n" +
                "- generalMedicalHistory: Extract any mentioned conditions, medications, health issues.\n" +
                "- dentalHistory: Extract past treatments, previous dental work, relevant dental context.\n" +
                "- generalObservations: Extract observable clinical aspects mentioned during consultation.\n" +
                "- specialtySpecificObservations: Extract dental-specific findings (gingival issues, periodontal status, caries, etc.).\n" +
                "- availableInvestigations: Mention if images, radiographs were discussed or are available.\n" +
                "- clinicianNote: Write brief clinical impressions, things to follow up, preliminary thoughts.\n" +
                "- actionsPerformed: List what was actually done (examination, discussion, education, procedures).\n" +
                "- If a section truly has no data, use [] or \"\" but ALWAYS include the field.\n" +
                "- DO NOT skip sections. Extract and structure information from transcript.\n" +
                "\n" +
                "BE THOROUGH. Extract and structure ALL available information from transcript.";
        
        // User prompt
        StringBuilder userPromptBuilder = new StringBuilder();
        userPromptBuilder.append("PATIENT CONTEXT:\n").append(patientContextStr).append("\n\n");
        userPromptBuilder.append("FULL TRANSCRIPT:\n").append(request.getFullTranscript()).append("\n\n");
        userPromptBuilder.append("Generate BOTH outputs:\n");
        userPromptBuilder.append("1. Patient Clarity Sheet: Simple, friendly language (6 sections)\n");
        userPromptBuilder.append("2. Doctor Summary: Technical, detailed notes (9 sections)\n");
        userPromptBuilder.append("Extract REAL information. Be CONCISE. If not mentioned, use [] or \"\".\n");
        userPromptBuilder.append("Return ONLY valid JSON, no markdown, no explanations.");
        
        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPromptBuilder.toString()));
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        String aiResponse = openAiChatService.streamChat(messages, "", null, outputStream);
        
        // Parse AI response and create structured response
        ConsultationFinalizeResponse response = parseFinalizeResponse(aiResponse, request, appointment, doctor);
        
        // Save finalized consultation to database
        saveFinalizedConsultation(appointmentId, appointment, response);
        
        // Mark appointment as completed
        appointment.setStatus("completed");
        appointmentRepository.save(appointment);
        
        log.info("Consultation {} finalized and saved", appointmentId);
        
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
        
        // Check if medicalProfile exists (new format with all medical data)
        @SuppressWarnings("unchecked")
        Map<String, Object> medicalProfile = (Map<String, Object>) patientContext.get("medicalProfile");
        if (medicalProfile != null && !medicalProfile.isEmpty()) {
            sb.append("\nMEDICAL PROFILE:\n");
            if (medicalProfile.containsKey("bloodType") && medicalProfile.get("bloodType") != null) {
                sb.append("- Blood type: ").append(medicalProfile.get("bloodType")).append("\n");
            }
            if (medicalProfile.containsKey("allergies") && medicalProfile.get("allergies") != null) {
                sb.append("- Allergies: ").append(medicalProfile.get("allergies")).append("\n");
            }
            if (medicalProfile.containsKey("chronicConditions") && medicalProfile.get("chronicConditions") != null) {
                sb.append("- Chronic conditions: ").append(medicalProfile.get("chronicConditions")).append("\n");
            }
            if (medicalProfile.containsKey("medications") && medicalProfile.get("medications") != null) {
                sb.append("- Current medications: ").append(medicalProfile.get("medications")).append("\n");
            }
            if (medicalProfile.containsKey("weightKg") && medicalProfile.get("weightKg") != null) {
                sb.append("- Weight: ").append(medicalProfile.get("weightKg")).append(" kg");
                if (medicalProfile.containsKey("weightDate") && medicalProfile.get("weightDate") != null) {
                    sb.append(" (from ").append(medicalProfile.get("weightDate")).append(")");
                }
                sb.append("\n");
            }
            if (medicalProfile.containsKey("heightCm") && medicalProfile.get("heightCm") != null) {
                sb.append("- Height: ").append(medicalProfile.get("heightCm")).append(" cm\n");
            }
            if (medicalProfile.containsKey("bloodPressure") && medicalProfile.get("bloodPressure") != null) {
                sb.append("- Blood pressure: ").append(medicalProfile.get("bloodPressure"));
                if (medicalProfile.containsKey("bpDate") && medicalProfile.get("bpDate") != null) {
                    sb.append(" (from ").append(medicalProfile.get("bpDate")).append(")");
                }
                sb.append("\n");
            }
            if (medicalProfile.containsKey("glucose") && medicalProfile.get("glucose") != null) {
                sb.append("- Glucose: ").append(medicalProfile.get("glucose"));
                if (medicalProfile.containsKey("glucoseDate") && medicalProfile.get("glucoseDate") != null) {
                    sb.append(" (from ").append(medicalProfile.get("glucoseDate")).append(")");
                }
                sb.append("\n");
            }
        } else {
            // Fallback to legacy fields for backward compatibility
            if (patientContext.containsKey("allergies")) {
                sb.append("Allergies: ").append(patientContext.get("allergies")).append("\n");
            }
            if (patientContext.containsKey("conditions")) {
                sb.append("Known conditions: ").append(patientContext.get("conditions")).append("\n");
            }
            if (patientContext.containsKey("medications")) {
                sb.append("Current medications: ").append(patientContext.get("medications")).append("\n");
            }
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

    private ConsultationFinalizeResponse parseFinalizeResponse(String aiResponse, ConsultationFinalizeRequest request, Appointment appointment, User doctor) {
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
            
            // Extract patientClaritySheet - NEW SIMPLE FORMAT (6 sections)
            Map<String, Object> patientSheetMap = (Map<String, Object>) parsed.get("patientClaritySheet");
            ConsultationFinalizeResponse.PatientClaritySheet claritySheet = new ConsultationFinalizeResponse.PatientClaritySheet();
            if (patientSheetMap != null) {
                // Section 1: Ce s-a întâmplat azi
                claritySheet.setWhatHappenedToday((String) patientSheetMap.get("whatHappenedToday"));
                if (patientSheetMap.get("todayActions") instanceof List) {
                    claritySheet.setTodayActions((List<String>) patientSheetMap.get("todayActions"));
                }
                
                // Section 2: Ce înseamnă asta pentru tine
                if (patientSheetMap.get("whatThisMeans") instanceof List) {
                    claritySheet.setWhatThisMeans((List<String>) patientSheetMap.get("whatThisMeans"));
                }
                
                // Section 3: Ce urmează
                if (patientSheetMap.get("nextSteps") instanceof List) {
                    claritySheet.setNextSteps((List<String>) patientSheetMap.get("nextSteps"));
                }
                claritySheet.setNextAppointment((String) patientSheetMap.get("nextAppointment"));
                
                // Section 4: La ce să fii atent
                if (patientSheetMap.get("whatToWatchFor") instanceof List) {
                    claritySheet.setWhatToWatchFor((List<String>) patientSheetMap.get("whatToWatchFor"));
                }
                
                // Section 5: Verificare rapidă
                if (patientSheetMap.get("quickCheckQuestions") instanceof List) {
                    claritySheet.setQuickCheckQuestions((List<String>) patientSheetMap.get("quickCheckQuestions"));
                }
                
                // Section 6: Un lucru important
                if (patientSheetMap.get("importantNote") instanceof List) {
                    claritySheet.setImportantNote((List<String>) patientSheetMap.get("importantNote"));
                }
            }
            
            // Fill in defaults for patient clarity sheet
            if (claritySheet.getWhatHappenedToday() == null || claritySheet.getWhatHappenedToday().isEmpty()) {
                String transcriptPreview = request.getFullTranscript().substring(0, Math.min(150, request.getFullTranscript().length()));
                claritySheet.setWhatHappenedToday("Ai venit pentru o consultație stomatologică. " + transcriptPreview);
            }
            if (claritySheet.getTodayActions() == null) {
                claritySheet.setTodayActions(Arrays.asList("am vorbit despre ce simți", "am verificat zona care te îngrijora", "am strâns informațiile importante"));
            }
            if (claritySheet.getWhatThisMeans() == null) {
                claritySheet.setWhatThisMeans(Arrays.asList("situația ta a fost evaluată", "informațiile sunt acum clare și organizate", "nu este nevoie să reții detalii medicale"));
            }
            if (claritySheet.getNextSteps() == null) {
                claritySheet.setNextSteps(Arrays.asList("vom continua discuția la următoarea vizită", "vom reveni asupra situației tale când va fi necesar", "între timp, este util să fii atent la cum te simți"));
            }
            if (claritySheet.getWhatToWatchFor() == null) {
                claritySheet.setWhatToWatchFor(Arrays.asList("schimbări ale disconfortului", "senzații noi", "ceva care te îngrijorează"));
            }
            if (claritySheet.getQuickCheckQuestions() == null) {
                claritySheet.setQuickCheckQuestions(Arrays.asList("Care este lucrul principal pe care l-ai reținut din vizită?", "Ce vei urmări până data viitoare?", "Ce întrebare ai vrea să pui?"));
            }
            if (claritySheet.getImportantNote() == null) {
                claritySheet.setImportantNote(Arrays.asList("te ajută să îți amintești ce s-a discutat", "te ajută să înțelegi situația ta", "nu îți cere să iei decizii medicale"));
            }
            
            // Extract doctorSummary - OLD FORMAT (9 sections) moved here
            Map<String, Object> doctorSummaryMap = (Map<String, Object>) parsed.get("doctorSummary");
            ConsultationFinalizeResponse.DoctorSummary doctorSummary = new ConsultationFinalizeResponse.DoctorSummary();
            if (doctorSummaryMap != null) {
                // Section 1: Date generale caz
                doctorSummary.setConsultationDate((String) doctorSummaryMap.get("consultationDate"));
                doctorSummary.setClinician((String) doctorSummaryMap.get("clinician"));
                doctorSummary.setSpecialty((String) doctorSummaryMap.get("specialty"));
                doctorSummary.setPresentationType((String) doctorSummaryMap.get("presentationType"));
                
                // Section 2: Motivul prezentării
                doctorSummary.setChiefComplaint((String) doctorSummaryMap.get("chiefComplaint"));
                
                // Section 3: Anamneză
                if (doctorSummaryMap.get("generalMedicalHistory") instanceof List) {
                    doctorSummary.setGeneralMedicalHistory((List<String>) doctorSummaryMap.get("generalMedicalHistory"));
                }
                if (doctorSummaryMap.get("dentalHistory") instanceof List) {
                    doctorSummary.setDentalHistory((List<String>) doctorSummaryMap.get("dentalHistory"));
                }
                
                // Section 4: Observații clinice
                if (doctorSummaryMap.get("generalObservations") instanceof List) {
                    doctorSummary.setGeneralObservations((List<String>) doctorSummaryMap.get("generalObservations"));
                }
                if (doctorSummaryMap.get("specialtySpecificObservations") instanceof List) {
                    doctorSummary.setSpecialtySpecificObservations((List<String>) doctorSummaryMap.get("specialtySpecificObservations"));
                }
                
                // Section 5: Date suplimentare
                if (doctorSummaryMap.get("availableInvestigations") instanceof List) {
                    doctorSummary.setAvailableInvestigations((List<String>) doctorSummaryMap.get("availableInvestigations"));
                }
                if (doctorSummaryMap.get("clinicalPhotos") instanceof List) {
                    doctorSummary.setClinicalPhotos((List<String>) doctorSummaryMap.get("clinicalPhotos"));
                }
                if (doctorSummaryMap.get("otherDocuments") instanceof List) {
                    doctorSummary.setOtherDocuments((List<String>) doctorSummaryMap.get("otherDocuments"));
                }
                
                // Section 6: Notă clinică
                doctorSummary.setClinicianNote((String) doctorSummaryMap.get("clinicianNote"));
                
                // Section 7: Acțiuni realizate
                if (doctorSummaryMap.get("actionsPerformed") instanceof List) {
                    doctorSummary.setActionsPerformed((List<String>) doctorSummaryMap.get("actionsPerformed"));
                }
                
                // Section 8: Proveniența informației
                if (doctorSummaryMap.get("informationSources") instanceof List) {
                    doctorSummary.setInformationSources((List<String>) doctorSummaryMap.get("informationSources"));
                }
                
                // Section 9: Control export
                if (doctorSummaryMap.get("includeChiefComplaint") instanceof Boolean) {
                    doctorSummary.setIncludeChiefComplaint((Boolean) doctorSummaryMap.get("includeChiefComplaint"));
                } else {
                    doctorSummary.setIncludeChiefComplaint(true);
                }
                if (doctorSummaryMap.get("includeObservationsSummary") instanceof Boolean) {
                    doctorSummary.setIncludeObservationsSummary((Boolean) doctorSummaryMap.get("includeObservationsSummary"));
                } else {
                    doctorSummary.setIncludeObservationsSummary(true);
                }
                if (doctorSummaryMap.get("includeActionsPerformed") instanceof Boolean) {
                    doctorSummary.setIncludeActionsPerformed((Boolean) doctorSummaryMap.get("includeActionsPerformed"));
                } else {
                    doctorSummary.setIncludeActionsPerformed(true);
                }
                if (doctorSummaryMap.get("includeNextSteps") instanceof Boolean) {
                    doctorSummary.setIncludeNextSteps((Boolean) doctorSummaryMap.get("includeNextSteps"));
                } else {
                    doctorSummary.setIncludeNextSteps(true);
                }
                if (doctorSummaryMap.get("excludeClinicianNote") instanceof Boolean) {
                    doctorSummary.setExcludeClinicianNote((Boolean) doctorSummaryMap.get("excludeClinicianNote"));
                } else {
                    doctorSummary.setExcludeClinicianNote(true);
                }
                if (doctorSummaryMap.get("excludeSensitiveObservations") instanceof Boolean) {
                    doctorSummary.setExcludeSensitiveObservations((Boolean) doctorSummaryMap.get("excludeSensitiveObservations"));
                } else {
                    doctorSummary.setExcludeSensitiveObservations(false);
                }
            }
            
            // Fill doctor summary defaults from appointment/doctor
            if (doctorSummary.getConsultationDate() == null || doctorSummary.getConsultationDate().isEmpty()) {
                doctorSummary.setConsultationDate(appointment.getDate().toString());
            }
            if (doctorSummary.getClinician() == null || doctorSummary.getClinician().isEmpty()) {
                doctorSummary.setClinician("Dr. " + doctor.getFirstName() + " " + doctor.getLastName());
            }
            if (doctorSummary.getSpecialty() == null || doctorSummary.getSpecialty().isEmpty()) {
                doctorSummary.setSpecialty("Stomatologie");
            }
            if (doctorSummary.getPresentationType() == null || doctorSummary.getPresentationType().isEmpty()) {
                doctorSummary.setPresentationType("prima prezentare");
            }
            if (doctorSummary.getChiefComplaint() == null || doctorSummary.getChiefComplaint().isEmpty()) {
                String transcriptPreview = request.getFullTranscript().substring(0, Math.min(200, request.getFullTranscript().length()));
                doctorSummary.setChiefComplaint("Pacientul se prezintă pentru: " + transcriptPreview);
            }
            if (doctorSummary.getGeneralMedicalHistory() == null) {
                doctorSummary.setGeneralMedicalHistory(new ArrayList<>());
            }
            if (doctorSummary.getDentalHistory() == null) {
                doctorSummary.setDentalHistory(new ArrayList<>());
            }
            if (doctorSummary.getGeneralObservations() == null) {
                doctorSummary.setGeneralObservations(new ArrayList<>());
            }
            if (doctorSummary.getSpecialtySpecificObservations() == null) {
                doctorSummary.setSpecialtySpecificObservations(new ArrayList<>());
            }
            if (doctorSummary.getAvailableInvestigations() == null) {
                doctorSummary.setAvailableInvestigations(new ArrayList<>());
            }
            if (doctorSummary.getClinicalPhotos() == null) {
                doctorSummary.setClinicalPhotos(new ArrayList<>());
            }
            if (doctorSummary.getOtherDocuments() == null) {
                doctorSummary.setOtherDocuments(new ArrayList<>());
            }
            if (doctorSummary.getActionsPerformed() == null) {
                doctorSummary.setActionsPerformed(new ArrayList<>());
            }
            if (doctorSummary.getInformationSources() == null) {
                doctorSummary.setInformationSources(Arrays.asList("raport pacient", "observații clinician"));
            }
            
            return new ConsultationFinalizeResponse(claritySheet, doctorSummary);
            
        } catch (Exception e) {
            log.warn("Failed to parse JSON from AI response, using fallback: {}", e.getMessage());
            
            // Fallback: create structured response with new formats
            ConsultationFinalizeResponse.PatientClaritySheet claritySheet = new ConsultationFinalizeResponse.PatientClaritySheet();
            String transcriptPreview = request.getFullTranscript().substring(0, Math.min(150, request.getFullTranscript().length()));
            claritySheet.setWhatHappenedToday("Ai venit pentru o consultație stomatologică. " + transcriptPreview);
            claritySheet.setTodayActions(Arrays.asList("am vorbit despre ce simți", "am verificat zona care te îngrijora", "am strâns informațiile importante"));
            claritySheet.setWhatThisMeans(Arrays.asList("situația ta a fost evaluată", "informațiile sunt acum clare și organizate", "nu este nevoie să reții detalii medicale"));
            claritySheet.setNextSteps(Arrays.asList("vom continua discuția la următoarea vizită", "vom reveni asupra situației tale când va fi necesar", "între timp, este util să fii atent la cum te simți"));
            claritySheet.setNextAppointment("");
            claritySheet.setWhatToWatchFor(Arrays.asList("schimbări ale disconfortului", "senzații noi", "ceva care te îngrijorează"));
            claritySheet.setQuickCheckQuestions(Arrays.asList("Care este lucrul principal pe care l-ai reținut din vizită?", "Ce vei urmări până data viitoare?", "Ce întrebare ai vrea să pui?"));
            claritySheet.setImportantNote(Arrays.asList("te ajută să îți amintești ce s-a discutat", "te ajută să înțelegi situația ta", "nu îți cere să iei decizii medicale"));
            
            ConsultationFinalizeResponse.DoctorSummary doctorSummary = new ConsultationFinalizeResponse.DoctorSummary();
            doctorSummary.setConsultationDate(appointment.getDate().toString());
            doctorSummary.setClinician("Dr. " + doctor.getFirstName() + " " + doctor.getLastName());
            doctorSummary.setSpecialty("Stomatologie");
            doctorSummary.setPresentationType("prima prezentare");
            doctorSummary.setChiefComplaint("Pacientul se prezintă pentru: " + transcriptPreview);
            doctorSummary.setGeneralMedicalHistory(new ArrayList<>());
            doctorSummary.setDentalHistory(new ArrayList<>());
            doctorSummary.setGeneralObservations(new ArrayList<>());
            doctorSummary.setSpecialtySpecificObservations(new ArrayList<>());
            doctorSummary.setAvailableInvestigations(new ArrayList<>());
            doctorSummary.setClinicalPhotos(new ArrayList<>());
            doctorSummary.setOtherDocuments(new ArrayList<>());
            doctorSummary.setClinicianNote("Notă clinică va fi disponibilă după revizuire.");
            doctorSummary.setActionsPerformed(Arrays.asList("examinare clinică", "discuții explicative cu pacientul"));
            doctorSummary.setInformationSources(Arrays.asList("raport pacient", "observații clinician"));
            doctorSummary.setIncludeChiefComplaint(true);
            doctorSummary.setIncludeObservationsSummary(true);
            doctorSummary.setIncludeActionsPerformed(true);
            doctorSummary.setIncludeNextSteps(true);
            doctorSummary.setExcludeClinicianNote(true);
            doctorSummary.setExcludeSensitiveObservations(false);
            
            return new ConsultationFinalizeResponse(claritySheet, doctorSummary);
        }
    }

    /**
     * Save a consultation segment
     */
    public ConsultationSegmentResponse saveSegment(Long consultationId, ConsultationSegmentRequest request) {
        ConsultationSegment segment = new ConsultationSegment();
        segment.setConsultationId(consultationId);
        segment.setText(request.getText());
        segment.setStartTs(request.getStartTs());
        segment.setEndTs(request.getEndTs());
        segment.setSpeaker(request.getSpeaker());
        
        ConsultationSegment saved = consultationSegmentRepository.save(segment);
        return new ConsultationSegmentResponse(saved.getId());
    }

    /**
     * Save a consultation message
     */
    public ConsultationMessageResponse saveMessage(Long consultationId, ConsultationMessageRequest request) {
        ConsultationMessage message = new ConsultationMessage();
        message.setConsultationId(consultationId);
        message.setRole(request.getRole());
        message.setContent(request.getContent());
        message.setOutputType(request.getOutputType());
        
        ConsultationMessage saved = consultationMessageRepository.save(message);
        return new ConsultationMessageResponse(
            saved.getId(),
            saved.getRole(),
            saved.getContent(),
            saved.getOutputType(),
            saved.getCreatedAt()
        );
    }

    /**
     * Get all messages for a consultation
     */
    public List<ConsultationMessageResponse> getMessages(Long consultationId) {
        List<ConsultationMessage> messages = consultationMessageRepository.findByConsultationIdOrderByCreatedAtAsc(consultationId);
        return messages.stream()
            .map(msg -> new ConsultationMessageResponse(
                msg.getId(),
                msg.getRole(),
                msg.getContent(),
                msg.getOutputType(),
                msg.getCreatedAt()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Get all segments for a consultation
     */
    public List<ConsultationSegment> getSegments(Long consultationId) {
        return consultationSegmentRepository.findByConsultationIdOrderByStartTsAsc(consultationId);
    }

    /**
     * Save finalized consultation data
     */
    private void saveFinalizedConsultation(Long appointmentId, Appointment appointment, ConsultationFinalizeResponse response) {
        try {
            // Check if already exists
            Optional<FinalizedConsultation> existing = finalizedConsultationRepository.findByAppointmentId(appointmentId);
            FinalizedConsultation finalized;
            
            if (existing.isPresent()) {
                finalized = existing.get();
            } else {
                finalized = new FinalizedConsultation();
                finalized.setAppointmentId(appointmentId);
                finalized.setDoctorId(appointment.getDoctorId());
                finalized.setPatientId(appointment.getPatientId());
            }
            
            // Convert response to JSON strings
            String patientClaritySheetJson = objectMapper.writeValueAsString(response.getPatientClaritySheet());
            String doctorSummaryJson = objectMapper.writeValueAsString(response.getDoctorSummary());
            
            finalized.setPatientClaritySheet(patientClaritySheetJson);
            finalized.setDoctorSummary(doctorSummaryJson);
            
            // Extract chief complaint for quick reference
            String chiefComplaint = response.getDoctorSummary() != null && 
                    response.getDoctorSummary().getChiefComplaint() != null ?
                    response.getDoctorSummary().getChiefComplaint() : "";
            finalized.setChiefComplaint(chiefComplaint.length() > 200 ? 
                    chiefComplaint.substring(0, 200) + "..." : chiefComplaint);
            
            // Set consultation date from appointment
            finalized.setConsultationDate(java.time.Instant.ofEpochMilli(
                    java.sql.Timestamp.valueOf(
                            appointment.getDate().atTime(appointment.getTime())
                    ).getTime()
            ));
            
            finalizedConsultationRepository.save(finalized);
            log.info("Finalized consultation saved for appointment {}", appointmentId);
        } catch (Exception e) {
            log.error("Error saving finalized consultation for appointment " + appointmentId, e);
            // Don't throw - finalization should still succeed even if save fails
        }
    }

    /**
     * Get all finalized consultations for a doctor
     */
    public List<FinalizedConsultation> getFinalizedConsultations(Long doctorId) {
        return finalizedConsultationRepository.findByDoctorIdOrderByConsultationDateDesc(doctorId);
    }

    /**
     * Get finalized consultation by appointment ID
     */
    public Optional<FinalizedConsultation> getFinalizedConsultation(Long appointmentId) {
        return finalizedConsultationRepository.findByAppointmentId(appointmentId);
    }

    /**
     * Structure consultation segments (facts only, no analysis)
     */
    public ConsultationStructureResponse structureConsultation(Long consultationId, ConsultationStructureRequest request) throws Exception {
        // Get segments to structure
        List<ConsultationSegment> segments;
        if (request.getSegmentIds() != null && !request.getSegmentIds().isEmpty()) {
            segments = consultationSegmentRepository.findByConsultationIdAndIdInOrderByStartTsAsc(consultationId, request.getSegmentIds());
        } else {
            // Get last segment
            List<ConsultationSegment> allSegments = consultationSegmentRepository.findByConsultationIdOrderByStartTsAsc(consultationId);
            if (allSegments.isEmpty()) {
                throw new IllegalArgumentException("No segments found for consultation " + consultationId);
            }
            segments = Arrays.asList(allSegments.get(allSegments.size() - 1));
        }

        if (segments.isEmpty()) {
            throw new IllegalArgumentException("No segments found");
        }

        // Build transcript from segments
        StringBuilder transcriptBuilder = new StringBuilder();
        for (ConsultationSegment seg : segments) {
            if (seg.getSpeaker() != null) {
                transcriptBuilder.append("[").append(seg.getSpeaker()).append("] ");
            }
            transcriptBuilder.append(seg.getText()).append(" ");
        }
        String transcript = transcriptBuilder.toString().trim();

        // System prompt for Structure (facts only, NO analysis)
        String systemPrompt = "You are a documentation assistant for dentists. Your role is to organize factual information from consultation transcripts.\n" +
                "\n" +
                "CRITICAL RULES:\n" +
                "1. Extract ONLY facts that were explicitly stated. Do NOT infer causes or diagnoses.\n" +
                "2. Do NOT use language like \"could be\", \"might be\", \"probably\", \"este\", \"cel mai probabil\".\n" +
                "3. Do NOT provide diagnosis or treatment recommendations.\n" +
                "4. Use neutral phrasing: \"de clarificat\", \"de documentat\", \"context din ghiduri\".\n" +
                "5. Output language: match conversation (RO/EN) automatically.\n" +
                "\n" +
                "Return ONLY valid JSON in this EXACT format:\n" +
                "{\n" +
                "  \"type\": \"structured_notes\",\n" +
                "  \"content\": {\n" +
                "    \"chief_complaint\": \"[What patient said as reason for visit - direct quote or paraphrase]\",\n" +
                "    \"history\": [\"fact 1\", \"fact 2\"],\n" +
                "    \"symptoms\": [\"symptom 1\", \"symptom 2\"],\n" +
                "    \"meds_allergies\": [\"medication/allergy mentioned\"],\n" +
                "    \"exam_observations\": [\"observation 1\", \"observation 2\"],\n" +
                "    \"patient_words\": [\"short quote 1\", \"short quote 2\"],\n" +
                "    \"timeline\": [\"timeline item 1\", \"timeline item 2\"]\n" +
                "  }\n" +
                "}\n" +
                "\n" +
                "All fields should contain ONLY factual information from the transcript. No interpretations.";

        String userPrompt = "Organize the following consultation transcript into structured notes (facts only):\n\n" +
                transcript + "\n\n" +
                "Return ONLY valid JSON in the format specified above. No other text.";

        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPrompt));

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        String aiResponse = openAiChatService.streamChat(messages, "", null, outputStream);

        // Parse response
        ConsultationStructureResponse response = parseStructureResponse(aiResponse);
        response.setGeneratedAt(java.time.Instant.now());
        return response;
    }

    /**
     * Analyze consultation segments (structure + literature + gaps, NO diagnosis/treatment)
     */
    public ConsultationAnalyzeResponse analyzeConsultation(Long consultationId, ConsultationAnalyzeRequest request) throws Exception {
        // Get segments to analyze
        List<ConsultationSegment> segments;
        if (request.getSegmentIds() != null && !request.getSegmentIds().isEmpty()) {
            segments = consultationSegmentRepository.findByConsultationIdAndIdInOrderByStartTsAsc(consultationId, request.getSegmentIds());
        } else {
            // Get last segment
            List<ConsultationSegment> allSegments = consultationSegmentRepository.findByConsultationIdOrderByStartTsAsc(consultationId);
            if (allSegments.isEmpty()) {
                throw new IllegalArgumentException("No segments found for consultation " + consultationId);
            }
            segments = Arrays.asList(allSegments.get(allSegments.size() - 1));
        }

        if (segments.isEmpty()) {
            throw new IllegalArgumentException("No segments found");
        }

        // Build transcript from segments
        StringBuilder transcriptBuilder = new StringBuilder();
        for (ConsultationSegment seg : segments) {
            if (seg.getSpeaker() != null) {
                transcriptBuilder.append("[").append(seg.getSpeaker()).append("] ");
            }
            transcriptBuilder.append(seg.getText()).append(" ");
        }
        String transcript = transcriptBuilder.toString().trim();

        // System prompt for Analyze (documentation + literature, NO diagnosis/treatment)
        String systemPrompt = "You are a documentation assistant for dentists. Your role is to help organize consultation notes and provide context from literature for documentation purposes.\n" +
                "\n" +
                "CRITICAL RULES:\n" +
                "1. NEVER provide diagnosis or treatment recommendations.\n" +
                "2. NEVER use language like \"este\", \"cel mai probabil\", \"tratament\", \"recomand\", \"prescrie\", \"antibiotic\".\n" +
                "3. You can mention \"posibile explicații informaționale\" ONLY as \"things to consider documenting\", NOT as conclusions.\n" +
                "4. Use neutral phrasing: \"de clarificat\", \"de documentat\", \"context din ghiduri\", \"întrebări utile\", \"posibile interpretări informaționale (nu concluzii)\".\n" +
                "5. Include sources. If no credible sources found, return sources: [] and reduce output to only clarifications/questions.\n" +
                "6. Output language: match conversation (RO/EN) automatically.\n" +
                "\n" +
                "Return ONLY valid JSON in this EXACT format:\n" +
                "{\n" +
                "  \"type\": \"zenlink_analyze\",\n" +
                "  \"structured\": { ...same structure as structure endpoint... },\n" +
                "  \"clarifications\": [\n" +
                "    {\"title\": \"Clarificare utilă\", \"items\": [\"item1\", \"item2\"]}\n" +
                "  ],\n" +
                "  \"documentation_gaps\": [\n" +
                "    {\"label\": \"Nu apare documentat explicit\", \"items\": [\"gap1\", \"gap2\"], \"severity\": \"low\"}\n" +
                "  ],\n" +
                "  \"suggested_questions\": [\"question1\", \"question2\"],\n" +
                "  \"sources\": [\n" +
                "    {\"title\": \"...\", \"publisher\": \"...\", \"year\": \"...\", \"url\": \"...\"}\n" +
                "  ],\n" +
                "  \"tone\": \"documentation_assistant\"\n" +
                "}\n" +
                "\n" +
                "The voice must feel like \"assistant that helps you document and double-check completeness\". Never claim to diagnose or treat.";

        String userPrompt = "Analyze this consultation transcript for documentation purposes:\n\n" +
                transcript + "\n\n" +
                "Return ONLY valid JSON in the format specified above. No other text.";

        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPrompt));

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        String aiResponse = openAiChatService.streamChat(messages, "", null, outputStream);

        // Post-process: check for banned terms
        String lowerResponse = aiResponse.toLowerCase();
        String[] bannedTerms = {"diagnostic", "este", "cel mai probabil", "tratament", "recomand", "prescrie", "antibiotic"};
        boolean hasBannedTerm = false;
        for (String term : bannedTerms) {
            if (lowerResponse.contains(term)) {
                hasBannedTerm = true;
                log.warn("Banned term detected in AI response: {}", term);
                break;
            }
        }

        if (hasBannedTerm) {
            // Regenerate with stricter prompt
            systemPrompt += "\n\nCRITICAL: The previous response contained banned terms. Regenerate with even stricter adherence to documentation-only language.";
            messages = new ArrayList<>();
            messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
            messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPrompt));
            outputStream = new ByteArrayOutputStream();
            aiResponse = openAiChatService.streamChat(messages, "", null, outputStream);
        }

        // Parse response
        ConsultationAnalyzeResponse response = parseAnalyzeResponse(aiResponse);
        response.setGeneratedAt(java.time.Instant.now());
        return response;
    }

    private ConsultationStructureResponse parseStructureResponse(String aiResponse) throws Exception {
        try {
            // Remove markdown code blocks if present
            String jsonStr = aiResponse.trim();
            jsonStr = jsonStr.replaceAll("(?i)^```json\\s*", "");
            jsonStr = jsonStr.replaceAll("^```\\s*", "");
            jsonStr = jsonStr.replaceAll("\\s*```$", "");

            // Extract JSON object
            int jsonStart = jsonStr.indexOf("{");
            int jsonEnd = jsonStr.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }

            // Parse JSON
            Map<String, Object> parsed = objectMapper.readValue(jsonStr, Map.class);

            ConsultationStructureResponse response = new ConsultationStructureResponse();
            response.setType("structured_notes");

            if (parsed.get("content") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> contentMap = (Map<String, Object>) parsed.get("content");
                ConsultationStructureResponse.StructuredContent content = new ConsultationStructureResponse.StructuredContent();
                content.setChief_complaint((String) contentMap.get("chief_complaint"));
                if (contentMap.get("history") instanceof List) {
                    content.setHistory((List<String>) contentMap.get("history"));
                }
                if (contentMap.get("symptoms") instanceof List) {
                    content.setSymptoms((List<String>) contentMap.get("symptoms"));
                }
                if (contentMap.get("meds_allergies") instanceof List) {
                    content.setMeds_allergies((List<String>) contentMap.get("meds_allergies"));
                }
                if (contentMap.get("exam_observations") instanceof List) {
                    content.setExam_observations((List<String>) contentMap.get("exam_observations"));
                }
                if (contentMap.get("patient_words") instanceof List) {
                    content.setPatient_words((List<String>) contentMap.get("patient_words"));
                }
                if (contentMap.get("timeline") instanceof List) {
                    content.setTimeline((List<String>) contentMap.get("timeline"));
                }
                response.setContent(content);
            }

            return response;
        } catch (Exception e) {
            log.warn("Failed to parse structure response, using fallback: {}", e.getMessage());
            // Fallback
            ConsultationStructureResponse response = new ConsultationStructureResponse();
            response.setType("structured_notes");
            ConsultationStructureResponse.StructuredContent content = new ConsultationStructureResponse.StructuredContent();
            content.setChief_complaint("Consultation notes");
            content.setHistory(new ArrayList<>());
            content.setSymptoms(new ArrayList<>());
            content.setMeds_allergies(new ArrayList<>());
            content.setExam_observations(new ArrayList<>());
            content.setPatient_words(new ArrayList<>());
            content.setTimeline(new ArrayList<>());
            response.setContent(content);
            return response;
        }
    }

    private ConsultationAnalyzeResponse parseAnalyzeResponse(String aiResponse) throws Exception {
        try {
            // Remove markdown code blocks if present
            String jsonStr = aiResponse.trim();
            jsonStr = jsonStr.replaceAll("(?i)^```json\\s*", "");
            jsonStr = jsonStr.replaceAll("^```\\s*", "");
            jsonStr = jsonStr.replaceAll("\\s*```$", "");

            // Extract JSON object
            int jsonStart = jsonStr.indexOf("{");
            int jsonEnd = jsonStr.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }

            // Parse JSON
            Map<String, Object> parsed = objectMapper.readValue(jsonStr, Map.class);

            ConsultationAnalyzeResponse response = new ConsultationAnalyzeResponse();
            response.setType("zenlink_analyze");
            response.setTone("documentation_assistant");

            // Parse structured content
            if (parsed.get("structured") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> structuredMap = (Map<String, Object>) parsed.get("structured");
                ConsultationStructureResponse.StructuredContent structured = new ConsultationStructureResponse.StructuredContent();
                structured.setChief_complaint((String) structuredMap.get("chief_complaint"));
                if (structuredMap.get("history") instanceof List) {
                    structured.setHistory((List<String>) structuredMap.get("history"));
                }
                if (structuredMap.get("symptoms") instanceof List) {
                    structured.setSymptoms((List<String>) structuredMap.get("symptoms"));
                }
                if (structuredMap.get("meds_allergies") instanceof List) {
                    structured.setMeds_allergies((List<String>) structuredMap.get("meds_allergies"));
                }
                if (structuredMap.get("exam_observations") instanceof List) {
                    structured.setExam_observations((List<String>) structuredMap.get("exam_observations"));
                }
                if (structuredMap.get("patient_words") instanceof List) {
                    structured.setPatient_words((List<String>) structuredMap.get("patient_words"));
                }
                if (structuredMap.get("timeline") instanceof List) {
                    structured.setTimeline((List<String>) structuredMap.get("timeline"));
                }
                response.setStructured(structured);
            }

            // Parse clarifications
            if (parsed.get("clarifications") instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> clarList = (List<Map<String, Object>>) parsed.get("clarifications");
                List<ConsultationAnalyzeResponse.Clarification> clarifications = new ArrayList<>();
                for (Map<String, Object> clarMap : clarList) {
                    ConsultationAnalyzeResponse.Clarification clar = new ConsultationAnalyzeResponse.Clarification();
                    clar.setTitle((String) clarMap.get("title"));
                    if (clarMap.get("items") instanceof List) {
                        clar.setItems((List<String>) clarMap.get("items"));
                    }
                    clarifications.add(clar);
                }
                response.setClarifications(clarifications);
            }

            // Parse documentation gaps
            if (parsed.get("documentation_gaps") instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> gapsList = (List<Map<String, Object>>) parsed.get("documentation_gaps");
                List<ConsultationAnalyzeResponse.DocumentationGap> gaps = new ArrayList<>();
                for (Map<String, Object> gapMap : gapsList) {
                    ConsultationAnalyzeResponse.DocumentationGap gap = new ConsultationAnalyzeResponse.DocumentationGap();
                    gap.setLabel((String) gapMap.get("label"));
                    if (gapMap.get("items") instanceof List) {
                        gap.setItems((List<String>) gapMap.get("items"));
                    }
                    gap.setSeverity((String) gapMap.get("severity"));
                    gaps.add(gap);
                }
                response.setDocumentation_gaps(gaps);
            }

            // Parse suggested questions
            if (parsed.get("suggested_questions") instanceof List) {
                response.setSuggested_questions((List<String>) parsed.get("suggested_questions"));
            }

            // Parse sources
            if (parsed.get("sources") instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> sourcesList = (List<Map<String, Object>>) parsed.get("sources");
                List<ConsultationAnalyzeResponse.Source> sources = new ArrayList<>();
                for (Map<String, Object> sourceMap : sourcesList) {
                    ConsultationAnalyzeResponse.Source source = new ConsultationAnalyzeResponse.Source();
                    source.setTitle((String) sourceMap.get("title"));
                    source.setPublisher((String) sourceMap.get("publisher"));
                    source.setYear((String) sourceMap.get("year"));
                    source.setUrl((String) sourceMap.get("url"));
                    sources.add(source);
                }
                response.setSources(sources);
            }

            return response;
        } catch (Exception e) {
            log.warn("Failed to parse analyze response, using fallback: {}", e.getMessage());
            // Fallback
            ConsultationAnalyzeResponse response = new ConsultationAnalyzeResponse();
            response.setType("zenlink_analyze");
            response.setTone("documentation_assistant");
            response.setStructured(new ConsultationStructureResponse.StructuredContent());
            response.setClarifications(new ArrayList<>());
            response.setDocumentation_gaps(new ArrayList<>());
            response.setSuggested_questions(new ArrayList<>());
            response.setSources(new ArrayList<>());
            return response;
        }
    }

    /**
     * Structure consultation - NEW format with StructuredNote schema (exact match with frontend)
     */
    public StructuredNoteResponse structureConsultationNew(Long consultationId, StructureRequest request) throws Exception {
        String requestId = "req-" + System.currentTimeMillis() + "-" + consultationId;
        log.info("Structure request {} for consultation {} - transcript length: {}", 
            requestId, consultationId, 
            request.getFullTranscript() != null ? request.getFullTranscript().length() : 0);
        
        String inputText = request.getInputText();
        String fullTranscript = request.getFullTranscript();
        String lang = request.getLang() != null ? request.getLang() : "ro";

        if ((inputText == null || inputText.trim().isEmpty()) && 
            (fullTranscript == null || fullTranscript.trim().isEmpty())) {
            throw new IllegalArgumentException("No text provided to structure");
        }

        // Build complete transcript from all sources - ALWAYS use FULL transcript
        // Priority: fullTranscript (contains ALL segments merged) > messages > inputText
        StringBuilder transcriptBuilder = new StringBuilder();
        
        // STEP 1: Use fullTranscript if available (contains ALL segments merged)
        if (fullTranscript != null && !fullTranscript.trim().isEmpty()) {
            transcriptBuilder.append(fullTranscript.trim());
        }
        
        // STEP 2: Add messages if available (doctor/assistant conversation)
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            // Filter to get only doctor messages (patient speech)
            List<String> doctorMessages = new ArrayList<>();
            for (StructureRequest.MessageDto msg : request.getMessages()) {
                if ("doctor".equals(msg.getRole()) && msg.getContent() != null && !msg.getContent().trim().isEmpty()) {
                    doctorMessages.add(msg.getContent().trim());
                }
            }
            
            // Add doctor messages if not already in fullTranscript
            if (!doctorMessages.isEmpty()) {
                String messagesText = String.join(" ", doctorMessages);
                // Only add if it's not already in fullTranscript (avoid duplication)
                if (transcriptBuilder.length() == 0 || !transcriptBuilder.toString().contains(messagesText.substring(0, Math.min(50, messagesText.length())))) {
                    if (transcriptBuilder.length() > 0) {
                        transcriptBuilder.append(" ");
                    }
                    transcriptBuilder.append(messagesText);
                }
            }
        }
        
        // STEP 3: Add inputText only if it's different from fullTranscript (new draft)
        if (inputText != null && !inputText.trim().isEmpty()) {
            String inputTextTrimmed = inputText.trim();
            // Only add if it's not already in the transcript
            if (transcriptBuilder.length() == 0 || !transcriptBuilder.toString().contains(inputTextTrimmed.substring(0, Math.min(50, inputTextTrimmed.length())))) {
                if (transcriptBuilder.length() > 0) {
                    transcriptBuilder.append(" ");
                }
                transcriptBuilder.append(inputTextTrimmed);
            }
        }
        
        String transcript = transcriptBuilder.toString().trim();
        log.info("Structure request {} - final transcript length: {} chars (fullTranscript: {}, inputText: {}, messages: {})", 
            requestId, transcript.length(),
            fullTranscript != null ? fullTranscript.length() : 0,
            inputText != null ? inputText.length() : 0,
            request.getMessages() != null ? request.getMessages().size() : 0);

        if (transcript.length() < 10) {
            throw new IllegalArgumentException("Transcript too short (minimum 10 characters)");
        }

        // Build patient context string
        String patientContextStr = "";
        if (request.getPatientContext() != null) {
            StructureRequest.PatientContextDto pc = request.getPatientContext();
            patientContextStr = String.format("Pacient: %s, %s ani. Motiv consultație: %s", 
                pc.getName() != null ? pc.getName() : "N/A",
                pc.getAge() != null ? pc.getAge() : "N/A",
                pc.getReason() != null ? pc.getReason() : "N/A");
        }

        // System prompt for StructuredNote - CLEAR, DETAILED consultation note
        String systemPrompt = "You are a clinical documentation assistant for dentists.\n\n" +
                "Your task is to generate a CLEAR, DETAILED consultation note from the transcript.\n\n" +
                "CRITICAL RULES:\n" +
                "1. Extract REAL medical information from transcript - be DETAILED\n" +
                "2. NEVER use generic labels like \"Durere menționată\" or \"Umflătură menționată\"\n" +
                "3. Extract actual descriptions: pain type, location, characteristics, duration, triggers\n" +
                "4. If something is NOT mentioned in transcript, leave field empty (don't invent)\n" +
                "5. Write in clean Romanian, use bullet points, be detailed but clear\n" +
                "6. Remove speaker tags (\"Medic:\", \"Pacient:\"), greetings, filler words\n" +
                "7. Do NOT infer causes or diagnoses - only extract mentioned facts\n\n" +
                "OUTPUT FORMAT - Return ONLY JSON (use these exact field names):\n" +
                "{\n" +
                "  \"title\": \"📝 Consultation Note\",\n" +
                "  \"language\": \"ro\",\n" +
                "  \"chiefComplaint\": \"Short clear sentence describing why patient came (max 200 chars) - Motiv principal\",\n" +
                "  \"timeline\": [\"When it started - când a început\", \"How it evolved - cum a evoluat\", \"Triggers (cold, sweet, chewing) - triggeri\"],\n" +
                "  \"symptoms\": [\"Swelling - Umflătură\", \"Headache - Cefalee\", \"Ear pain - Durere ureche\", \"Fever - Febră\", \"Fatigue - Oboseală\", \"etc from transcript - Simptome asociate\"],\n" +
                "  \"riskFactors\": [\"Oral hygiene - Igienă orală\", \"Smoking - Fumat\", \"Sugar intake - Consum zahăr\", \"etc - Obiceiuri relevante\"],\n" +
                "  \"meds\": [\"What patient took and effect - Medicație menționată\"],\n" +
                "  \"allergies\": [\"If mentioned - Alergii\"],\n" +
                "  \"observations\": [\"Fear of dentist - Frică de dentist\", \"Delayed visit - Amânare consultație\", \"Behavior-related - Observații din discuție\"],\n" +
                "  \"dentalHistory\": [\"Last visit - Ultima vizită\", \"Old fillings - Plombe vechi\", \"Past problems - Probleme anterioare - Context dentar anterior\"],\n" +
                "  \"disclaimer\": \"Structurare pentru documentare. Nu înlocuiește evaluarea clinică.\"\n" +
                "}\n\n" +
                "EXTRACTION EXAMPLES:\n" +
                "If transcript says: \"zis că nu mai amân. Parcă pulsează uneori şi simt durerea până în obraz şi puţin spre ureche\"\n" +
                "Extract:\n" +
                "  chiefComplaint: \"Durere pulsatilă măsea, iradiază spre obraz și ureche\"\n" +
                "  timeline: [\"Durere pulsatilă intermitentă\", \"Iradiere spre obraz și ureche\"]\n" +
                "  symptoms: [\"Cefalee asociată\"]\n\n" +
                "If transcript mentions swelling:\n" +
                "  symptoms: [\"Umflătură gingivală\" or \"Umflătură la nivelul măselei\" - extract actual location]\n\n" +
                "NEVER output generic labels. ALWAYS extract specific details from transcript.";

        String userPrompt = "Generate a CLEAR, DETAILED consultation note from the following transcript.\n\n" +
                "Extract REAL medical information. Be DETAILED. Use actual info from transcript.\n" +
                "If something is NOT mentioned, leave that field empty (don't invent).\n\n" +
                (patientContextStr.isEmpty() ? "" : patientContextStr + "\n\n") +
                "FULL TRANSCRIPT:\n" + transcript + "\n\n" +
                "Return ONLY valid JSON in the specified format. No markdown, no text before or after JSON.\n" +
                "Extract specific details - pain type, location, duration, triggers, symptoms, habits, medication, allergies, observations, dental history.";

        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPrompt));

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        // Try up to 2 times
        StructuredNoteResponse.StructuredNote structuredNote = null;
        Exception lastError = null;
        
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                log.info("Structure attempt {} for request {}", attempt + 1, requestId);
                String aiResponse = openAiChatService.streamChat(messages, "", null, outputStream);
                log.info("Structure AI response length: {}", aiResponse != null ? aiResponse.length() : 0);
                
                // Parse and validate response
                structuredNote = parseStructuredNote(aiResponse, lang, transcript);
                
                // STEP 4: Post-processing rules - fill empty fields
                if (structuredNote != null) {
                    if (structuredNote.getChiefComplaint() == null || structuredNote.getChiefComplaint().trim().isEmpty()) {
                        structuredNote.setChiefComplaint("Nu a fost menționat explicit.");
                    }
                    if (structuredNote.getSymptoms() == null) {
                        structuredNote.setSymptoms(new ArrayList<>());
                    }
                    if (structuredNote.getTimeline() == null) {
                        structuredNote.setTimeline(new ArrayList<>());
                    }
                    if (structuredNote.getTriggers() == null) {
                        structuredNote.setTriggers(new ArrayList<>());
                    }
                    if (structuredNote.getRiskFactors() == null) {
                        structuredNote.setRiskFactors(new ArrayList<>());
                    }
                    if (structuredNote.getDentalHistory() == null) {
                        structuredNote.setDentalHistory(new ArrayList<>());
                    }
                    if (structuredNote.getMeds() == null) {
                        structuredNote.setMeds(new ArrayList<>());
                    }
                    if (structuredNote.getAllergies() == null) {
                        structuredNote.setAllergies(new ArrayList<>());
                    }
                    if (structuredNote.getObservations() == null) {
                        structuredNote.setObservations(new ArrayList<>());
                    }
                    if (structuredNote.getMissingInfo() == null) {
                        structuredNote.setMissingInfo(new ArrayList<>());
                    }
                }
                
                // Validate: check for verbatim copying, speaker tags, and generic labels
                if (structuredNote != null && validateStructuredNote(structuredNote, transcript)) {
                    // Check if symptoms array < 2 items - if so, retry once
                    if (structuredNote.getSymptoms() != null && structuredNote.getSymptoms().size() < 2 && attempt == 0) {
                        log.warn("Structure response has < 2 symptoms, will retry extraction...");
                        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", 
                            "Răspunsul anterior a avut prea puține simptome. Extrage cel puțin 2 simptome concrete din transcript. " +
                            "NU folosi etichete generice precum \"Durere menționată\". Extrage descrieri reale: tip durere, localizare, caracteristici."));
                        continue; // Retry
                    }
                    
                    log.info("Structure response validated for request {}: chiefComplaint length: {}, symptoms: {}", 
                        requestId, structuredNote.getChiefComplaint().length(), structuredNote.getSymptoms().size());
                    break;
                } else {
                    log.warn("Structure response failed validation (verbatim copy, speaker tags, or generic labels), retrying...");
                    if (attempt == 0) {
                        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", 
                            "Răspunsul anterior conținea copiere verbatim, tag-uri de vorbitor sau etichete generice. " +
                            "EXTRAGE și REFORMULEAZĂ informațiile, NU copia verbatim. Elimină \"Medic:\", \"Pacient:\", \"Bună ziua\". " +
                            "NU folosi etichete generice precum \"Durere menționată\" - extrage descrieri reale. " +
                            "Returnează DOAR JSON valid cu informații normalizate."));
                    }
                }
            } catch (Exception e) {
                lastError = e;
                log.error("Structure attempt {} failed for request {}: {}", attempt + 1, requestId, e.getMessage());
                if (attempt == 0) {
                    messages.add(new com.zenlink.zenlink.dto.AiMessage("user", 
                        "Răspunsul anterior nu a fost JSON valid. Returnează DOAR JSON valid în formatul specificat, fără text suplimentar."));
                }
            }
        }
        
        if (structuredNote == null || structuredNote.getChiefComplaint() == null || 
            structuredNote.getChiefComplaint().trim().isEmpty() ||
            structuredNote.getChiefComplaint().toLowerCase().contains("consultație pentru") ||
            structuredNote.getChiefComplaint().toLowerCase().contains("evaluare")) {
            log.error("Failed to get valid structured note after 2 attempts for request {} - using fallback extraction", requestId);
            // Create fallback with REAL content extracted from transcript
            structuredNote = createFallbackStructuredNote(transcript, lang);
            // Validate fallback has real content
            if (structuredNote.getChiefComplaint() == null || structuredNote.getChiefComplaint().trim().isEmpty()) {
                throw new RuntimeException("Cannot extract meaningful content from transcript. Please provide more details.");
            }
        }
        
        StructuredNoteResponse response = new StructuredNoteResponse();
        response.setRequestId(requestId);
        response.setStructuredNote(structuredNote);
        
        log.info("Structure completed for request {} - chiefComplaint: {}, symptoms: {}, missingInfo: {}", 
            requestId, 
            structuredNote.getChiefComplaint() != null ? structuredNote.getChiefComplaint().substring(0, Math.min(50, structuredNote.getChiefComplaint().length())) : "null",
            structuredNote.getSymptoms() != null ? structuredNote.getSymptoms().size() : 0,
            structuredNote.getMissingInfo() != null ? structuredNote.getMissingInfo().size() : 0);
        
        return response;
    }

    /**
     * Validate StructuredNote - check for verbatim copying, speaker tags, and generic labels
     */
    private boolean validateStructuredNote(StructuredNoteResponse.StructuredNote note, String transcript) {
        // Check for speaker tags
        String[] speakerTags = {"medic:", "pacient:", "bună ziua", "buna ziua", "salut", "mulțumesc", "înțeleg", "zis că", "a zis"};
        String lowerChiefComplaint = note.getChiefComplaint() != null ? note.getChiefComplaint().toLowerCase() : "";
        for (String tag : speakerTags) {
            if (lowerChiefComplaint.contains(tag)) {
                log.warn("Validation failed: chiefComplaint contains speaker tag: {}", tag);
                return false;
            }
        }
        
        // Check for generic labels - STRICT validation
        String[] genericLabels = {
            "durere menționată",
            "umflătură menționată",
            "simptom menționat",
            "observație menționată",
            "durere raportată",
            "umflătură raportată",
            "menționat în discuție",
            "raportat în discuție"
        };
        
        // Check chiefComplaint
        for (String label : genericLabels) {
            if (lowerChiefComplaint.contains(label)) {
                log.warn("Validation failed: chiefComplaint contains generic label: {}", label);
                return false;
            }
        }
        
        // Check symptoms
        if (note.getSymptoms() != null) {
            for (String symptom : note.getSymptoms()) {
                String lowerSymptom = symptom.toLowerCase();
                for (String label : genericLabels) {
                    if (lowerSymptom.equals(label) || lowerSymptom.startsWith(label + " ") || lowerSymptom.endsWith(" " + label)) {
                        log.warn("Validation failed: symptom contains generic label: {}", label);
                        return false;
                    }
                }
            }
        }
        
        // Check observations
        if (note.getObservations() != null) {
            for (String observation : note.getObservations()) {
                String lowerObs = observation.toLowerCase();
                for (String label : genericLabels) {
                    if (lowerObs.equals(label) || lowerObs.startsWith(label + " ") || lowerObs.endsWith(" " + label)) {
                        log.warn("Validation failed: observation contains generic label: {}", label);
                        return false;
                    }
                }
            }
        }
        
        // Check for verbatim copying - more aggressive detection
        String[] fieldsToCheck = {
            note.getChiefComplaint(),
            String.join(" ", note.getSymptoms() != null ? note.getSymptoms() : new ArrayList<>()),
            String.join(" ", note.getObservations() != null ? note.getObservations() : new ArrayList<>())
        };
        
        String lowerTranscript = transcript.toLowerCase().replaceAll("[^a-zăâîșț ]", " ");
        
        for (String field : fieldsToCheck) {
            if (field == null || field.trim().isEmpty()) continue;
            String lowerField = field.toLowerCase().replaceAll("[^a-zăâîșț ]", " ");
            
            // Check for >8 consecutive matching words (more strict)
            String[] fieldWords = lowerField.split("\\s+");
            String[] transcriptWords = lowerTranscript.split("\\s+");
            
            for (int i = 0; i <= transcriptWords.length - 9; i++) {
                int matchCount = 0;
                for (int j = 0; j < fieldWords.length && (i + j) < transcriptWords.length; j++) {
                    if (fieldWords[j].equals(transcriptWords[i + j])) {
                        matchCount++;
                    } else {
                        break;
                    }
                }
                if (matchCount >= 8) {
                    log.warn("Validation failed: verbatim copy detected ({} consecutive words)", matchCount);
                    return false;
                }
            }
            
            // Also check if field is too long and contains too many words from transcript (>70% match)
            if (field.length() > 50) {
                int matchingWords = 0;
                int totalWords = fieldWords.length;
                for (String word : fieldWords) {
                    if (word.length() > 2 && lowerTranscript.contains(" " + word + " ")) {
                        matchingWords++;
                    }
                }
                if (totalWords > 0 && (matchingWords * 100.0 / totalWords) > 70) {
                    log.warn("Validation failed: too many words match transcript ({}%)", (matchingWords * 100 / totalWords));
                    return false;
                }
            }
        }
        
        // Check length constraints
        if (note.getChiefComplaint() != null && note.getChiefComplaint().length() > 180) {
            log.warn("Validation failed: chiefComplaint too long: {}", note.getChiefComplaint().length());
            return false;
        }
        
        if (note.getObservations() != null && note.getObservations().size() > 8) {
            log.warn("Validation failed: observations too many: {}", note.getObservations().size());
            return false;
        }
        
        if (note.getMissingInfo() != null && note.getMissingInfo().size() > 6) {
            log.warn("Validation failed: missingInfo too many: {}", note.getMissingInfo().size());
            return false;
        }
        
        // Check bullet lengths
        if (note.getSymptoms() != null) {
            for (String symptom : note.getSymptoms()) {
                if (symptom.length() > 110) {
                    log.warn("Validation failed: symptom bullet too long: {}", symptom.length());
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Normalize StructuredNote - remove speaker tags, trim, enforce length constraints
     */
    private void normalizeStructuredNote(StructuredNoteResponse.StructuredNote note) {
        // Normalize chiefComplaint
        if (note.getChiefComplaint() != null) {
            String cc = note.getChiefComplaint();
            // Remove speaker tags
            cc = cc.replaceAll("(?i)(medic|pacient|doctor):\\s*", "");
            cc = cc.replaceAll("(?i)^(bună ziua|buna ziua|salut|mulțumesc|înțeleg)[,\\.]?\\s*", "");
            cc = cc.trim();
            // Enforce max length
            if (cc.length() > 180) {
                cc = cc.substring(0, 177) + "...";
            }
            note.setChiefComplaint(cc);
        }
        
        // Normalize all list fields
        normalizeList(note.getSymptoms(), 110);
        normalizeList(note.getTimeline(), 110);
        normalizeList(note.getTriggers(), 110);
        normalizeList(note.getRiskFactors(), 110);
        normalizeList(note.getDentalHistory(), 110);
        normalizeList(note.getMeds(), 110);
        normalizeList(note.getAllergies(), 110);
        normalizeList(note.getObservations(), 110, 8); // Max 8 items
        normalizeList(note.getMissingInfo(), 110, 6); // Max 6 items
    }
    
    private void normalizeList(List<String> list, int maxLength) {
        normalizeList(list, maxLength, Integer.MAX_VALUE);
    }
    
    private void normalizeList(List<String> list, int maxLength, int maxItems) {
        if (list == null) return;
        
        // Remove speaker tags and normalize
        list.replaceAll(item -> {
            String normalized = item.replaceAll("(?i)(medic|pacient|doctor):\\s*", "");
            normalized = normalized.replaceAll("(?i)^(bună ziua|buna ziua|salut|mulțumesc|înțeleg|zis că|a zis)[,\\.]?\\s*", "");
            normalized = normalized.replaceAll("(?i)\\b(zis că|a zis|spus că|mi-a zis)\\b", "");
            normalized = normalized.trim();
            if (normalized.length() > maxLength) {
                normalized = normalized.substring(0, maxLength - 3) + "...";
            }
            return normalized;
        });
        
        // Remove empty items
        list.removeIf(String::isEmpty);
        
        // Limit items
        if (list.size() > maxItems) {
            list.subList(maxItems, list.size()).clear();
        }
    }
    
    /**
     * Post-process StructuredNote - aggressively clean up verbatim text
     */
    private void postProcessStructuredNote(StructuredNoteResponse.StructuredNote note, String transcript) {
        // Clean chiefComplaint - remove common verbatim patterns
        if (note.getChiefComplaint() != null && note.getChiefComplaint().length() > 50) {
            String cc = note.getChiefComplaint();
            // Remove patterns like "zis că", "a zis", etc.
            cc = cc.replaceAll("(?i)\\b(zis că|a zis|spus că|mi-a zis|mi a zis|pacientul a zis|pacientul spus)\\b[,\\.]?\\s*", "");
            // Remove quotes if it looks like a direct quote
            if (cc.startsWith("\"") && cc.endsWith("\"")) {
                cc = cc.substring(1, cc.length() - 1);
            }
            // If still too long and looks like verbatim, truncate and summarize
            if (cc.length() > 180) {
                // Try to extract key info: look for pain, location, duration
                String summary = extractKeyInfo(cc);
                if (summary.length() > 0 && summary.length() < cc.length()) {
                    cc = summary;
                } else {
                    cc = cc.substring(0, 177) + "...";
                }
            }
            note.setChiefComplaint(cc.trim());
        }
        
        // Clean all list fields - remove generic bullets and verbatim text
        cleanList(note.getSymptoms());
        cleanList(note.getObservations());
        cleanList(note.getTimeline());
        cleanList(note.getTriggers());
    }
    
    private void cleanList(List<String> list) {
        if (list == null) return;
        
        list.replaceAll(item -> {
            // Remove verbatim patterns
            String cleaned = item.replaceAll("(?i)\\b(zis că|a zis|spus că|mi-a zis|pacientul a zis|pacientul spus|menționat în discuție|menționat în|menționat că)\\b[,\\.]?\\s*", "");
            // Remove generic patterns
            cleaned = cleaned.replaceAll("(?i)^(durere|umflătură|simptom|observație)\\s+(menționat|raportat|discutat)", "");
            cleaned = cleaned.trim();
            return cleaned;
        });
        
        // Remove generic labels - STRICT filtering
        list.removeIf(item -> {
            if (item == null || item.isEmpty() || item.length() < 5) return true;
            
            String lower = item.toLowerCase().trim();
            
            // Remove generic labels
            String[] genericPatterns = {
                "durere menționată",
                "umflătură menționată",
                "simptom menționat",
                "observație menționată",
                "durere raportată",
                "umflătură raportată",
                "durere discutată",
                "umflătură discutată",
                "menționat în discuție",
                "raportat în discuție",
                "discutat în consultație"
            };
            
            for (String pattern : genericPatterns) {
                if (lower.equals(pattern) || lower.startsWith(pattern + " ") || lower.endsWith(" " + pattern)) {
                    return true;
                }
            }
            
            // Remove if it matches generic pattern
            if (lower.matches("^(durere|umflătură|simptom|observație)\\s+(menționat|raportat|discutat).*")) {
                return true;
            }
            
            return false;
        });
    }
    
    private String extractKeyInfo(String text) {
        // Extract key phrases: pain, location, duration, triggers
        StringBuilder summary = new StringBuilder();
        String lower = text.toLowerCase();
        
        // Look for pain mentions
        if (lower.contains("durere")) {
            int durereIdx = lower.indexOf("durere");
            String context = text.substring(Math.max(0, durereIdx - 20), Math.min(text.length(), durereIdx + 100));
            summary.append(context.trim());
        }
        
        // Look for location
        if (lower.contains("măsea") || lower.contains("dinte")) {
            int idx = lower.indexOf("măsea");
            if (idx == -1) idx = lower.indexOf("dinte");
            String location = text.substring(Math.max(0, idx - 10), Math.min(text.length(), idx + 30));
            if (summary.length() > 0) summary.append(". ");
            summary.append(location.trim());
        }
        
        // Look for duration
        if (lower.contains("săptămân") || lower.contains("zi") || lower.contains("lună")) {
            String[] words = text.split("\\s+");
            for (int i = 0; i < words.length; i++) {
                if (words[i].toLowerCase().contains("săptămân") || 
                    words[i].toLowerCase().contains("zi") || 
                    words[i].toLowerCase().contains("lună")) {
                    String duration = "";
                    if (i > 0) duration += words[i-1] + " ";
                    duration += words[i];
                    if (i < words.length - 1) duration += " " + words[i+1];
                    if (summary.length() > 0) summary.append(". ");
                    summary.append(duration.trim());
                    break;
                }
            }
        }
        
        return summary.length() > 0 ? summary.toString() : text.substring(0, Math.min(180, text.length()));
    }

    /**
     * Parse StructuredNote from AI response
     */
    private StructuredNoteResponse.StructuredNote parseStructuredNote(String aiResponse, String lang, String transcript) throws Exception {
        try {
            log.info("Parsing structured note, length: {}", aiResponse != null ? aiResponse.length() : 0);
            
            // Remove markdown code blocks if present
            String jsonStr = aiResponse.trim();
            jsonStr = jsonStr.replaceAll("(?i)^```json\\s*", "");
            jsonStr = jsonStr.replaceAll("^```\\s*", "");
            jsonStr = jsonStr.replaceAll("\\s*```$", "");

            // Extract JSON object
            int jsonStart = jsonStr.indexOf("{");
            int jsonEnd = jsonStr.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }

            log.debug("Extracted JSON string length: {}", jsonStr.length());

            // Parse JSON
            StructuredNoteResponse.StructuredNote note = objectMapper.readValue(jsonStr, StructuredNoteResponse.StructuredNote.class);
            
            // Validate and fix required fields
            if (note.getTitle() == null || note.getTitle().isEmpty()) {
                note.setTitle("📝 Notă consultație (Structurare)");
            }
            if (note.getLanguage() == null || note.getLanguage().isEmpty()) {
                note.setLanguage(lang);
            }
            // NEVER use generic placeholders - extract from transcript if needed
            if (note.getChiefComplaint() == null || note.getChiefComplaint().isEmpty() || 
                note.getChiefComplaint().toLowerCase().contains("consultație pentru") ||
                note.getChiefComplaint().toLowerCase().contains("evaluare")) {
                // Try to extract from transcript - this should not happen if AI follows instructions
                log.warn("ChiefComplaint is generic or empty, attempting extraction from transcript");
                // Don't set generic - let it fail and retry
                throw new RuntimeException("ChiefComplaint is generic or empty. Retry with better extraction.");
            }
            if (note.getSymptoms() == null) {
                note.setSymptoms(new ArrayList<>());
            }
            if (note.getTimeline() == null) {
                note.setTimeline(new ArrayList<>());
            }
            if (note.getTriggers() == null) {
                note.setTriggers(new ArrayList<>());
            }
            if (note.getRiskFactors() == null) {
                note.setRiskFactors(new ArrayList<>());
            }
            if (note.getDentalHistory() == null) {
                note.setDentalHistory(new ArrayList<>());
            }
            if (note.getMeds() == null) {
                note.setMeds(new ArrayList<>());
            }
            if (note.getAllergies() == null) {
                note.setAllergies(new ArrayList<>());
            }
            if (note.getObservations() == null) {
                note.setObservations(new ArrayList<>());
            }
            if (note.getMissingInfo() == null) {
                note.setMissingInfo(new ArrayList<>());
            }
            if (note.getDisclaimer() == null || note.getDisclaimer().isEmpty()) {
                note.setDisclaimer("Structurare pentru documentare. Nu înlocuiește evaluarea clinică.");
            }

            // Normalize: remove speaker tags, enforce length constraints
            normalizeStructuredNote(note);
            
            // Post-process: aggressively clean up any remaining verbatim text
            postProcessStructuredNote(note, transcript);

            log.info("Parsed structured note: chiefComplaint length: {}, symptoms: {}, missingInfo: {}",
                note.getChiefComplaint().length(),
                note.getSymptoms().size(),
                note.getMissingInfo().size());

            return note;
        } catch (Exception e) {
            log.error("Failed to parse structured note: {}", e.getMessage(), e);
            log.error("Response was: {}", aiResponse != null ? aiResponse.substring(0, Math.min(500, aiResponse.length())) : "null");
            throw new RuntimeException("Eroare la parsarea răspunsului: " + e.getMessage(), e);
        }
    }

    /**
     * Create fallback structured note from transcript (when AI fails) - EXTRACT REAL CONTENT, NO GENERIC LABELS
     */
    private StructuredNoteResponse.StructuredNote createFallbackStructuredNote(String transcript, String lang) {
        log.warn("Creating fallback structured note from transcript - EXTRACTING REAL CONTENT");
        StructuredNoteResponse.StructuredNote note = new StructuredNoteResponse.StructuredNote();
        note.setTitle("📝 Notă consultație (Structurare)");
        note.setLanguage(lang);
        
        // Clean transcript - remove speaker tags
        String cleanTranscript = transcript
            .replaceAll("(?i)(medic|pacient|doctor):\\s*", "")
            .replaceAll("(?i)(bună ziua|buna ziua|salut|mulțumesc|înțeleg)[,\\.]?\\s*", "")
            .replaceAll("(?i)\\b(zis că|a zis|spus că|mi-a zis)\\b", "")
            .trim();
        
        String lowerTranscript = cleanTranscript.toLowerCase();
        String chiefComplaint = "";
        
        // Extract REAL chief complaint - find first meaningful sentence about the problem
        if (lowerTranscript.contains("durere") || lowerTranscript.contains("durer")) {
            int durereIdx = lowerTranscript.indexOf("durere");
            if (durereIdx == -1) durereIdx = lowerTranscript.indexOf("durer");
            // Extract sentence containing "durere"
            String before = cleanTranscript.substring(Math.max(0, durereIdx - 80));
            String after = cleanTranscript.substring(Math.min(cleanTranscript.length(), durereIdx + 150));
            String context = (before + after).trim();
            // Extract first sentence
            String[] sentences = context.split("[.!?]");
            for (String sentence : sentences) {
                String trimmed = sentence.trim();
                if (trimmed.length() > 15 && trimmed.toLowerCase().contains("durere")) {
                    chiefComplaint = trimmed.substring(0, Math.min(180, trimmed.length())).trim();
                    break;
                }
            }
        }
        
        // If still empty, use first meaningful sentence
        if (chiefComplaint.isEmpty()) {
            String[] sentences = cleanTranscript.split("[.!?]");
            for (String sentence : sentences) {
                String trimmed = sentence.trim();
                if (trimmed.length() > 15 && !trimmed.matches("^[\\s\\p{Punct}]+$")) {
                    chiefComplaint = trimmed.substring(0, Math.min(180, trimmed.length())).trim();
                    break;
                }
            }
        }
        
        // If still empty, use first 150 chars
        if (chiefComplaint.isEmpty() || chiefComplaint.length() < 10) {
            chiefComplaint = cleanTranscript.substring(0, Math.min(180, cleanTranscript.length())).trim();
        }
        
        note.setChiefComplaint(chiefComplaint);
        
        // Extract REAL symptoms - find actual descriptions, not generic labels
        List<String> symptoms = new ArrayList<>();
        if (lowerTranscript.contains("puls") || lowerTranscript.contains("pulsează")) {
            symptoms.add("Durere pulsatilă");
        }
        if (lowerTranscript.contains("iradiază") || lowerTranscript.contains("iradiere") || lowerTranscript.contains("spre")) {
            // Extract where it radiates
            int idx = lowerTranscript.indexOf("spre");
            if (idx > 0) {
                String context = cleanTranscript.substring(Math.max(0, idx - 20), Math.min(cleanTranscript.length(), idx + 40));
                String extracted = "Iradiere " + context.substring(context.indexOf("spre")).split("[.!?]")[0].trim();
                if (extracted.length() < 110 && extracted.length() > 5) {
                    symptoms.add(extracted);
                }
            }
        }
        if (lowerTranscript.contains("umfl") || lowerTranscript.contains("inflama")) {
            // Extract location if mentioned
            int idx = lowerTranscript.indexOf("umfl");
            if (idx == -1) idx = lowerTranscript.indexOf("inflama");
            String context = cleanTranscript.substring(Math.max(0, idx - 30), Math.min(cleanTranscript.length(), idx + 50));
            String extracted = context.trim().substring(0, Math.min(110, context.length()));
            if (extracted.length() > 5 && !extracted.toLowerCase().contains("menționat")) {
                symptoms.add(extracted);
            }
        }
        if (lowerTranscript.contains("durere") && symptoms.isEmpty()) {
            // Extract actual pain description
            int idx = lowerTranscript.indexOf("durere");
            String context = cleanTranscript.substring(Math.max(0, idx - 20), Math.min(cleanTranscript.length(), idx + 80));
            String[] words = context.split("\\s+");
            StringBuilder painDesc = new StringBuilder();
            for (int i = 0; i < Math.min(15, words.length); i++) {
                if (painDesc.length() + words[i].length() < 100) {
                    painDesc.append(words[i]).append(" ");
                }
            }
            String extracted = painDesc.toString().trim();
            if (extracted.length() > 10 && !extracted.toLowerCase().contains("menționat")) {
                symptoms.add(extracted);
            }
        }
        
        // Extract REAL observations
        List<String> observations = new ArrayList<>();
        if (lowerTranscript.contains("frică") || lowerTranscript.contains("teamă")) {
            observations.add("Frică de intervenții dentare");
        }
        if (lowerTranscript.contains("amânat") || lowerTranscript.contains("amân")) {
            observations.add("Amânare consultație");
        }
        
        note.setSymptoms(symptoms.isEmpty() ? new ArrayList<>() : symptoms);
        note.setObservations(observations.isEmpty() ? new ArrayList<>() : observations);
        note.setTimeline(new ArrayList<>());
        note.setTriggers(new ArrayList<>());
        note.setRiskFactors(new ArrayList<>());
        note.setDentalHistory(new ArrayList<>());
        note.setMeds(new ArrayList<>());
        note.setAllergies(new ArrayList<>());
        
        // Add missing info if transcript is very short
        List<String> missingInfo = new ArrayList<>();
        if (transcript.length() < 100) {
            missingInfo.add("Durata simptomelor");
            missingInfo.add("Intensitate durere (scală 1-10)");
        }
        note.setMissingInfo(missingInfo);
        note.setDisclaimer("Structurare pentru documentare. Nu înlocuiește evaluarea clinică.");
        
        return note;
    }

    /**
     * Structure consultation - OLD format (kept for backward compatibility)
     */
    public StructureResponse structureConsultationNewOld(Long consultationId, StructureRequest request) throws Exception {
        String inputText = request.getInputText();
        String fullTranscript = request.getFullTranscript();
        String lang = request.getLang() != null ? request.getLang() : "ro";

        if ((inputText == null || inputText.trim().isEmpty()) && 
            (fullTranscript == null || fullTranscript.trim().isEmpty())) {
            throw new IllegalArgumentException("No text provided to structure");
        }

        // Use inputText if available, otherwise fullTranscript
        String transcript = (inputText != null && !inputText.trim().isEmpty()) ? inputText : fullTranscript;

        // Build patient context string
        String patientContextStr = "";
        if (request.getPatientContext() != null) {
            StructureRequest.PatientContextDto pc = request.getPatientContext();
            patientContextStr = String.format("Pacient: %s, %s ani. Motiv: %s", 
                pc.getName() != null ? pc.getName() : "N/A",
                pc.getAge() != null ? pc.getAge() : "N/A",
                pc.getReason() != null ? pc.getReason() : "N/A");
        }

        // System prompt for Structure - FLEXIBLE, HUMAN-LIKE, ADAPTIVE
        String systemPrompt = "Ești ZenLink, un asistent inteligent care ajută medici dentisti să organizeze consultațiile într-un mod natural și util.\n\n" +
                "FILOSOFIA TA:\n" +
                "- Nu ești un formular rigid. Ești un asistent care \"înțelege\" conversația.\n" +
                "- Extragi esențialul din ce s-a discutat efectiv, nu completezi șabloane fixe.\n" +
                "- Structura se adaptează la caz: uneori e relevant istoricul, alteori trigger-ii, alteori contextul psihologic.\n" +
                "- Ton: clar, profesional, dar prietenos. Nu excesiv de rigid, nu prea robotic.\n\n" +
                "REGULI CRITICE:\n" +
                "1. Extrage DOAR faptele explicit menționate. NU face inferențe despre cauze sau diagnostice.\n" +
                "2. NU folosi limbaj precum \"ar putea fi\", \"probabil\", \"este\", \"cel mai probabil\".\n" +
                "3. NU oferi diagnostic sau recomandări de tratament.\n" +
                "4. Adaptează structura la conversație: ce s-a discutat important? Ce a spus pacientul? Ce a observat medicul? Ce s-a decis? Ce urmează?\n" +
                "5. Secțiunile pot varia: \"Problema principală\", \"Istoric + Triggeri\", \"Riscuri + Diferențial\", \"Context psihologic / Obiceiuri / Anxietate\", \"Pași următori\", \"Semnal de alarmă\", \"Întrebări rămase\", etc.\n" +
                "6. Scopul: medicul să citească rapid și să spună \"da, asta e esențialul\", fără să pară că completezi un formular.\n\n" +
                "FORMAT JSON (flexibil - adaptează secțiunile la conversație):\n" +
                "{\n" +
                "  \"mode\": \"structure\",\n" +
                "  \"title\": \"Notă consultație\" (sau alt titlu relevant),\n" +
                "  \"summary\": \"Rezumat natural de 2-3 rânduri despre esențialul discuției\",\n" +
                "  \"sections\": [\n" +
                "    {\"heading\": \"[Titlu adaptat la ce s-a discutat]\", \"bullets\": [\"...\", \"...\"], \"tags\": []},\n" +
                "    {\"heading\": \"[Alt titlu relevant]\", \"bullets\": [\"...\"], \"tags\": []}\n" +
                "  ],\n" +
                "  \"timeline\": [{\"when\": \"când\", \"what\": \"ce\"}] (doar dacă e relevant),\n" +
                "  \"missingInfo\": [\"ce informații ar fi fost utile\"],\n" +
                "  \"safetyNote\": \"Această structură este doar pentru documentare. Nu înlocuiește evaluarea clinică.\"\n" +
                "}\n\n" +
                "IMPORTANT: Adaptează secțiunile la conversație. Nu folosi mereu aceleași titluri. Minimum 3 secțiuni, fiecare cu cel puțin 2 bullets relevante.";

        String userPrompt = "Organizează următoarea transcriere a consultației în note structurate (doar fapte):\n\n" +
                (patientContextStr.isEmpty() ? "" : patientContextStr + "\n\n") +
                transcript + "\n\n" +
                "Returnează DOAR JSON valid în formatul specificat mai sus. Fără markdown, fără text înainte sau după JSON.";

        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPrompt));

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        // Try up to 2 times
        StructureResponse response = null;
        Exception lastError = null;
        
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                log.info("Structure attempt {} for consultation {}", attempt + 1, consultationId);
                String aiResponse = openAiChatService.streamChat(messages, "", null, outputStream);
                log.info("Structure AI response length: {}", aiResponse != null ? aiResponse.length() : 0);
                
                // Parse and validate response
                response = parseStructureResponseNew(aiResponse);
                
                // Validate that we have sections
                if (response.getSections() != null && response.getSections().size() > 0) {
                    log.info("Structure response validated: {} sections", response.getSections().size());
                    break;
                } else {
                    log.warn("Structure response has no sections, retrying...");
                    if (attempt == 0) {
                        // Add retry instruction
                        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", 
                            "Răspunsul anterior nu a avut secțiuni. Returnează DOAR JSON valid cu cel puțin 3 secțiuni, fiecare cu heading și bullets."));
                    }
                }
            } catch (Exception e) {
                lastError = e;
                log.error("Structure attempt {} failed: {}", attempt + 1, e.getMessage());
                if (attempt == 0) {
                    // Add retry instruction
                    messages.add(new com.zenlink.zenlink.dto.AiMessage("user", 
                        "Răspunsul anterior nu a fost JSON valid. Returnează DOAR JSON valid în formatul specificat, fără text suplimentar."));
                }
            }
        }
        
        if (response == null || response.getSections() == null || response.getSections().isEmpty()) {
            log.error("Failed to get valid structure response after 2 attempts");
            throw new RuntimeException("Nu s-a putut genera structura. Te rugăm să încerci din nou. " + 
                (lastError != null ? lastError.getMessage() : ""));
        }
        
        return response;
    }

    /**
     * Analyze consultation - NEW format with strict JSON schema
     */
    public AnalyzeResponse analyzeConsultationNew(Long consultationId, AnalyzeRequest request) throws Exception {
        String inputText = request.getInputText();
        String fullTranscript = request.getFullTranscript();
        String lang = request.getLang() != null ? request.getLang() : "ro";

        if ((inputText == null || inputText.trim().isEmpty()) && 
            (fullTranscript == null || fullTranscript.trim().isEmpty())) {
            throw new IllegalArgumentException("No text provided to analyze");
        }

        // Build complete transcript from all sources - ALWAYS use FULL transcript
        StringBuilder transcriptBuilder = new StringBuilder();
        
        // STEP 1: Use fullTranscript if available (contains ALL segments merged)
        if (fullTranscript != null && !fullTranscript.trim().isEmpty()) {
            transcriptBuilder.append(fullTranscript.trim());
        }
        
        // STEP 2: Add messages if available (doctor/assistant conversation)
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            List<String> doctorMessages = new ArrayList<>();
            for (StructureRequest.MessageDto msg : request.getMessages()) {
                if ("doctor".equals(msg.getRole()) && msg.getContent() != null && !msg.getContent().trim().isEmpty()) {
                    doctorMessages.add(msg.getContent().trim());
                }
            }
            
            if (!doctorMessages.isEmpty()) {
                String messagesText = String.join(" ", doctorMessages);
                if (transcriptBuilder.length() == 0 || !transcriptBuilder.toString().contains(messagesText.substring(0, Math.min(50, messagesText.length())))) {
                    if (transcriptBuilder.length() > 0) {
                        transcriptBuilder.append(" ");
                    }
                    transcriptBuilder.append(messagesText);
                }
            }
        }
        
        // STEP 3: Add inputText only if it's different from fullTranscript (new draft)
        if (inputText != null && !inputText.trim().isEmpty()) {
            String inputTextTrimmed = inputText.trim();
            if (transcriptBuilder.length() == 0 || !transcriptBuilder.toString().contains(inputTextTrimmed.substring(0, Math.min(50, inputTextTrimmed.length())))) {
                if (transcriptBuilder.length() > 0) {
                    transcriptBuilder.append(" ");
                }
                transcriptBuilder.append(inputTextTrimmed);
            }
        }
        
        String transcript = transcriptBuilder.toString().trim();
        log.info("Analyze request for consultation {} - final transcript length: {} chars", consultationId, transcript.length());

        if (transcript.length() < 10) {
            throw new IllegalArgumentException("Transcript too short (minimum 10 characters)");
        }

        // Build patient context string
        String patientContextStr = "";
        if (request.getPatientContext() != null) {
            StructureRequest.PatientContextDto pc = request.getPatientContext();
            patientContextStr = String.format("Pacient: %s, %s ani. Motiv: %s", 
                pc.getName() != null ? pc.getName() : "N/A",
                pc.getAge() != null ? pc.getAge() : "N/A",
                pc.getReason() != null ? pc.getReason() : "N/A");
        }

        // System prompt for ZenLink Analyze - SMART, THOUGHTFUL, NOT ALARMIST
        String systemPrompt = "Ești ZenLink, un asistent inteligent care ajută medici dentisti să gândească mai bine, nu doar să scrie mai repede.\n\n" +
                "FILOSOFIA TA:\n" +
                "- Nu ești un robot care recită. Ești un AI care pare că gândește.\n" +
                "- Evidențiezi 3-6 insight-uri REALE din conversație, nu generalități.\n" +
                "- Formulezi întrebări de clarificare care CHIAR ajută medicul.\n" +
                "- Oferi explicații posibile într-un mod INFORMATIV, nu diagnostic definitiv.\n" +
                "- Notezi ce lipsește (date care ar fi fost utile).\n" +
                "- Ton: curat, util, credibil medical. Quirky dar profesional. \"Ordine în haos\", \"claritate din conversație\".\n\n" +
                "REGULI CRITICE:\n" +
                "1. NICIODATĂ nu spui \"diagnostic\" sau \"tratament recomandat\".\n" +
                "2. NICIODATĂ nu pari că înlocuiești medicul.\n" +
                "3. NICIODATĂ nu fi alarmist. Fii informativ, nu dramatic.\n" +
                "4. Extrage informații medicale semnificative din transcript.\n" +
                "5. Evidențiază pattern-uri reale, nu generalități.\n" +
                "6. Sugerează întrebări care chiar ajută, nu întrebări generice.\n" +
                "7. Oferă context general informativ, nu concluzii.\n\n" +
                "FORMAT JSON:\n" +
                "{\n" +
                "  \"mode\": \"analyze\",\n" +
                "  \"title\": \"🧠 ZenLink Insights\",\n" +
                "  \"summary\": \"Rezumat scurt și natural al consultației\",\n" +
                "  \"aspectsToConsider\": [\"3-6 insight-uri REALE din conversație\", \"Nu generalități\", \"Pattern-uri observate efectiv\"],\n" +
                "  \"usefulClarificationQuestions\": [\"4-6 întrebări SPECIFICE care chiar ajută\", \"Adaptate la cazul concret\"],\n" +
                "  \"possibleGeneralExplanations\": [\"Explicații posibile în mod INFORMATIV\", \"Nu diagnostic definitiv\", \"Limbaj neutru\"],\n" +
                "  \"observedRiskFactors\": [\"Factori de risc observați efectiv din conversație\"],\n" +
                "  \"informativeReferences\": [\"Referințe generale informaționale\", \"Nu link-uri reale necesare\"],\n" +
                "  \"safetyNote\": \"Această analiză este doar informațională. Nu înlocuiește evaluarea clinică.\"\n" +
                "}\n\n" +
                "EXEMPLE BUNE:\n" +
                "aspectsToConsider: [\"Durere agravată în ultimele 48h (de la 3/10 la 7/10)\", \"Sensibilitate la rece și dulce, mai pronunțată la nivelul molarului 36\", \"Pacientul menționează că durerea îl trezește noaptea\"]\n" +
                "usefulClarificationQuestions: [\"Intensitatea durerii pe o scală de 0-10 în acest moment?\", \"Durerea apare spontan sau doar la triggeri specifice (rece, dulce, masticare)?\", \"Există febră sau alte simptome asociate?\"]\n" +
                "possibleGeneralExplanations: [\"Sensibilitatea la rece/dulce poate indica expunere dentină sau carie activă\", \"Umflătura gingivală localizată poate sugera inflamație periapicală sau periodontală\"]\n" +
                "observedRiskFactors: [\"Amânare consultație de 2 săptămâni\", \"Consum zilnic de dulciuri menționat de pacient\"]";

        String userPrompt = "Analizează următoarea transcriere COMPLETĂ a consultației și oferă insights utile pentru doctor:\n\n" +
                (patientContextStr.isEmpty() ? "" : patientContextStr + "\n\n") +
                "TRANSCRIPT COMPLET:\n" + transcript + "\n\n" +
                "Extrage informații medicale semnificative. Evidențiază pattern-uri. Sugerează întrebări utile. Oferă context general informativ.\n" +
                "Returnează DOAR JSON valid în formatul specificat. Fără alt text.";

        List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
        messages.add(new com.zenlink.zenlink.dto.AiMessage("system", systemPrompt));
        messages.add(new com.zenlink.zenlink.dto.AiMessage("user", userPrompt));

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        String aiResponse = openAiChatService.streamChat(messages, "", null, outputStream);

        // Parse and validate response
        AnalyzeResponse response = parseAnalyzeResponseNew(aiResponse);
        return response;
    }

    private StructureResponse parseStructureResponseNew(String aiResponse) throws Exception {
        try {
            log.info("Parsing structure response, length: {}", aiResponse != null ? aiResponse.length() : 0);
            
            // Remove markdown code blocks if present
            String jsonStr = aiResponse.trim();
            jsonStr = jsonStr.replaceAll("(?i)^```json\\s*", "");
            jsonStr = jsonStr.replaceAll("^```\\s*", "");
            jsonStr = jsonStr.replaceAll("\\s*```$", "");

            // Extract JSON object
            int jsonStart = jsonStr.indexOf("{");
            int jsonEnd = jsonStr.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }

            log.debug("Extracted JSON string length: {}", jsonStr.length());

            // Parse JSON
            StructureResponse response = objectMapper.readValue(jsonStr, StructureResponse.class);
            log.info("Parsed structure response, mode: {}, sections count: {}", 
                response.getMode(), 
                response.getSections() != null ? response.getSections().size() : 0);

            // Validate and fix required fields
            if (response.getMode() == null || !response.getMode().equals("structure")) {
                response.setMode("structure");
            }
            if (response.getTitle() == null || response.getTitle().isEmpty()) {
                response.setTitle("Structură consultație");
            }
            if (response.getSummary() == null || response.getSummary().isEmpty()) {
                response.setSummary("Consultație structurată pentru documentare.");
            }
            if (response.getSections() == null) {
                response.setSections(new ArrayList<>());
            }
            
            // Ensure sections have at least some content
            if (response.getSections().isEmpty()) {
                log.warn("Response has no sections, throwing error instead of placeholder");
                throw new RuntimeException("Răspunsul nu conține secțiuni structurate. Te rugăm să încerci din nou.");
            } else {
                // Validate each section has bullets
                for (StructureResponse.SectionDto section : response.getSections()) {
                    if (section.getBullets() == null || section.getBullets().isEmpty()) {
                        log.warn("Section '{}' has no bullets, adding fallback", section.getHeading());
                        section.setBullets(Arrays.asList("Informație de documentat"));
                    }
                    if (section.getTags() == null) {
                        section.setTags(new ArrayList<>());
                    }
                }
            }
            
            if (response.getTimeline() == null) {
                response.setTimeline(new ArrayList<>());
            }
            if (response.getMissingInfo() == null) {
                response.setMissingInfo(new ArrayList<>());
            }
            if (response.getSafetyNote() == null || response.getSafetyNote().isEmpty()) {
                response.setSafetyNote("Această structură este doar pentru documentare. Nu înlocuiește evaluarea clinică.");
            }

            log.info("Final structure response: {} sections, {} timeline items, {} missing info items",
                response.getSections().size(),
                response.getTimeline().size(),
                response.getMissingInfo().size());

            return response;
        } catch (Exception e) {
            log.error("Failed to parse structure response: {}", e.getMessage(), e);
            log.error("Response was: {}", aiResponse != null ? aiResponse.substring(0, Math.min(500, aiResponse.length())) : "null");
            throw new RuntimeException("Eroare la parsarea răspunsului: " + e.getMessage(), e);
        }
    }

    // Helper methods for parsing
    @SuppressWarnings("unchecked")
    private String getString(Map<String, Object> map, String key, String defaultValue) {
        Object value = map.get(key);
        if (value == null) return defaultValue;
        return value.toString();
    }
    
    @SuppressWarnings("unchecked")
    private List<String> getStringList(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return new ArrayList<>();
        if (value instanceof List) {
            return (List<String>) value;
        }
        return new ArrayList<>();
    }
    
    private AnalyzeResponse parseAnalyzeResponseNew(String aiResponse) throws Exception {
        try {
            // Remove markdown code blocks if present
            String jsonStr = aiResponse.trim();
            jsonStr = jsonStr.replaceAll("(?i)^```json\\s*", "");
            jsonStr = jsonStr.replaceAll("^```\\s*", "");
            jsonStr = jsonStr.replaceAll("\\s*```$", "");

            // Extract JSON object
            int jsonStart = jsonStr.indexOf("{");
            int jsonEnd = jsonStr.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }

            // Parse JSON - handle both old and new formats
            Map<String, Object> parsed = objectMapper.readValue(jsonStr, Map.class);
            AnalyzeResponse response = new AnalyzeResponse();
            
            // Set basic fields
            response.setMode("analyze");
            response.setTitle(getString(parsed, "title", "🧠 ZenLink Insights"));
            response.setSummary(getString(parsed, "summary", ""));
            
            // Handle new format fields
            response.setAspectsToConsider(getStringList(parsed, "aspectsToConsider"));
            response.setUsefulClarificationQuestions(getStringList(parsed, "usefulClarificationQuestions"));
            response.setPossibleGeneralExplanations(getStringList(parsed, "possibleGeneralExplanations"));
            response.setObservedRiskFactors(getStringList(parsed, "observedRiskFactors"));
            response.setInformativeReferences(getStringList(parsed, "informativeReferences"));
            
            // Handle legacy format fields (for backward compatibility)
            if (parsed.containsKey("insights")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> insightsList = (List<Map<String, Object>>) parsed.get("insights");
                List<AnalyzeResponse.InsightDto> insights = new ArrayList<>();
                if (insightsList != null) {
                    for (Map<String, Object> insight : insightsList) {
                        AnalyzeResponse.InsightDto dto = new AnalyzeResponse.InsightDto();
                        dto.setHeading(getString(insight, "heading", ""));
                        @SuppressWarnings("unchecked")
                        List<String> bullets = (List<String>) insight.get("bullets");
                        dto.setBullets(bullets != null ? bullets : new ArrayList<>());
                        insights.add(dto);
                    }
                }
                response.setInsights(insights);
            } else {
                response.setInsights(new ArrayList<>());
            }
            
            if (parsed.containsKey("suggestedQuestions")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> questionsList = (List<Map<String, Object>>) parsed.get("suggestedQuestions");
                List<AnalyzeResponse.SuggestedQuestionDto> questions = new ArrayList<>();
                if (questionsList != null) {
                    for (Map<String, Object> question : questionsList) {
                        AnalyzeResponse.SuggestedQuestionDto dto = new AnalyzeResponse.SuggestedQuestionDto();
                        dto.setQuestion(getString(question, "question", ""));
                        @SuppressWarnings("unchecked")
                        List<String> options = (List<String>) question.get("options");
                        dto.setOptions(options != null ? options : new ArrayList<>());
                        questions.add(dto);
                    }
                }
                response.setSuggestedQuestions(questions);
            } else {
                response.setSuggestedQuestions(new ArrayList<>());
            }
            
            if (parsed.containsKey("citations")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> citationsList = (List<Map<String, Object>>) parsed.get("citations");
                List<AnalyzeResponse.CitationDto> citations = new ArrayList<>();
                if (citationsList != null) {
                    for (Map<String, Object> citation : citationsList) {
                        AnalyzeResponse.CitationDto dto = new AnalyzeResponse.CitationDto();
                        dto.setLabel(getString(citation, "label", ""));
                        dto.setUrl(getString(citation, "url", ""));
                        dto.setNote(getString(citation, "note", ""));
                        citations.add(dto);
                    }
                }
                response.setCitations(citations);
            } else {
                response.setCitations(new ArrayList<>());
            }
            
            // Handle structured content (legacy)
            if (parsed.containsKey("structured")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> structuredMap = (Map<String, Object>) parsed.get("structured");
                StructureResponse structure = objectMapper.convertValue(structuredMap, StructureResponse.class);
                response.setStructured(structure);
            } else {
                // Create minimal structure
                StructureResponse structure = new StructureResponse();
                structure.setMode("structure");
                structure.setTitle("Structură consultație");
                structure.setSummary("");
                structure.setSections(new ArrayList<>());
                structure.setSafetyNote("");
                response.setStructured(structure);
            }
            
            response.setSafetyNote(getString(parsed, "safetyNote", "Această analiză este doar informațională. Nu înlocuiește evaluarea clinică."));

            return response;
        } catch (Exception e) {
            log.error("Failed to parse analyze response, retrying with corrected prompt", e);
            // Return minimal valid response
            AnalyzeResponse response = new AnalyzeResponse();
            response.setMode("analyze");
            response.setTitle("Analiză ZenLink");
            response.setSummary("Eroare la parsarea răspunsului. Te rugăm să încerci din nou.");
            StructureResponse structure = new StructureResponse();
            structure.setMode("structure");
            structure.setTitle("Structură consultație");
            structure.setSummary("");
            structure.setSections(new ArrayList<>());
            structure.setSafetyNote("");
            response.setStructured(structure);
            response.setInsights(new ArrayList<>());
            response.setSuggestedQuestions(new ArrayList<>());
            response.setCitations(new ArrayList<>());
            response.setSafetyNote("Această analiză este doar informațională.");
            return response;
        }
    }
}
