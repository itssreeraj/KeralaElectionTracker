package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SingleElectionAnalysisDto {
    private int year;                       // 2015, 2020, 2024...
    private ElectionType type;              // LOCALBODY / GE / ASSEMBLY
    private String label;                   // "2015 Localbody Election", "2024 General Election", etc.

    // For LOCALBODY:
    private List<VoteShareRowDto> voteShare;             // alliance-wise votes & %
    private List<PerformanceRowDto> wardPerformance;     // optional

    // For GE/ASSEMBLY (booth-based):
    private List<VoteShareRowDto> boothVoteShare;        // optional
    private List<PerformanceRowDto> boothPerformance;    // optional

    // Winner - Alliance
    private String winner;
    private String runnerUp;

    private long margin;
}
