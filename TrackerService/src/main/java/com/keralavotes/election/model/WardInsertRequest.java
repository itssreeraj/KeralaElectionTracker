package com.keralavotes.election.model;

import lombok.Data;

@Data
public class WardInsertRequest {
    private String delimitation_year;
    private String district;
    private String localbody_name;
    private String localbody_type;
    private String ward_num;
    private String ward_name;
}
