package com.keralavotes.election.model;

import lombok.Data;
import java.util.List;

@Data
public class MapBoothsRequest {
    private List<Long> boothIds;
}
