package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.PatientFileResponse;
import com.zenlink.zenlink.dto.ReorderPatientFilesRequest;
import com.zenlink.zenlink.dto.UpdatePatientFileRequest;
import com.zenlink.zenlink.model.PatientFile;
import com.zenlink.zenlink.repository.PatientFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patient-files")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PatientFileController {

    @Autowired
    private PatientFileRepository patientFileRepository;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PatientFileResponse>> listPatientFiles(@PathVariable Long patientId) {
        List<PatientFile> files = patientFileRepository.findByPatientIdOrderBySortRankDescUploadedAtDesc(patientId);
        return ResponseEntity.ok(files.stream().map(PatientFileResponse::fromEntity).collect(Collectors.toList()));
    }

    @PostMapping(path = "/patient/{patientId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPatientFile(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "No file provided"));
            }

            PatientFile pf = new PatientFile();
            pf.setPatientId(patientId);
            pf.setName(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
            pf.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
            pf.setSize(file.getSize());
            pf.setSortRank(System.currentTimeMillis());
            pf.setContent(file.getBytes());

            PatientFile saved = patientFileRepository.save(pf);
            return ResponseEntity.ok(PatientFileResponse.fromEntity(saved));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to upload file"));
        }
    }

    @GetMapping("/{fileId}/content")
    public ResponseEntity<?> downloadContent(@PathVariable UUID fileId) {
        return patientFileRepository.findById(fileId)
                .map(f -> {
                    String filename = f.getName() == null ? "file" : f.getName();
                    String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8);
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_TYPE, f.getContentType())
                            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                            .body(f.getContent());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{fileId}")
    public ResponseEntity<?> updateFileMetadata(@PathVariable UUID fileId, @RequestBody UpdatePatientFileRequest request) {
        return patientFileRepository.findById(fileId)
                .map(f -> {
                    if (request.getName() != null && !request.getName().trim().isEmpty()) {
                        f.setName(request.getName().trim());
                    }
                    PatientFile saved = patientFileRepository.save(f);
                    return ResponseEntity.ok(PatientFileResponse.fromEntity(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable UUID fileId) {
        if (!patientFileRepository.existsById(fileId)) {
            return ResponseEntity.notFound().build();
        }
        patientFileRepository.deleteById(fileId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PutMapping("/patient/{patientId}/order")
    public ResponseEntity<?> reorder(@PathVariable Long patientId, @RequestBody ReorderPatientFilesRequest request) {
        if (request.getOrderedIds() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "orderedIds is required"));
        }

        List<PatientFile> files = patientFileRepository.findByPatientIdOrderBySortRankDescUploadedAtDesc(patientId);
        Map<UUID, PatientFile> byId = files.stream().collect(Collectors.toMap(PatientFile::getId, f -> f));

        // Highest rank should appear first
        long base = System.currentTimeMillis();
        for (int i = 0; i < request.getOrderedIds().size(); i++) {
            UUID id = request.getOrderedIds().get(i);
            PatientFile f = byId.get(id);
            if (f == null) continue;
            f.setSortRank(base - i);
        }

        // Keep any non-mentioned files after, in their current order
        long nextRank = base - request.getOrderedIds().size() - 1;
        List<PatientFile> remaining = files.stream()
                .filter(f -> request.getOrderedIds().stream().noneMatch(id -> id.equals(f.getId())))
                .sorted(Comparator.comparing(PatientFile::getSortRank, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        for (PatientFile f : remaining) {
            f.setSortRank(nextRank--);
        }

        patientFileRepository.saveAll(files);
        return ResponseEntity.ok(
                patientFileRepository.findByPatientIdOrderBySortRankDescUploadedAtDesc(patientId)
                        .stream()
                        .map(PatientFileResponse::fromEntity)
                        .collect(Collectors.toList())
        );
    }
}


