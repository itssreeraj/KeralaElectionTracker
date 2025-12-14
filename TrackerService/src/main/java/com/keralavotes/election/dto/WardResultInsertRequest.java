package com.keralavotes.election.dto;

import lombok.Data;

@Data
public class WardResultInsertRequest {
    private String ward_details_id;
    private String election_year;
    private String cand_name;
    private String cand_vote;
    private String party;
    private String election_type;
}
