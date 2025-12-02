package com.keralavotes.election.repository;

import com.keralavotes.election.entity.LbWardResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface LbWardResultRepository extends JpaRepository<LbWardResult, Integer> {
    Optional<LbWardResult> findByWardIdAndCandidateIdAndElectionYear(Integer wardId, Integer candidateId, Integer electionYear);

    List<LbWardResult> findByElectionYearAndCandidateIdIn(int year, Set<Integer> candIds);
}