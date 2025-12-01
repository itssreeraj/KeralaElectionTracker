package com.keralavotes.election.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LocalbodyImportAudit {

    private long totalMongoWards;
    private long totalSQLWards;

    private long missingWards;
    private List<String> missingWardIds;

    private long missingResults;
    private List<String> missingResultWardIds;

    private long missingCandidates;
    private List<String> missingCandidateKeys;

    private long missingParties;
    private List<String> missingPartyNames;
    private List<String> missingResultKeys;

}

