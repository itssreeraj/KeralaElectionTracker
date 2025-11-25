package com.keralavotes.election.dto;

import lombok.Data;

@Data
public class UpdatePartyAllianceRequest {
    private Long allianceId; // can be null to detach
}