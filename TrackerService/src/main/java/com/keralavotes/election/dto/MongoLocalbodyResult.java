package com.keralavotes.election.dto;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document("localbody_result")
public class MongoLocalbodyResult {
    @Id
    private String id;

    private String election_year;      // "2015", "2020"
    private String ward_details_id;    // points to ward_data._id
    private String election_type;      // "general_localbody"
    private String cand_name;
    private String cand_vote;          // "25012" (string in Mongo)
    private String party;              // "CPI"
    private String alliance;           // "LDF"
}
