package com.keralavotes.election.dto;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document("ward_data")
public class MongoWardData {
    @Id
    private String id;

    private String delimitation_year;
    private String district;
    private String localbody_name;
    private String localbody_type;
    private String ward_num;
    private String ward_name;
}
