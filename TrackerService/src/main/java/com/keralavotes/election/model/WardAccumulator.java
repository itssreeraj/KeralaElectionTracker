package com.keralavotes.election.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
public class WardAccumulator {

    private Long wardId;
    private Integer wardNum;
    private String wardName;
    private Long localbodyId;
    private String localbodyName;

    private int totalVotes = 0;
    private Map<String, Long> allianceVotes = new HashMap<>();

    public WardAccumulator(VoteRow r) {
        wardId = r.getWardId();
        wardNum = r.getWardNum();
        wardName = r.getWardName();
        localbodyId = r.getLocalbodyId();
        localbodyName = r.getLocalbodyName();
    }

    public void add(String alliance, int votes) {
        totalVotes += votes;
        allianceVotes.merge(alliance, (long) votes, Long::sum);
    }
}


