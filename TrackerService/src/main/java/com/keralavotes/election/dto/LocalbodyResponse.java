package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LocalbodyResponse {
    private Long id;
    private String name;
    private String type;
    private String district;
}

