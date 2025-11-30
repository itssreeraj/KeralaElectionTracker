package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BoothSummary {
    private Long id;
    private Integer psNumber;
    private String psSuffix;
    private String name;
    private String localbodyName;
}
