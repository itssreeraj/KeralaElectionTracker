package com.keralavotes.election.dto.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoothVoteTotalsDataDto {
    private Integer totalValid;
    private Integer rejected;
    private Integer nota;
}