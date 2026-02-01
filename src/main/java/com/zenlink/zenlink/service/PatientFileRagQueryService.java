package com.zenlink.zenlink.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

// RAG features temporarily disabled - require Ollama embeddings  
// @Service
public class PatientFileRagQueryService {

    public record RagHit(UUID fileId, String fileName, int pageNumber, String chunkText, double distance) {}

    private final JdbcTemplate jdbcTemplate;
    private final OllamaEmbeddingService embeddingService;

    public PatientFileRagQueryService(JdbcTemplate jdbcTemplate, OllamaEmbeddingService embeddingService) {
        this.jdbcTemplate = jdbcTemplate;
        this.embeddingService = embeddingService;
    }

    public List<RagHit> retrieveForFile(UUID fileId, String query, int k) {
        String vec = OllamaEmbeddingService.toPgvectorLiteral(embeddingService.embed(query));
        int limit = Math.max(1, Math.min(k, 30));

        return jdbcTemplate.query(
                """
                SELECT c.file_id,
                       pf.name AS file_name,
                       c.page_number,
                       c.chunk_text,
                       (c.embedding <-> ?::vector) AS distance
                FROM patient_file_chunks c
                JOIN patient_files pf ON pf.id = c.file_id
                JOIN patient_file_index i ON i.file_id = c.file_id
                WHERE c.file_id = ?
                  AND i.status = 'READY'
                ORDER BY c.embedding <-> ?::vector
                LIMIT ?
                """,
                (rs, rowNum) -> new RagHit(
                        (UUID) rs.getObject("file_id"),
                        rs.getString("file_name"),
                        rs.getInt("page_number"),
                        rs.getString("chunk_text"),
                        rs.getDouble("distance")
                ),
                vec,
                fileId,
                vec,
                limit
        );
    }

    public List<RagHit> retrieveForPatient(Long patientId, String query, int k) {
        String vec = OllamaEmbeddingService.toPgvectorLiteral(embeddingService.embed(query));
        int limit = Math.max(1, Math.min(k, 40));

        return jdbcTemplate.query(
                """
                SELECT c.file_id,
                       pf.name AS file_name,
                       c.page_number,
                       c.chunk_text,
                       (c.embedding <-> ?::vector) AS distance
                FROM patient_file_chunks c
                JOIN patient_files pf ON pf.id = c.file_id
                JOIN patient_file_index i ON i.file_id = c.file_id
                WHERE c.patient_id = ?
                  AND i.status = 'READY'
                ORDER BY c.embedding <-> ?::vector
                LIMIT ?
                """,
                (rs, rowNum) -> new RagHit(
                        (UUID) rs.getObject("file_id"),
                        rs.getString("file_name"),
                        rs.getInt("page_number"),
                        rs.getString("chunk_text"),
                        rs.getDouble("distance")
                ),
                vec,
                patientId,
                vec,
                limit
        );
    }

    public static String buildRagContext(List<RagHit> hits) {
        StringBuilder sb = new StringBuilder();
        sb.append("FRAGMENTE DIN DOCUMENTE (folosește DOAR acestea și citează cu nume fișier + pagină + citat):\n\n");
        for (int i = 0; i < hits.size(); i++) {
            RagHit h = hits.get(i);
            sb.append("[").append(i + 1).append("] Fișier: ").append(h.fileName())
                    .append(" (").append(h.fileId()).append(")")
                    .append(", pag. ").append(h.pageNumber()).append("\n");
            sb.append("Citat:\n\"\"\"\n");
            sb.append(safeTrim(h.chunkText(), 1200));
            sb.append("\n\"\"\"\n\n");
        }
        return sb.toString();
    }

    private static String safeTrim(String s, int max) {
        if (s == null) return "";
        String t = s.trim();
        if (t.length() <= max) return t;
        return t.substring(0, max) + "…";
    }
}


