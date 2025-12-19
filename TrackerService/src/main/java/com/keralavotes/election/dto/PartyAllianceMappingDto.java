package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PartyAllianceMappingDto {
    private Long partyId;
    private String partyName;
    private String partyShortName;

    private Long allianceId;
    private String allianceName;

    private int electionYear;
    private ElectionType electionType;
}
