package com.keralavotes.election.repository;

import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.entity.Candidate;
import com.keralavotes.election.entity.LbCandidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface LbCandidateRepository extends JpaRepository<LbCandidate, Integer> {
    List<LbCandidate> findByLocalbodyIdAndElectionYear(Long localbodyId, Integer electionYear);
    Optional<LbCandidate> findByNameAndLocalbodyIdAndElectionYear(String name, Long localbodyId, Integer electionYear);
    Optional<LbCandidate> findByLocalbodyIdAndElectionYearAndNameAndPartyId(int lbId, int year, String name, Integer partyId);

    List<LbCandidate> findByElectionYear(int year);

    List<LbCandidate> findByIdIn(Set<Integer> integers);

    Optional<LbCandidate> findByLocalbodyIdAndElectionYearAndNameIgnoreCaseAndPartyId(Long id, Integer year, String candName, Long aLong);

    List<LbCandidate> findByLocalbodyId(long lbId);

    @Query("""
    SELECT c FROM LbCandidate c
    JOIN LbWardResult r ON r.candidateId = c.id
    WHERE c.localbodyId = :lbId
      AND c.electionYear = :year
      AND UPPER(c.name) = UPPER(:name)
      AND ((c.partyId IS NULL AND :partyId IS NULL) OR c.partyId = :partyId)
      AND r.wardId = :wardId
""")
    List<LbCandidate> findCandidateForWard(
            @Param("lbId") Long lbId,
            @Param("year") Integer year,
            @Param("name") String name,
            @Param("partyId") Long partyId,
            @Param("wardId") Integer wardId
    );

    @Query("""
        SELECT r.candidateId,
               pam.alliance.name
        FROM LbWardResult r
        JOIN LbCandidate c ON c.id = r.candidateId
        JOIN PartyAllianceMapping pam ON pam.party.id = c.partyId
        WHERE r.electionYear = :year
          AND pam.electionYear = :year
          AND pam.electionType = :type
        """)
    List<Object[]> findCandidateAllianceMap(
            @Param("year") int year,
            @Param("type") ElectionType type
    );

}
