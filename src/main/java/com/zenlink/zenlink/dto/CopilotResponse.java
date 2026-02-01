package com.zenlink.zenlink.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CopilotResponse {
    private String type; // "doctor_copilot"
    private String title;
    private String language;
    private Integer segments_used;
    private String content_markdown;
    private List<Map<String, String>> suggested_actions;
}
