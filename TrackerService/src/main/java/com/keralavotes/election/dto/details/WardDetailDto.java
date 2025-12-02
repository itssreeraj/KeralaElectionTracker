package com.keralavotes.election.dto.details;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WardDetailDto {
    private Integer wardNum;
    private String wardName;
    private List<AllianceVoteDetailDto> alliances;
    private Long total;
    private String winner;
    private Long margin;
}

