package com.zenlink.zenlink.service;

import com.zenlink.zenlink.model.PatientFile;
import com.zenlink.zenlink.repository.PatientFileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PatientFileRagIndexService {

    public enum IndexStatus { NEW, INDEXING, READY, ERROR }

    private final JdbcTemplate jdbcTemplate;
    private final PatientFileRepository patientFileRepository;
    private final PdfTextExtractor pdfTextExtractor;
    private final OcrService ocrService;
    private final RagChunker ragChunker;
    private final OllamaEmbeddingService embeddingService;

    public PatientFileRagIndexService(
            JdbcTemplate jdbcTemplate,
            PatientFileRepository patientFileRepository,
            PdfTextExtractor pdfTextExtractor,
            OcrService ocrService,
            RagChunker ragChunker,
            OllamaEmbeddingService embeddingService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.patientFileRepository = patientFileRepository;
        this.pdfTextExtractor = pdfTextExtractor;
        this.ocrService = ocrService;
        this.ragChunker = ragChunker;
        this.embeddingService = embeddingService;
    }

    public boolean isReady(UUID fileId) {
        String s = jdbcTemplate.query(
                "SELECT status FROM patient_file_index WHERE file_id = ?",
                rs -> rs.next() ? rs.getString(1) : null,
                fileId
        );
        return "READY".equalsIgnoreCase(s);
    }

    @Transactional
    public void ensureIndexedFile(UUID fileId) {
        PatientFile file = patientFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        String currentStatus = jdbcTemplate.query(
                "SELECT status FROM patient_file_index WHERE file_id = ?",
                rs -> rs.next() ? rs.getString(1) : null,
                fileId
        );
        if ("READY".equalsIgnoreCase(currentStatus)) return;

        upsertIndexRow(fileId, file.getPatientId(), IndexStatus.INDEXING, null);

        try {
            // Clear any previous index artifacts
            jdbcTemplate.update("DELETE FROM patient_file_chunks WHERE file_id = ?", fileId);
            jdbcTemplate.update("DELETE FROM patient_file_pages WHERE file_id = ?", fileId);

            List<String> pages = pdfTextExtractor.extractPages(file.getContent());
            if (PdfTextExtractor.looksScanned(pages)) {
                String ocrText = ocrService.ocrToText(file.getContent());
                pages = splitOcrIntoPages(ocrText);
            }

            if (pages.isEmpty()) {
                throw new RuntimeException("No text extracted");
            }

            // Store pages
            for (int i = 0; i < pages.size(); i++) {
                String pageText = pages.get(i) == null ? "" : pages.get(i).trim();
                if (pageText.isEmpty()) continue;
                jdbcTemplate.update(
                        "INSERT INTO patient_file_pages(file_id, patient_id, page_number, page_text) VALUES(?,?,?,?) " +
                                "ON CONFLICT (file_id, page_number) DO UPDATE SET page_text = EXCLUDED.page_text",
                        fileId,
                        file.getPatientId(),
                        i + 1,
                        pageText
                );
            }

            // Chunk + embed
            List<RagChunker.Chunk> chunks = ragChunker.chunkPages(pages, 1200, 200);
            for (RagChunker.Chunk c : chunks) {
                List<Double> emb = embeddingService.embed(c.text());
                String vec = OllamaEmbeddingService.toPgvectorLiteral(emb);
                jdbcTemplate.update(
                        "INSERT INTO patient_file_chunks(file_id, patient_id, page_number, chunk_index, chunk_text, embedding) " +
                                "VALUES(?,?,?,?,?,?::vector) " +
                                "ON CONFLICT (file_id, page_number, chunk_index) DO UPDATE SET chunk_text = EXCLUDED.chunk_text, embedding = EXCLUDED.embedding",
                        fileId,
                        file.getPatientId(),
                        c.pageNumber(),
                        c.chunkIndex(),
                        c.text(),
                        vec
                );
            }

            upsertIndexRow(fileId, file.getPatientId(), IndexStatus.READY, null);
        } catch (Exception e) {
            upsertIndexRow(fileId, file.getPatientId(), IndexStatus.ERROR, e.getMessage());
            throw e instanceof RuntimeException re ? re : new RuntimeException(e);
        }
    }

    @Transactional
    public void ensureIndexedPatientTopN(Long patientId, int nNewest) {
        List<PatientFile> files = patientFileRepository.findByPatientIdOrderBySortRankDescUploadedAtDesc(patientId);
        int n = Math.max(0, Math.min(nNewest, files.size()));
        for (int i = 0; i < n; i++) {
            ensureIndexedFile(files.get(i).getId());
        }
    }

    @Transactional
    public void ensureIndexedPatientAll(Long patientId) {
        List<PatientFile> files = patientFileRepository.findByPatientIdOrderBySortRankDescUploadedAtDesc(patientId);
        for (PatientFile f : files) {
            ensureIndexedFile(f.getId());
        }
    }

    private void upsertIndexRow(UUID fileId, Long patientId, IndexStatus status, String errorMessage) {
        jdbcTemplate.update(
                "INSERT INTO patient_file_index(file_id, patient_id, status, error_message, updated_at) " +
                        "VALUES(?,?,?,?,?) " +
                        "ON CONFLICT (file_id) DO UPDATE SET status = EXCLUDED.status, error_message = EXCLUDED.error_message, updated_at = EXCLUDED.updated_at",
                fileId,
                patientId,
                status.name(),
                errorMessage,
                Timestamp.from(Instant.now())
        );
    }

    private static List<String> splitOcrIntoPages(String ocrText) {
        String t = ocrText == null ? "" : ocrText;
        String[] parts = t.split("\\f");
        List<String> pages = new ArrayList<>();
        for (String p : parts) {
            String s = p == null ? "" : p.trim();
            if (!s.isEmpty()) pages.add(s);
        }
        return pages;
    }
}


