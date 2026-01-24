package com.keralavotes.election.dto.details;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoothVoteDetailsRowDto {
    private Long psId;
    private Integer psNumber;
    private String psName;
    private List<CandidateVoteDataDto> candidates;
    private BoothVoteTotalsDataDto totals;
}


