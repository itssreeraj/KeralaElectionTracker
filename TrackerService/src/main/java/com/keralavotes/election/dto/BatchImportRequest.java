package com.keralavotes.election.dto;

import lombok.Data;

import java.util.List;

@Data
public class BatchImportRequest {
    private String district;
    private String localbody_name;
    private String localbody_type;
    private String delimitation_year;
    private String election_year;

    private List<WardDto> wards;
    private List<ResultDto> results;

    @Data
    public static class WardDto {
        private String ward_details_id;
        private String ward_num;
        private String ward_name;
    }

    @Data
    public static class ResultDto {
        private String ward_details_id;
        private String cand_name;
        private String party;
        private String cand_vote;
    }
}
