package com.keralavotes.election.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BatchCreateCandidateRequest {

    private List<CreateCandidateRequest> candidates;
}
