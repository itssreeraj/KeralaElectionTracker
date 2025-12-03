package com.keralavotes.election.dto.details;

import com.keralavotes.election.dto.ElectionType;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocalbodyDetailYearDataDto {
    private Integer year;
    private ElectionType type; // LOCALBODY or GE
    private List<WardDetailRowDto> wards;
    private List<BoothDetailRowDto> booths;
}


