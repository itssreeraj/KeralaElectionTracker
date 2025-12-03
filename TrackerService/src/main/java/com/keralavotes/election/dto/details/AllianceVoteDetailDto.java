package com.keralavotes.election.dto.details;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AllianceVoteDetailDto {
    private String alliance;
    private Long votes;
    private Double percentage;
}

