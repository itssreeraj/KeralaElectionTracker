package com.keralavotes.election.model;

import lombok.Data;

@Data
public class CreateLocalbodyRequest {
    private String districtName;
    private String name;
    private String type;   // gramapanchayat / municipality / corporation
}

