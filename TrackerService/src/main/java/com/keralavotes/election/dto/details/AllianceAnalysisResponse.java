package com.keralavotes.election.dto.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllianceAnalysisResponse {
    private String district;
    private String type;
    private String alliance;
    private int year;
    private int swingPercent;

    private int localbodyCount;

    private int wardsWon;
    private int wardsWinnable;

    private Integer boothsWon;       // GE only
    private Integer boothsWinnable;  // GE only

    private List<LocalbodyBreakdown> breakdown;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocalbodyBreakdown {
        private Long localbodyId;
        private String localbodyName;

        private int wardsWon;
        private int wardsWinnable;

        private Integer boothsWon;
        private Integer boothsWinnable;

        // NEW: metadata for ranking/overview
        private int totalWards;      // how many wards in this LB
        private int majorityNeeded;  // (totalWards / 2) + 1
        private String verdict;      // "MAJORITY", "POSSIBLE_WITH_SWING", "HARD"
    }
}
