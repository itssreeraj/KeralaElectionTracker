package com.keralavotes.election.model;

import lombok.Data;

@Data
public class CreateBoothRequest {

    // District code or name (UI sends district name)
    private String district;

    // Assembly Constituency code
    private String ac;

    // Election Year (e.g. 2024)
    private Integer electionYear;

    // Localbody ID (nullable)
    private Long localbody;

    // Ward ID (nullable)
    private Long ward;

    // Polling station number (e.g. 102)
    private Integer psNumber;

    // Optional suffix (A/B/C)
    private String psSuffix;

    // Booth/polling station name
    private String name;
}

