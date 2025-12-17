package com.keralavotes.election.model;

public interface PartyAllianceAdminRow {

    Long getPartyId();
    String getPartyName();
    String getPartyShortName();

    Long getAllianceId();      // nullable
    String getAllianceName();  // nullable
}

