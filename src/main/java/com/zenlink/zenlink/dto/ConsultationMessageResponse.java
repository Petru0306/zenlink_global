package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationMessageResponse {
    private Long id;
    private String role;
    private String content;
    private String outputType;
    private Instant createdAt;
}
