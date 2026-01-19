package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CandidateDto {
    private Long id;
    private String name;
    private int year;

    private Long lsId;
    private String lsName;

    private Integer acCode;
    private String acName;

    private Long partyId;
    private String partyName;
    private String partyCode;

    private String electionType;

    private Long allianceId;
    private String allianceName;
    private String allianceColor;
}
