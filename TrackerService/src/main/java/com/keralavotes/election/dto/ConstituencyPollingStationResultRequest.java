package com.keralavotes.election.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ConstituencyPollingStationResultRequest {
    @JsonProperty("constituency")
    private String acName;

    @JsonProperty("electionYear")
    private String electionYear;

    @JsonProperty("electionType")
    private String electionType;

    @JsonProperty("lsCode")
    private Integer lsCode;

    @JsonProperty("acCode")
    private Integer acCode;

    @JsonProperty("results")
    private List<PollingStationResultRequest> results;
}
