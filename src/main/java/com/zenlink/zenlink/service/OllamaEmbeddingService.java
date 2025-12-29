package com.zenlink.zenlink.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class OllamaEmbeddingService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String embedModel;

    public OllamaEmbeddingService(
            ObjectMapper objectMapper,
            @Value("${ollama.base-url}") String baseUrl,
            @Value("${ollama.embed-model}") String embedModel
    ) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
        this.embedModel = embedModel;
    }

    public List<Double> embed(String text) {
        try {
            String payload = objectMapper.createObjectNode()
                    .put("model", embedModel)
                    .put("prompt", text == null ? "" : text)
                    .toString();

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/embeddings"))
                    .timeout(Duration.ofMinutes(2))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                throw new RuntimeException("Ollama embeddings error: HTTP " + resp.statusCode() + " - " + resp.body());
            }

            JsonNode root = objectMapper.readTree(resp.body());
            JsonNode emb = root.get("embedding");
            if (emb == null || !emb.isArray()) {
                throw new RuntimeException("Invalid embeddings response");
            }

            List<Double> out = new ArrayList<>(emb.size());
            for (JsonNode n : emb) {
                out.add(n.asDouble());
            }

            if (out.size() != 768) {
                // Keep it strict because DB schema is vector(768)
                throw new RuntimeException("Unexpected embedding dimension: " + out.size());
            }

            return out;
        } catch (Exception e) {
            if (e instanceof RuntimeException re) throw re;
            throw new RuntimeException("Failed to create embeddings: " + e.getMessage(), e);
        }
    }

    public static String toPgvectorLiteral(List<Double> embedding) {
        StringBuilder sb = new StringBuilder();
        sb.append('[');
        for (int i = 0; i < embedding.size(); i++) {
            if (i > 0) sb.append(',');
            // pgvector accepts normal decimal text
            sb.append(embedding.get(i));
        }
        sb.append(']');
        return sb.toString();
    }
}


