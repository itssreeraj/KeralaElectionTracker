package com.keralavotes.election.model;

import com.keralavotes.election.dto.CandidateVoteInputDto;
import com.keralavotes.election.dto.details.BoothVoteTotalsDataDto;
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
public class BoothResultSaveRequest {
    private List<CandidateVoteInputDto> votes;
    private BoothVoteTotalsDataDto totals;
}

