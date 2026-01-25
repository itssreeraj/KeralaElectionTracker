package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateCandidateRequest {

    private String name;

    private int electionYear;
    private ElectionType electionType; // "LOKSABHA" or "ASSEMBLY"

    private Long lsCode;
    private Long acCode;

    private Long partyId;
    private Long allianceId;
}
