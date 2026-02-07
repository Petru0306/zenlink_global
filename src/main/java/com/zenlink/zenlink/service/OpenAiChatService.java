package com.zenlink.zenlink.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenAI GPT-5 nano chat service.
 * Replaces OllamaChatService with real OpenAI API integration.
 */
@Service
public class OpenAiChatService {

    private static final Logger log = LoggerFactory.getLogger(OpenAiChatService.class);
    private static final String OPENAI_API_BASE = "https://api.openai.com/v1";
    private static final int MAX_MESSAGES = 20;
    private static final int MAX_USER_MESSAGE_LENGTH = 6000;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final Integer maxOutputTokens;
    private final Double temperature;
    private final boolean enabled;

    public OpenAiChatService(
            ObjectMapper objectMapper,
            @Value("${openai.api-key:${OPENAI_API_KEY:}}") String apiKey,
            @Value("${openai.model:${OPENAI_MODEL:gpt-5-nano}}") String model,
            @Value("${openai.max-output-tokens:${OPENAI_MAX_OUTPUT_TOKENS:600}}") Integer maxOutputTokens,
            @Value("${openai.temperature:${OPENAI_TEMPERATURE:0.3}}") Double temperature
    ) {
        this.objectMapper = objectMapper;
        // Try environment variable first, then property
        String envApiKey = System.getenv("OPENAI_API_KEY");
        this.apiKey = (envApiKey != null && !envApiKey.isEmpty()) ? envApiKey : apiKey;
        
        String envModel = System.getenv("OPENAI_MODEL");
        this.model = (envModel != null && !envModel.isEmpty()) ? envModel : model;
        
        String envMaxTokens = System.getenv("OPENAI_MAX_OUTPUT_TOKENS");
        this.maxOutputTokens = (envMaxTokens != null && !envMaxTokens.isEmpty()) 
                ? Integer.parseInt(envMaxTokens) : maxOutputTokens;
        
        String envTemp = System.getenv("OPENAI_TEMPERATURE");
        this.temperature = (envTemp != null && !envTemp.isEmpty()) 
                ? Double.parseDouble(envTemp) : temperature;

        this.enabled = this.apiKey != null && !this.apiKey.trim().isEmpty();

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        if (this.enabled) {
            log.info("OpenAI service initialized with model: {}, API key length: {}", this.model, this.apiKey != null ? this.apiKey.length() : 0);
        } else {
            log.warn("OpenAI service disabled. Set OPENAI_API_KEY to enable AI endpoints.");
        }
    }

    /**
     * Stream chat response using OpenAI API.
     * Uses Responses API (preferred for GPT-5 family).
     */
    public String streamChat(
            List<com.zenlink.zenlink.dto.AiMessage> userMessages,
            String extraSystemContext,
            OutputStream outputStream
    ) throws Exception {
        return streamChat(userMessages, extraSystemContext, null, outputStream);
    }

    public String streamChat(
            List<com.zenlink.zenlink.dto.AiMessage> userMessages,
            String extraSystemContext,
            OutputStream outputStream
    ) throws Exception {
        return streamChat(userMessages, extraSystemContext, null, outputStream, null, null, null);
    }

    public String streamChat(
            List<com.zenlink.zenlink.dto.AiMessage> userMessages,
            String extraSystemContext,
            String triageState,
            OutputStream outputStream
    ) throws Exception {
        return streamChat(userMessages, extraSystemContext, triageState, outputStream, null, null, null);
    }

    public String streamChat(
            List<com.zenlink.zenlink.dto.AiMessage> userMessages,
            String extraSystemContext,
            OutputStream outputStream,
            byte[] imageData,
            String imageMimeType,
            String scopeType
    ) throws Exception {
        return streamChat(userMessages, extraSystemContext, null, outputStream, imageData, imageMimeType, scopeType);
    }

    public String streamChat(
            List<com.zenlink.zenlink.dto.AiMessage> userMessages,
            String extraSystemContext,
            String triageState,
            OutputStream outputStream,
            byte[] imageData,
            String imageMimeType,
            String scopeType
    ) throws Exception {
        if (!enabled) {
            throw new IllegalStateException("OpenAI service is disabled. Set OPENAI_API_KEY to enable.");
        }
        // Validate input
        if (userMessages == null || userMessages.isEmpty()) {
            throw new IllegalArgumentException("Messages cannot be empty");
        }

        // Limit message count
        List<com.zenlink.zenlink.dto.AiMessage> limitedMessages = userMessages.size() > MAX_MESSAGES
                ? userMessages.subList(userMessages.size() - MAX_MESSAGES, userMessages.size())
                : userMessages;

        // Validate user message length
        for (com.zenlink.zenlink.dto.AiMessage msg : limitedMessages) {
            if ("user".equals(msg.getRole()) && msg.getContent() != null && msg.getContent().length() > MAX_USER_MESSAGE_LENGTH) {
                throw new IllegalArgumentException("User message exceeds maximum length of " + MAX_USER_MESSAGE_LENGTH + " characters");
            }
        }

        // Build messages array for OpenAI
        List<Map<String, Object>> messages = new ArrayList<>();

        // System message with healthcare safety guardrails and triage instructions
        String systemMessage = buildSystemMessage(extraSystemContext, triageState, scopeType, imageData != null);
        messages.add(Map.of("role", "system", "content", systemMessage));

        // For FILE scope, add an explicit reminder at the start of conversation to use plain text
        boolean isFileScope = "FILE".equalsIgnoreCase(scopeType);
        if (isFileScope && limitedMessages.size() > 0) {
            // Add a reminder message before the first user message
            messages.add(Map.of("role", "system", "content", 
                "REMINDER: You are in FILE analysis mode. You MUST respond with PLAIN TEXT ONLY. " +
                "NO JSON format, NO mode fields, NO structured responses. " +
                "Just write naturally like ChatGPT or Cursor would - detailed, conversational paragraphs."));
        }

        // Add conversation messages
        boolean imageAdded = false;
        for (int i = 0; i < limitedMessages.size(); i++) {
            com.zenlink.zenlink.dto.AiMessage m = limitedMessages.get(i);
            if (m == null || m.getRole() == null || m.getContent() == null) continue;
            String role = m.getRole();
            if ("system".equals(role)) continue; // Skip system messages from user input
            
            // If this is the last user message and we have an image, add image to it
            if ("user".equals(role) && imageData != null && !imageAdded && i == limitedMessages.size() - 1) {
                // Add image to the last user message
                List<Map<String, Object>> contentList = new ArrayList<>();
                contentList.add(Map.of("type", "text", "text", m.getContent()));
                String base64Image = java.util.Base64.getEncoder().encodeToString(imageData);
                contentList.add(Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", "data:" + imageMimeType + ";base64," + base64Image)
                ));
                messages.add(Map.of("role", role, "content", contentList));
                imageAdded = true;
            } else {
                messages.add(Map.of("role", role, "content", m.getContent()));
            }
        }

        // Use vision model if image is present, otherwise use configured model
        // For FILE scope, prefer gpt-4o or gpt-4-turbo for better instruction following
        String modelToUse;
        if (imageData != null) {
            modelToUse = "gpt-4o";
        } else if ("FILE".equalsIgnoreCase(scopeType)) {
            // For FILE scope without images, use a model that follows instructions better
            modelToUse = model.contains("gpt-4") ? model : "gpt-4o-mini";
        } else {
            modelToUse = model;
        }

        // Build request payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("model", modelToUse);
        payload.put("messages", messages);
        payload.put("max_tokens", imageData != null ? Math.max(maxOutputTokens, 2000) : maxOutputTokens); // More tokens for image analysis
        // For FILE scope, use slightly higher temperature for more natural responses
        payload.put("temperature", "FILE".equalsIgnoreCase(scopeType) ? Math.min(temperature + 0.1, 0.7) : temperature);
        payload.put("stream", true);

        StringBuilder assistantText = new StringBuilder();
        long startTime = System.currentTimeMillis();

        try {
            // Serialize payload to JSON
            byte[] bodyBytes = objectMapper.writeValueAsBytes(payload);

            // Build HTTP request
            log.debug("Sending request to OpenAI API with model: {}, message count: {}", model, messages.size());
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(OPENAI_API_BASE + "/chat/completions"))
                    .timeout(Duration.ofMinutes(5))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bodyBytes))
                    .build();

            // Send request and get streaming response
            log.debug("Sending HTTP request to OpenAI...");
            HttpResponse<java.io.InputStream> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofInputStream()
            );
            log.debug("Received response from OpenAI: status {}", response.statusCode());

            // Check status code
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                // Read error body
                byte[] errorBytes = response.body().readAllBytes();
                String errorBody = new String(errorBytes, StandardCharsets.UTF_8);
                
                // Sanitize error logs (never log API key)
                String sanitizedError = errorBody.replace(apiKey, "***");
                log.error("OpenAI API error: HTTP {} - Full response: {}", response.statusCode(), sanitizedError);
                
                // Try to parse error message from JSON response
                String parsedError = "Unknown error";
                try {
                    Map<String, Object> errorJson = objectMapper.readValue(errorBody, Map.class);
                    Map<String, Object> errorObj = (Map<String, Object>) errorJson.get("error");
                    if (errorObj != null) {
                        Object message = errorObj.get("message");
                        if (message != null) {
                            parsedError = message.toString();
                        }
                    }
                } catch (Exception e) {
                    // If parsing fails, use raw error body (sanitized)
                    parsedError = sanitizedError.length() > 200 ? sanitizedError.substring(0, 200) : sanitizedError;
                }
                
                // Handle specific error cases
                String errorMsg;
                if (response.statusCode() == 429) {
                    errorMsg = "Too many requests, try again later";
                } else if (response.statusCode() == 401) {
                    errorMsg = "AI service authentication error. Please check API key configuration.";
                } else if (response.statusCode() == 400) {
                    // Check if it's a model not found error
                    if (parsedError.toLowerCase().contains("model") || parsedError.toLowerCase().contains("not found")) {
                        errorMsg = "Model '" + model + "' nu există. Verifică numele modelului în configurație. Eroare: " + parsedError;
                    } else {
                        errorMsg = "Cerere invalidă: " + parsedError;
                    }
                } else if (response.statusCode() == 404) {
                    errorMsg = "Model '" + model + "' nu a fost găsit. Verifică numele modelului în configurație.";
                } else if (response.statusCode() == 500) {
                    errorMsg = "AI service error. Please try again.";
                } else {
                    errorMsg = "Eroare la comunicarea cu OpenAI: HTTP " + response.statusCode() + " - " + parsedError;
                }
                
                log.error("Sending error to client: {}", errorMsg);
                outputStream.write(errorMsg.getBytes(StandardCharsets.UTF_8));
                outputStream.flush();
                throw new RuntimeException("OpenAI API returned error: " + response.statusCode() + " - " + parsedError);
            }

            // Parse SSE stream (only if status is OK)
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.trim().isEmpty()) continue;

                    // SSE format: "data: {...}" or "data: [DONE]"
                    if (line.startsWith("data: ")) {
                        String jsonStr = line.substring(6).trim();
                        if ("[DONE]".equals(jsonStr)) break;

                        try {
                            Map<String, Object> chunk = objectMapper.readValue(jsonStr, Map.class);
                            List<Map<String, Object>> choices = (List<Map<String, Object>>) chunk.get("choices");
                            if (choices != null && !choices.isEmpty()) {
                                Map<String, Object> choice = choices.get(0);
                                Map<String, Object> delta = (Map<String, Object>) choice.get("delta");
                                if (delta != null) {
                                    String content = (String) delta.get("content");
                                    if (content != null && !content.isEmpty()) {
                                        assistantText.append(content);
                                        outputStream.write(content.getBytes(StandardCharsets.UTF_8));
                                        outputStream.flush();
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Failed to parse SSE chunk: {}", e.getMessage());
                        }
                    }
                }
            }

        } catch (Exception e) {
            // Sanitize logs (never log API key)
            String errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.contains(apiKey)) {
                errorMsg = errorMsg.replace(apiKey, "***");
            }
            log.error("OpenAI API error: {}", errorMsg, e);
            
            String userFriendlyMsg = "Eroare la comunicarea cu OpenAI: " + 
                (errorMsg != null && errorMsg.contains("timeout") ? "Request timeout" : "Service unavailable");
            try {
                outputStream.write(userFriendlyMsg.getBytes(StandardCharsets.UTF_8));
                outputStream.flush();
            } catch (Exception ex) {
                log.error("Error writing error message", ex);
            }
            throw new RuntimeException("OpenAI API call failed", e);
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("OpenAI chat completed in {} ms, response length: {}", duration, assistantText.length());

        return assistantText.toString();
    }

    /**
     * Build system message with healthcare safety guardrails and structured JSON output.
     */
    private String buildSystemMessage(String extraContext, String triageState, String scopeType, boolean hasImage) {
        StringBuilder sb = new StringBuilder();
        
        // Special prompt for FILE scope - natural, conversational responses like ChatGPT/Cursor
        if ("FILE".equalsIgnoreCase(scopeType)) {
            sb.append("You are ZenLink AI, a helpful dental/healthcare assistant specialized in analyzing medical files and documents.\n\n");
            sb.append("⚠️ CRITICAL OUTPUT RULES - YOU MUST FOLLOW THESE EXACTLY:\n");
            sb.append("1. You MUST respond with PLAIN TEXT ONLY. NO JSON format whatsoever.\n");
            sb.append("2. NEVER use JSON objects, mode fields, question structures, options arrays, or any structured format.\n");
            sb.append("3. NEVER output anything that looks like: {\"mode\": \"...\", \"title\": \"...\", etc.}\n");
            sb.append("4. Write like ChatGPT or Cursor: natural, conversational, detailed paragraphs of plain text.\n");
            sb.append("5. Answer the user's question directly and thoroughly, as if you're having a normal conversation.\n");
            sb.append("6. Be comprehensive: write at length, explain details, provide context in natural paragraphs.\n");
            sb.append("7. Use paragraphs and natural language, NOT structured lists or JSON objects.\n");
            sb.append("8. If you see JSON in previous messages, IGNORE IT - you are now in plain text mode.\n");
            sb.append("9. Just write naturally, like you're explaining something to a friend in a chat.\n\n");
            if (hasImage) {
                sb.append("IMAGE ANALYSIS GUIDELINES:\n");
                sb.append("- Analyze the provided medical image in DETAIL. Look at all visible structures, colors, textures, and any abnormalities.\n");
                sb.append("- Describe teeth, gums, oral tissues, any visible issues, restorations, potential problems.\n");
                sb.append("- Be thorough and detailed in your visual analysis.\n");
                sb.append("- Write your analysis as natural paragraphs, NOT as structured data.\n\n");
            } else {
                sb.append("DOCUMENT ANALYSIS GUIDELINES:\n");
                sb.append("- Analyze the provided medical document or file carefully.\n");
                sb.append("- Extract and explain relevant medical information from the document.\n");
                sb.append("- Write your analysis as natural paragraphs, NOT as structured data.\n\n");
            }
            sb.append("MEDICAL DISCLAIMERS:\n");
            sb.append("- Provide informational guidance only; NEVER diagnose definitively.\n");
            sb.append("- Always encourage consulting a licensed dentist/doctor for definitive diagnosis.\n");
            sb.append("- Always respond in Romanian (română) unless the user explicitly requests another language.\n\n");
            if (extraContext != null && !extraContext.trim().isEmpty()) {
                sb.append("Additional context about the file:\n");
                sb.append(extraContext);
                sb.append("\n\n");
            }
            sb.append("FINAL REMINDER: You are in FILE analysis mode. PLAIN TEXT ONLY. NO JSON. NO STRUCTURED FORMAT. " +
                      "Write like ChatGPT or Cursor - natural, detailed, conversational paragraphs.\n");
            return sb.toString();
        }
        
        // Default prompt for other scopes
        sb.append("You are ZenLink AI, a helpful dental/healthcare triage assistant.\n\n");
        sb.append("IMPORTANT RULES:\n");
        sb.append("- Provide informational guidance only; NEVER diagnose definitively.\n");
        sb.append("- Always encourage consulting a licensed dentist/doctor.\n");
        sb.append("- If user describes emergency symptoms (severe swelling, bleeding, fever, trauma, trouble breathing/swallowing), set mode=\"urgent\" and advise URGENT medical care immediately.\n");
        sb.append("- Always respond in Romanian (română) unless the user explicitly requests another language.\n");
        sb.append("- Be CONCISE. No walls of text. One question at a time.\n\n");
        
        sb.append("OUTPUT FORMAT: You MUST output ONLY valid JSON matching this structure:\n\n");
        sb.append("{\n");
        sb.append("  \"mode\": \"question\" | \"conclusion\" | \"urgent\",\n");
        sb.append("  \"title\": \"emoji + short title (max 10 words)\",\n");
        sb.append("  \"question\": \"ONE question only (if mode=question)\",\n");
        sb.append("  \"rationale\": \"optional 1-line why this matters (very short)\",\n");
        sb.append("  \"options\": [\n");
        sb.append("    {\"label\": \"Option text\", \"value\": \"option_value\", \"kind\": \"primary\" | \"neutral\"}\n");
        sb.append("  ],\n");
        sb.append("  \"allowFreeText\": true,\n");
        sb.append("  \"freeTextPlaceholder\": \"Altceva…\",\n");
        sb.append("  \"progress\": {\"step\": 2, \"total\": 10},\n");
        sb.append("  \"highlight\": [{\"label\": \"keyword\", \"color\": \"purple\" | \"amber\" | \"red\" | \"green\"}],\n");
        sb.append("  \"severity\": \"low\" | \"medium\" | \"high\",\n");
        sb.append("  \"conclusion\": {\n");
        sb.append("    \"summary\": \"1-2 lines max\",\n");
        sb.append("    \"probabilities\": [{\"label\": \"Cause\", \"percent\": 50, \"note\": \"short note\"}],\n");
        sb.append("    \"nextSteps\": [{\"icon\": \"📋\", \"title\": \"Step\", \"text\": \"1 sentence\"}],\n");
        sb.append("    \"redFlags\": [\"flag 1\", \"flag 2\"],\n");
        sb.append("    \"cta\": {\"label\": \"Programează-te la un medic\", \"href\": \"/doctori\"}\n");
        sb.append("  }\n");
        sb.append("}\n\n");
        
        sb.append("QUESTION MODE RULES:\n");
        sb.append("- Ask ONE question per turn (not multiple).\n");
        sb.append("- Maximum 10 questions total (total=10).\n");
        sb.append("- Ask highest-yield questions only: pain characteristics, duration, triggers, location, swelling, fever, bleeding, sensitivity, trauma, recent dental work, last visit, etc.\n");
        sb.append("- Use options like: Duration (\"<24h\", \"1-3 zile\", \">1 săptămână\"), Trigger (\"Rece\", \"Cald\", \"Dulce\"), Severity (\"Ușoară\", \"Moderată\", \"Severă\"), Symptoms (\"Umflare\", \"Febră\", \"Sângerare\").\n");
        sb.append("- Always include \"Nu sunt sigur\" and \"Altceva…\" options.\n");
        sb.append("- Keep title short with emoji.\n");
        sb.append("- Keep rationale to 1 line max.\n\n");
        
        sb.append("CONCLUSION MODE RULES:\n");
        sb.append("- Set mode=\"conclusion\" after collecting answers.\n");
        sb.append("- Provide 2-4 probabilities that sum to 100%.\n");
        sb.append("- Keep summary to 1-2 lines.\n");
        sb.append("- Provide 3-5 next steps max (each with icon, title, 1 sentence).\n");
        sb.append("- List 3-6 red flags if applicable.\n");
        sb.append("- Always include CTA to book appointment.\n\n");
        
        sb.append("URGENT MODE:\n");
        sb.append("- Use mode=\"urgent\" for emergency symptoms.\n");
        sb.append("- Skip questions, go straight to urgent advice.\n");
        sb.append("- Include conclusion with red flags and immediate CTA.\n\n");
        
        sb.append("CRITICAL: Output ONLY valid JSON. No markdown, no explanations, no extra text. Just the JSON object.\n");
        
        if (extraContext != null && !extraContext.trim().isEmpty()) {
            sb.append("\nAdditional context:\n");
            sb.append(extraContext);
        }

        return sb.toString();
    }
}
