package com.keralavotes.election.model;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class CreatePartyWithMappingRequest {

    @NotBlank
    private String partyName;

    private String partyShortName;

    @NotNull
    private Long allianceId;

    @NotNull
    private Integer electionYear;

    @NotBlank
    private String electionType;
}