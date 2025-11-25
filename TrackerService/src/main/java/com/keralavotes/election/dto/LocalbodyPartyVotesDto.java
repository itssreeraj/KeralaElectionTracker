package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LocalbodyPartyVotesDto {
    private Long partyId;
    private String partyName;
    private String partyShortName;

    private Long allianceId;
    private String allianceName;
    private String allianceColor;

    private long votes;
}

