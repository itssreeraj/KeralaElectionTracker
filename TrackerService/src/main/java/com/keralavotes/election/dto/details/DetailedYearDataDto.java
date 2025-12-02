package com.keralavotes.election.dto.details;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DetailedYearDataDto {
    private Integer year;
    private String type; // LOCALBODY or GE
    private List<WardDetailDto> wards;
    private List<BoothDetailDto> booths;
}


