package com.keralavotes.election.dto.details;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BoothDetailDto {
    private Integer boothNum;
    private String boothName;
    private List<AllianceVoteDetailDto> alliances;
    private Long total;
    private String winner;
    private Long margin;
}


