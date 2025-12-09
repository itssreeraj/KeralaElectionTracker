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
    public static class LocalbodyBreakdown {
        private Long localbodyId;
        private String localbodyName;

        private int wardsWon;
        private int wardsWinnable;

        private Integer boothsWon;       // GE only
        private Integer boothsWinnable;  // GE only
    }
}
