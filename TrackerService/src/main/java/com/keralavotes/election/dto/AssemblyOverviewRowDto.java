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
public class AssemblyOverviewRowDto {
    private Integer acCode;
    private String acName;
    private Integer totalWards;

    private List<AssemblyAnalysisResponseDto.AllianceVoteShare> voteShare;

    private String winner;
    private Integer margin;
}
