package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LocalbodyFixReport {

    private int wardsInserted;
    private List<String> wardIdsInserted;

    private int resultsInserted;
    private List<String> resultKeysInserted;

    private int candidatesInserted;
    private List<String> candidateKeysInserted;

    private String message;
}


