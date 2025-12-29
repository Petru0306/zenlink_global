package com.zenlink.zenlink.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ReorderPatientFilesRequest {
    private List<UUID> orderedIds;
}


