package com.keralavotes.election.model;

import lombok.Data;

@Data
public class MapCandidatePartyRequest {
    private Long partyId;  // null = clear party
}