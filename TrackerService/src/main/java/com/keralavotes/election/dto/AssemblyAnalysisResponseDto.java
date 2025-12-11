package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssemblyAnalysisResponseDto {
    private Long acId;
    private int acCode;
    private String acName;
    private int lsCode;
    private String district;
    private int year;

    private int totalWards;

    private List<AllianceVoteShare> overallVoteShare;

    private List<LocalbodySummary> localbodies; // localbodies inside this AC (only wards that map to this AC)

    private List<WardRow> wards; // flat ward list for the AC

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AllianceVoteShare {
        private String alliance;
        private long votes;
        private double percentage;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LocalbodySummary {
        private Long localbodyId;
        private String localbodyName;
        private String localbodyType;
        private int wardsCount;

        private List<AllianceVoteShare> voteShare; // aggregated for this LB for wards inside AC

        private List<PerformanceRow> wardPerformance; // summary counts: winner/runnerUp/third per alliance
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PerformanceRow {
        private String alliance;
        private int winner;
        private int runnerUp;
        private int third;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class WardRow {
        private Long wardId;
        private int wardNum;
        private String wardName;
        private Long localbodyId;
        private String localbodyName;
        private List<AllianceVoteShare> alliances;
        private int total;
        private String winner;
        private Integer margin;
    }

    // small helper used internally
    @Data
    public static class PerformanceCounts {
        private int winner = 0;
        private int runnerUp = 0;
        private int third = 0;
    }
}
