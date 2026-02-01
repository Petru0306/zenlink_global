package com.zenlink.zenlink.service;

import java.util.List;

/**
 * @Deprecated - Ollama removed. All AI features now use OpenAI.
 * This class is kept for reference but disabled.
 * RAG features (patient file indexing) are temporarily disabled.
 */
// @Service
public class OllamaEmbeddingService {
    
    // Stub method to allow compilation - RAG services are disabled
    public List<Double> embed(String text) {
        throw new UnsupportedOperationException("Ollama removed - RAG features disabled. Use OpenAI for all AI features.");
    }
    
    // Static utility method kept for compatibility
    public static String toPgvectorLiteral(List<Double> embedding) {
        StringBuilder sb = new StringBuilder();
        sb.append('[');
        for (int i = 0; i < embedding.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(embedding.get(i));
        }
        sb.append(']');
        return sb.toString();
    }
}


