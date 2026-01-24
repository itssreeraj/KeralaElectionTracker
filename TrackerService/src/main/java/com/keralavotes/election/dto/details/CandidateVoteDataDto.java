package com.keralavotes.election.dto.details;

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
public class CandidateVoteDataDto {
    private Long psId;
    private Long candidateId;
    private String candidateName;
    private Integer votes;
}


