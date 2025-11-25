package com.keralavotes.election.dto;

import lombok.Data;

@Data
public class CreatePartyRequest {
    private String name;
    private String code;
    private Long allianceId; // optional
}