package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WardDto {
    private Long id;
    private Integer wardNum;
    private String wardName;
    private Long localbodyId;
    private String localbodyName;
    private String localbodyType;
    private Integer delimitationYear;
    private Integer acCode;
}

