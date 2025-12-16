package com.keralavotes.election.model;

public interface VoteRow {

    Long getWardId();
    Integer getWardNum();
    String getWardName();

    Long getLocalbodyId();
    String getLocalbodyName();
    String getLocalbodyType();
    Integer getDistrictCode();

    Long getPartyId();
    Integer getVotes();
}

