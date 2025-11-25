package com.keralavotes.election.dto;

import lombok.Data;

@Data
public class CreateLocalbodyRequest {
    private String districtName;
    private String name;
    private String type;   // gramapanchayat / municipality / corporation
}

