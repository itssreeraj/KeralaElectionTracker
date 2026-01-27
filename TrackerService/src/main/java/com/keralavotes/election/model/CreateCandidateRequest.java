package com.keralavotes.election.model;

import com.keralavotes.election.dto.ElectionType;
import lombok.AllArgsConstructor;
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

    private Integer lsCode;
    private Integer acCode;

    private Long partyId;
    private Long allianceId;
}
