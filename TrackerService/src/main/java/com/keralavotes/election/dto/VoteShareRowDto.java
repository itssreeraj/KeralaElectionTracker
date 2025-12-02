package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoteShareRowDto {
    private String alliance;   // LDF/UDF/NDA/OTH
    private long votes;
    private double percentage; // 0–100
}

