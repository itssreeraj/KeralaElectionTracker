package com.keralavotes.election.dto.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllianceLocalbodySummaryDto {
    private Long localbodyId;
    private String localbodyName;
    private String localbodyType;

    private int totalUnits;   // wards for LOCALBODY, booths for GE
    private int won;          // units where alliance is #1
    private int winnable;     // units where alliance can win within margin
}
