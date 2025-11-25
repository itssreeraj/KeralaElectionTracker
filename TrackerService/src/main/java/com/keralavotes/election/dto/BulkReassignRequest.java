package com.keralavotes.election.dto;

import java.util.List;
import lombok.Data;

@Data
public class BulkReassignRequest {
    private List<Long> boothIds;
    private Long localbodyId;
    private Long wardId; // optional
}
