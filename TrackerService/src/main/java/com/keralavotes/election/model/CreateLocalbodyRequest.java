package com.keralavotes.election.model;

import lombok.Data;

@Data
public class CreateLocalbodyRequest {
    private Integer districtCode;
    private String name;
    private String type;   // gramapanchayat / municipality / corporation
}

