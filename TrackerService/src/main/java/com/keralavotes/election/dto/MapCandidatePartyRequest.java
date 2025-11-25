package com.keralavotes.election.dto;

import lombok.Data;

@Data
public class MapCandidatePartyRequest {
    private Long partyId;  // null = clear party
}