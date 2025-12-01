package com.keralavotes.election.repository;

import com.keralavotes.election.entity.LbWardResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LbWardResultRepository extends JpaRepository<LbWardResult, Integer> {
    Optional<LbWardResult> findByWardIdAndCandidateIdAndElectionYear(Integer wardId, Integer candidateId, Integer electionYear);
}