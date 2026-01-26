package com.keralavotes.election.model;

import lombok.Data;

@Data
public class CreatePartyRequest {
    private String name;
    private String code;
    private Long allianceId; // optional
}