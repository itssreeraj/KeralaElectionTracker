package com.keralavotes.election.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WardAssemblyAssignRequest {
    private List<Long> wardIds;
    private Integer acCode;
    private Integer delimitationYear;
}

