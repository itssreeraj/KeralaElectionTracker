package com.keralavotes.election.repository;

import com.keralavotes.election.entity.Candidate;
import com.keralavotes.election.entity.LbCandidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LbCandidateRepository extends JpaRepository<LbCandidate, Integer> {
    Optional<LbCandidate> findByNameAndLocalbodyIdAndElectionYear(String name, Long localbodyId, Integer electionYear);
    Optional<LbCandidate> findByLocalbodyIdAndElectionYearAndNameAndPartyId(int lbId, int year, String name, Integer partyId);
}
