package com.keralavotes.election.model;

import com.keralavotes.election.dto.SingleElectionAnalysisDto;
import com.keralavotes.election.entity.AssemblyConstituency;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AssemblyHistoricResultsResponse {
    private AssemblyConstituency assembly;
    private List<SingleElectionAnalysisDto> historicResults;
}
