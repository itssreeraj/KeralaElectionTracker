package com.keralavotes.election.dto;

import lombok.Data;
import java.util.List;

@Data
public class MapBoothsRequest {
    private List<Long> boothIds;
}
