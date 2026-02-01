package com.zenlink.zenlink.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// @Service - Disabled: Ollama removed, using OpenAI for all AI features
public class OllamaChatService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String chatModel;

    public OllamaChatService(
            ObjectMapper objectMapper,
            @Value("${ollama.base-url}") String baseUrl,
            @Value("${ollama.chat-model}") String chatModel
    ) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.chatModel = chatModel;
    }

    public String streamChat(List<com.zenlink.zenlink.dto.AiMessage> userMessages, OutputStream outputStream) throws Exception {
        return streamChat(userMessages, null, outputStream);
    }

    public String streamChat(List<com.zenlink.zenlink.dto.AiMessage> userMessages, String extraSystemContext, OutputStream outputStream) throws Exception {
        StringBuilder assistantText = new StringBuilder();

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of(
                "role", "system",
                "content",
                """
                Ești ZenLink AI, un asistent medical pentru suport decizional. Răspunde ÎNTOTDEAUNA în limba română.
                - Pune întrebări de clarificare când lipsesc date.
                - Semnalează urgențe / semne de alarmă când e cazul.
                - Separă clar: fapte vs ipoteze.
                - Nu pretinde că ești medic și recomandă consult medical pentru decizii finale.
                - Răspunsul trebuie să fie STRUCTURAT: Rezumat, Fapte extrase, Semne de alarmă, Diagnostic diferențial, Pași următori.
                - Include CITĂRI OBLIGATORII pentru fiecare afirmație factuală: (Fișier, pagină, citat).
                """
        ));

        if (extraSystemContext != null && !extraSystemContext.trim().isEmpty()) {
            messages.add(Map.of("role", "system", "content", extraSystemContext));
        }

        if (userMessages != null) {
            for (com.zenlink.zenlink.dto.AiMessage m : userMessages) {
                if (m == null) continue;
                if (m.getRole() == null || m.getContent() == null) continue;
                messages.add(Map.of("role", m.getRole(), "content", m.getContent()));
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", chatModel);
        payload.put("stream", true);
        payload.put("messages", messages);

        byte[] body = objectMapper.writeValueAsBytes(payload);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/chat"))
                .timeout(Duration.ofMinutes(5))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();

        HttpResponse<java.io.InputStream> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofInputStream());
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            String err = new String(resp.body().readAllBytes(), StandardCharsets.UTF_8);
            throw new RuntimeException("Ollama error: HTTP " + resp.statusCode() + " - " + err);
        }

        try (BufferedReader br = new BufferedReader(new InputStreamReader(resp.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.isBlank()) continue;

                Map<String, Object> chunk = objectMapper.readValue(line, new TypeReference<>() {});
                Object done = chunk.get("done");
                Object msgObj = chunk.get("message");
                if (msgObj instanceof Map<?, ?> msgMap) {
                    Object contentObj = msgMap.get("content");
                    if (contentObj instanceof String content && !content.isEmpty()) {
                        assistantText.append(content);
                        outputStream.write(content.getBytes(StandardCharsets.UTF_8));
                        outputStream.flush();
                    }
                }

                if (done instanceof Boolean b && b) {
                    break;
                }
            }
        }

        return assistantText.toString();
    }
}


