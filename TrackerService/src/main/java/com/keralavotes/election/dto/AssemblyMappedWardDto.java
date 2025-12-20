package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AssemblyMappedWardDto {
    Long wardId;
    Integer wardNum;
    String wardName;
    Long localbodyId;
    String localbodyName;
    String localbodyType;
}
