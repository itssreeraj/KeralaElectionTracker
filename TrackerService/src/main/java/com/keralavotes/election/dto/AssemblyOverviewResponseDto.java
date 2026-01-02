package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssemblyOverviewResponseDto {
    private String scope;          // STATE or DISTRICT
    private String scopeName;      // Kerala / District name
    private Integer year;

    private List<AssemblyOverviewRowDto> assemblies;
}
