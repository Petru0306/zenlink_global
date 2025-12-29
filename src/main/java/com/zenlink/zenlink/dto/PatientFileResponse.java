package com.zenlink.zenlink.dto;

import com.zenlink.zenlink.model.PatientFile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientFileResponse {
    private UUID id;
    private Long patientId;
    private String name;
    private String contentType;
    private Long size;
    private Long sortRank;
    private LocalDateTime uploadedAt;

    public static PatientFileResponse fromEntity(PatientFile f) {
        return new PatientFileResponse(
                f.getId(),
                f.getPatientId(),
                f.getName(),
                f.getContentType(),
                f.getSize(),
                f.getSortRank(),
                f.getUploadedAt()
        );
    }
}


