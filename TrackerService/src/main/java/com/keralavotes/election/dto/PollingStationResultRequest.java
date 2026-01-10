package com.keralavotes.election.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class PollingStationResultRequest {
    // ---- Fixed fields ----
    @JsonProperty("Serial No")
    private Integer serialNo;

    @JsonProperty("Total Valid Votes")
    private Integer totalValidVotes;

    @JsonProperty("Rejected Votes")
    private Integer rejectedVotes;

    @JsonProperty("Total")
    private Integer total;

    @JsonProperty("Tendered Votes")
    private Integer tenderedVotes;

    @JsonProperty("psName")
    private String psName;

    @JsonProperty("lbName")
    private String lbName;

    // ---- Dynamic candidate votes ----
    private Map<String, Integer> candidateVotes = new HashMap<>();

    // ---- Catch-all for unknown keys (candidate names) ----
    @JsonAnySetter
    public void handleUnknown(String key, Object value) {
        // Exclude known keys
        switch (key) {
            case "Serial No", "Total Valid Votes", "Rejected Votes",
                 "Total", "Tendered Votes", "psName", "lbName" -> {}
            default -> {
                // Store candidate vote using the candidate name as key
                candidateVotes.put(key, value == null ? 0 : (int) Double.parseDouble(value.toString()));
            }
        }
    }
}
