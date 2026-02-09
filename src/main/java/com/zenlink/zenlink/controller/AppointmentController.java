package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.AppointmentResponse;
import com.zenlink.zenlink.dto.ConsultationContextResponse;
import com.zenlink.zenlink.dto.ConsultationDraftDto;
import com.zenlink.zenlink.dto.ConsultationSegmentAnalyzeRequest;
import com.zenlink.zenlink.dto.ConsultationSegmentAnalyzeResponse;
import com.zenlink.zenlink.dto.ConsultationFinalizeRequest;
import com.zenlink.zenlink.dto.ConsultationFinalizeResponse;
import com.zenlink.zenlink.dto.ConsultationSegmentRequest;
import com.zenlink.zenlink.dto.ConsultationSegmentResponse;
import com.zenlink.zenlink.dto.ConsultationMessageRequest;
import com.zenlink.zenlink.dto.ConsultationMessageResponse;
import com.zenlink.zenlink.dto.ConsultationStructureRequest;
import com.zenlink.zenlink.dto.ConsultationStructureResponse;
import com.zenlink.zenlink.dto.ConsultationAnalyzeRequest;
import com.zenlink.zenlink.dto.ConsultationAnalyzeResponse;
import com.zenlink.zenlink.dto.StructureRequest;
import com.zenlink.zenlink.dto.StructureResponse;
import com.zenlink.zenlink.dto.StructuredNoteResponse;
import com.zenlink.zenlink.dto.AnalyzeRequest;
import com.zenlink.zenlink.dto.AnalyzeResponse;
import com.zenlink.zenlink.dto.CreateAppointmentRequest;
import com.zenlink.zenlink.dto.CopilotActionRequest;
import com.zenlink.zenlink.dto.CopilotChatRequest;
import com.zenlink.zenlink.dto.CopilotResponse;
import com.zenlink.zenlink.service.AppointmentService;
import com.zenlink.zenlink.service.ConsultationService;
import com.zenlink.zenlink.service.OpenAiChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AppointmentController {

    private static final Logger log = LoggerFactory.getLogger(AppointmentController.class);

    @Autowired
    private AppointmentService appointmentService;
    
    @Autowired
    private ConsultationService consultationService;
    
    @Autowired
    private OpenAiChatService openAiChatService;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /**
     * Create a new appointment
     */
    @PostMapping
    public ResponseEntity<?> createAppointment(
            @RequestBody CreateAppointmentRequest request,
            @RequestParam Long patientId) {
        try {
            AppointmentResponse response = appointmentService.createAppointment(request, patientId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Get all appointments for a doctor
     */
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(@PathVariable Long doctorId) {
        List<AppointmentResponse> appointments = appointmentService.getDoctorAppointments(doctorId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get all appointments for a patient
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointments(@PathVariable Long patientId) {
        List<AppointmentResponse> appointments = appointmentService.getPatientAppointments(patientId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get consultation context for an appointment
     */
    @GetMapping("/{appointmentId}/consultation-context")
    public ResponseEntity<ConsultationContextResponse> getConsultationContext(@PathVariable Long appointmentId) {
        ConsultationContextResponse response = appointmentService.getConsultationContext(appointmentId);
        return ResponseEntity.ok(response);
    }

    /**
     * Save consultation draft for an appointment
     */
    @PostMapping("/{appointmentId}/consultation-draft")
    public ResponseEntity<ConsultationDraftDto> saveConsultationDraft(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationDraftDto request) {
        ConsultationDraftDto saved = appointmentService.saveConsultationDraft(appointmentId, request);
        return ResponseEntity.ok(saved);
    }

    /**
     * Analyze a consultation segment and get AI recommendations
     */
    @PostMapping("/{appointmentId}/segment-analyze")
    public ResponseEntity<ConsultationSegmentAnalyzeResponse> analyzeSegment(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationSegmentAnalyzeRequest request) {
        try {
            ConsultationSegmentAnalyzeResponse response = consultationService.analyzeSegment(appointmentId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ConsultationSegmentAnalyzeResponse errorResponse = new ConsultationSegmentAnalyzeResponse();
            errorResponse.setAssistantMarkdown("Eroare la analiză: " + e.getMessage());
            errorResponse.setUpdatedRollingSummary(request.getRollingSummary());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse);
        }
    }

    /**
     * Execute a copilot action
     */
    @PostMapping("/{appointmentId}/copilot-action")
    public ResponseEntity<CopilotResponse> copilotAction(
            @PathVariable("appointmentId") Long appointmentId,
            @RequestBody CopilotActionRequest request) {
        System.out.println("=== COPILOT ACTION ENDPOINT CALLED ===");
        System.out.println("Appointment ID: " + appointmentId);
        System.out.println("Action ID: " + (request != null ? request.getActionId() : "null"));
        try {
            if (request == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorCopilotResponse("Request body is null"));
            }
            CopilotResponse response = consultationService.executeCopilotAction(appointmentId, request);
            if (response == null) {
                System.out.println("Response is null!");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(createErrorCopilotResponse("Răspuns null de la serviciu"));
            }
            System.out.println("Response generated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in copilotAction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorCopilotResponse("Eroare: " + e.getMessage()));
        }
    }
    
    private CopilotResponse createErrorCopilotResponse(String errorMessage) {
        CopilotResponse error = new CopilotResponse();
        error.setType("doctor_copilot");
        error.setTitle("❌ Eroare");
        error.setLanguage("ro");
        error.setSegments_used(0);
        error.setContent_markdown("## ⚠️ Eroare\n\n" + errorMessage);
        error.setSuggested_actions(new ArrayList<>());
        return error;
    }

    /**
     * Send a chat message to copilot
     */
    @PostMapping("/{appointmentId}/copilot-chat")
    public ResponseEntity<CopilotResponse> copilotChat(
            @PathVariable Long appointmentId,
            @RequestBody CopilotChatRequest request) {
        try {
            CopilotResponse response = consultationService.handleCopilotChat(appointmentId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    /**
     * Finalize consultation and generate Clarity Sheets
     */
    @PostMapping("/{appointmentId}/finalize")
    public ResponseEntity<ConsultationFinalizeResponse> finalizeConsultation(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationFinalizeRequest request) {
        try {
            ConsultationFinalizeResponse response = consultationService.finalizeConsultation(appointmentId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    /**
     * Save a consultation segment
     */
    @PostMapping("/{appointmentId}/segments")
    public ResponseEntity<ConsultationSegmentResponse> saveSegment(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationSegmentRequest request) {
        try {
            ConsultationSegmentResponse response = consultationService.saveSegment(appointmentId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            ConsultationSegmentResponse errorResponse = new ConsultationSegmentResponse();
            errorResponse.setSegmentId(null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse);
        }
    }

    /**
     * Save a consultation message
     */
    @PostMapping("/{appointmentId}/messages")
    public ResponseEntity<ConsultationMessageResponse> saveMessage(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationMessageRequest request) {
        try {
            ConsultationMessageResponse response = consultationService.saveMessage(appointmentId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error saving message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all messages for a consultation
     */
    @GetMapping("/{appointmentId}/messages")
    public ResponseEntity<List<ConsultationMessageResponse>> getMessages(@PathVariable Long appointmentId) {
        try {
            List<ConsultationMessageResponse> messages = consultationService.getMessages(appointmentId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error getting messages", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get finalized consultations for a doctor
     */
    @GetMapping("/doctor/{doctorId}/finalized")
    public ResponseEntity<?> getFinalizedConsultations(@PathVariable Long doctorId) {
        try {
            List<com.zenlink.zenlink.model.FinalizedConsultation> consultations = 
                    consultationService.getFinalizedConsultations(doctorId);
            return ResponseEntity.ok(consultations);
        } catch (Exception e) {
            log.error("Error getting finalized consultations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ArrayList<>());
        }
    }

    /**
     * Get finalized consultation details by appointment ID
     */
    @GetMapping("/{appointmentId}/finalized")
    public ResponseEntity<?> getFinalizedConsultation(@PathVariable Long appointmentId) {
        try {
            java.util.Optional<com.zenlink.zenlink.model.FinalizedConsultation> consultation = 
                    consultationService.getFinalizedConsultation(appointmentId);
            if (consultation.isPresent()) {
                return ResponseEntity.ok(consultation.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            log.error("Error getting finalized consultation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Structure consultation - SIMPLE streaming version
     * Just sends transcript + "structure this text" and streams response in real-time
     */
    @PostMapping("/{appointmentId}/structure")
    public ResponseEntity<StreamingResponseBody> structureConsultationStream(
            @PathVariable Long appointmentId,
            @RequestBody StructureRequest request) {
        StreamingResponseBody body = outputStream -> {
            try {
                // Build full transcript
                String fullTranscript = request.getFullTranscript();
                String inputText = request.getInputText();
                
                StringBuilder transcriptBuilder = new StringBuilder();
                if (fullTranscript != null && !fullTranscript.trim().isEmpty()) {
                    transcriptBuilder.append(fullTranscript.trim());
                }
                if (inputText != null && !inputText.trim().isEmpty() && !inputText.equals(fullTranscript)) {
                    if (transcriptBuilder.length() > 0) {
                        transcriptBuilder.append(" ");
                    }
                    transcriptBuilder.append(inputText.trim());
                }
                
                String transcript = transcriptBuilder.toString().trim();
                
                if (transcript.length() < 10) {
                    outputStream.write("Transcript prea scurt. Minim 10 caractere.".getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                    return;
                }
                
                // Simple prompt: structure this text - get detailed, useful information
                List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
                messages.add(new com.zenlink.zenlink.dto.AiMessage("user", 
                    "Structurarează următoarea transcriere a consultației într-o notă consultație clară, detaliată și utilă pentru doctor:\n\n" + transcript));
                
                // Stream the response with better system prompt
                openAiChatService.streamChat(messages, 
                    "Ești un asistent de documentare pentru medici dentisti.\n\n" +
                    "Structurarează transcrierea într-o notă consultație clară, detaliată și UTILĂ.\n\n" +
                    "REGULI CRITICE:\n" +
                    "1. Extrage DOAR informații REALE din transcript - NU inventa nimic\n" +
                    "2. Dacă ceva NU este menționat explicit, NU scrie nimic pentru acel câmp\n" +
                    "3. Fii SPECIFIC și DETALIAT - nu folosi fraze generice\n" +
                    "4. NU folosi JSON, NU folosi structuri complicate - doar TEXT clar\n" +
                    "5. Scrie în română clară și profesională\n\n" +
                    "Formatul tău (doar TEXT, fără JSON):\n\n" +
                    "📝 Notă consultație\n\n" +
                    "Motiv principal:\n" +
                    "[scurta descriere CLARĂ și SPECIFICĂ - extrage din transcript, nu inventa]\n\n" +
                    "Istoric simptom actual:\n" +
                    "• Când a început: [detalii SPECIFICE din transcript]\n" +
                    "• Cum a evoluat: [detalii SPECIFICE]\n" +
                    "• Triggeri: [rece, dulce, masticare, etc. - doar dacă menționate]\n" +
                    "• Tip durere: [pulsatilă, continuă, etc. - doar dacă menționat]\n\n" +
                    "Simptome asociate:\n" +
                    "• [umflătură, cefalee, durere ureche, febră, oboseală - doar dacă MENȚIONATE în transcript]\n\n" +
                    "Obiceiuri relevante:\n" +
                    "• [igienă orală, fumat, consum zahăr - doar dacă MENȚIONATE]\n\n" +
                    "Medicație menționată:\n" +
                    "• [ce a luat și efectul - doar dacă MENȚIONAT]\n\n" +
                    "Alergii:\n" +
                    "• [doar dacă MENȚIONATE]\n\n" +
                    "Observații din discuție:\n" +
                    "• [frică de dentist, amânare, comportament - doar dacă RELEVANTE]\n\n" +
                    "Context dentar anterior:\n" +
                    "• [ultima vizită, plombe, probleme - doar dacă MENȚIONATE]\n\n" +
                    "EXEMPLE BUNE:\n" +
                    "❌ REU: \"Durere menționată\" - prea generic\n" +
                    "✅ BUN: \"Durere pulsatilă măsea stânga, iradiază spre obraz\" - specific\n\n" +
                    "❌ REU: \"Simptome asociate: umflătură\" - dacă nu e menționat\n" +
                    "✅ BUN: Lasă gol dacă nu e menționat\n\n" +
                    "Returnează DOAR TEXT formatat frumos, NU JSON!", 
                    null, outputStream);
                    
            } catch (Exception e) {
                log.error("Error in structure stream", e);
                try {
                    outputStream.write(("Eroare: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                } catch (Exception ex) {
                    log.error("Error writing error message", ex);
                }
            }
        };
        
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header("Cache-Control", "no-cache")
                .header("X-Accel-Buffering", "no")
                .body(body);
    }

    /**
     * Analyze consultation - SIMPLE streaming version
     * Just sends transcript + "analyze this text and give suggestions to doctor" and streams response in real-time
     */
    @PostMapping("/{appointmentId}/analyze")
    public ResponseEntity<StreamingResponseBody> analyzeConsultationStream(
            @PathVariable Long appointmentId,
            @RequestBody AnalyzeRequest request) {
        StreamingResponseBody body = outputStream -> {
            try {
                // Build full transcript
                String fullTranscript = request.getFullTranscript();
                String inputText = request.getInputText();
                
                StringBuilder transcriptBuilder = new StringBuilder();
                if (fullTranscript != null && !fullTranscript.trim().isEmpty()) {
                    transcriptBuilder.append(fullTranscript.trim());
                }
                if (inputText != null && !inputText.trim().isEmpty() && !inputText.equals(fullTranscript)) {
                    if (transcriptBuilder.length() > 0) {
                        transcriptBuilder.append(" ");
                    }
                    transcriptBuilder.append(inputText.trim());
                }
                
                String transcript = transcriptBuilder.toString().trim();
                
                if (transcript.length() < 10) {
                    outputStream.write("Transcript prea scurt. Minim 10 caractere.".getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                    return;
                }
                
                // Simple prompt: analyze this text and give suggestions to doctor
                List<com.zenlink.zenlink.dto.AiMessage> messages = new ArrayList<>();
                messages.add(new com.zenlink.zenlink.dto.AiMessage("user", 
                    "Analizează următoarea transcriere a consultației și oferă insights, sugestii și recomandări utile pentru doctor:\n\n" + transcript));
                
                // Stream the response with better system prompt
                openAiChatService.streamChat(messages, 
                    "Ești ZenLink, un asistent inteligent care ajută medicii dentisti să gândească mai bine.\n\n" +
                    "REGULI CRITICE:\n" +
                    "1. Extrage informații REALE din transcript - NU inventa\n" +
                    "2. Fii SPECIFIC și UTIL - nu folosi fraze generice\n" +
                    "3. NU spune 'diagnostic' sau 'tratament recomandat'\n" +
                    "4. NU sună ca și cum înlocuiești doctorul\n" +
                    "5. Ton = asistent suportiv, doctorul este în control\n" +
                    "6. NU folosi JSON - doar TEXT clar și organizat\n\n" +
                    "Formatul tău (doar TEXT, fără JSON):\n\n" +
                    "🧠 ZenLink Insights\n\n" +
                    "Aspecte de luat în considerare:\n" +
                    "• [evidențiază pattern-uri SPECIFICE din transcript - durere agravată, sensibilitate, umflătură]\n" +
                    "• [alte observații REALE și RELEVANTE]\n\n" +
                    "Întrebări utile pentru clarificare:\n" +
                    "• [4-6 întrebări SPECIFICE pe care doctorul le-ar putea pune]\n" +
                    "• [ex: \"Intensitatea durerii pe o scală de 0-10?\", \"Durerea apare spontan sau doar la triggeri?\"]\n\n" +
                    "Posibile explicații generale (informativ):\n" +
                    "• [menționează probleme dentare generale legate de simptome - ton neutru]\n" +
                    "• [ex: \"Sensibilitatea la rece/dulce poate indica expunere dentină sau carie\"]\n\n" +
                    "Factori de risc observați:\n" +
                    "• [igienă, zahăr, fumat, amânare - doar dacă OBSERVATE în transcript]\n\n" +
                    "Referințe informative:\n" +
                    "• [menționează surse generale precum 'ghiduri stomatologice generale']\n\n" +
                    "EXEMPLE BUNE:\n" +
                    "❌ REU: \"Durere agravată\" - prea generic\n" +
                    "✅ BUN: \"Durere agravată în ultimele 2 zile, cu sensibilitate crescută la rece\" - specific\n\n" +
                    "Returnează DOAR TEXT formatat frumos, NU JSON!", 
                    null, outputStream);
                    
            } catch (Exception e) {
                log.error("Error in analyze stream", e);
                try {
                    outputStream.write(("Eroare: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
                    outputStream.flush();
                } catch (Exception ex) {
                    log.error("Error writing error message", ex);
                }
            }
        };
        
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header("Cache-Control", "no-cache")
                .header("X-Accel-Buffering", "no")
                .body(body);
    }

    private static class ErrorResponse {
        private String message;
        public ErrorResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
    }
}

