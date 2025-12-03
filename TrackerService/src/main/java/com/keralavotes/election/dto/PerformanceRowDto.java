package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceRowDto {
    private String alliance;  // LDF/UDF/NDA/OTH
    private int winner;       // # wards/booths where alliance came 1st
    private int runnerUp;     // # where 2nd
    private int third;        // # where 3rd
}

