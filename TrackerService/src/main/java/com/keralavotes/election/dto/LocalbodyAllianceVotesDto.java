package com.keralavotes.election.dto;

import com.keralavotes.election.entity.Alliance;
import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor
public class LocalbodyAllianceVotesDto {
    private Alliance alliance;
    private long votes;
}
