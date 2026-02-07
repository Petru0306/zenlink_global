package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationSegmentDto {
    private Long id;
    private String text;
    private Long startTs;
    private Long endTs;
    private String speaker;
    private Instant createdAt;
}
