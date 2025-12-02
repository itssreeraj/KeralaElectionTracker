package com.keralavotes.election.dto;

import lombok.Data;

import java.util.Map;

@Data
public class LocalbodyAnalysisResponse {

    @Data
    public static class LocalbodyInfo {
        private Long id;
        private String name;
        private String type;
        private String districtName;
    }

    private LocalbodyInfo localbody;

    /**
     * Key = year as string ("2015", "2020", "2024", ...)
     */
    private Map<String, SingleElectionAnalysisDto> elections;
}
