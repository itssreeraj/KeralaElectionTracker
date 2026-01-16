package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AllianceDto {
    private long id;   // LDF / UDF / NDA / IND
    private String name;
    private String color;
}
