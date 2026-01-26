package com.keralavotes.election.model;

import lombok.Data;

@Data
public class UpdatePartyAllianceRequest {
    private Long allianceId; // can be null to detach
}