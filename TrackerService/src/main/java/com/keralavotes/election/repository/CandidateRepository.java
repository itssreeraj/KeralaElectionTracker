package com.keralavotes.election.repository;

import com.keralavotes.election.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    Optional<Candidate> findByNameAndLs_NameAndElectionYear(
            String name, String lsName, Integer year);

    List<Candidate> findByElectionYearOrderByNameAsc(int electionYear);
    List<Candidate> findByLs_IdAndElectionYearOrderByNameAsc(Long lsId, int electionYear);
    List<Candidate> findByNameAndLs_LsCodeAndElectionYearOrderByNameAsc(String name, Long lsCode, int electionYear);
    List<Candidate> findByNameAndAc_AcCodeAndElectionYearOrderByNameAsc(String name, Long acCode, int electionYear);
}
