package com.keralavotes.election.repository;

import com.keralavotes.election.entity.Candidate;
import com.keralavotes.election.entity.LbCandidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public interface LbCandidateRepository extends JpaRepository<LbCandidate, Integer> {
    List<LbCandidate> findByLocalbodyIdAndElectionYear(Long localbodyId, Integer electionYear);
    Optional<LbCandidate> findByNameAndLocalbodyIdAndElectionYear(String name, Long localbodyId, Integer electionYear);
    Optional<LbCandidate> findByLocalbodyIdAndElectionYearAndNameAndPartyId(int lbId, int year, String name, Integer partyId);

    List<LbCandidate> findByElectionYear(int year);

    List<LbCandidate> findByIdIn(ArrayList<Integer> integers);
}
