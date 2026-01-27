package com.keralavotes.election.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocalbodyWardDetailsResponse {

    private Long localbodyId;
    private String localbodyName;
    private int year;

    private int totalWards;
    private int majorityNeeded;

    private List<WardRow> wards;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WardRow {
        private int wardNum;
        private String wardName;

        private List<AllianceVotes> alliances;

        private int totalVotes;
        private String winnerAlliance;
        private Integer marginVotes;

        private boolean winnable;
        private Double gapPercent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AllianceVotes {
        private String alliance;
        private int votes;
        private double percentage;
    }
}

