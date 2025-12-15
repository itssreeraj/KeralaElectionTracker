package com.keralavotes.election.repository;

import com.keralavotes.election.entity.LbWardResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface LbWardResultRepository extends JpaRepository<LbWardResult, Integer> {
    Optional<LbWardResult> findByWardIdAndCandidateIdAndElectionYear(Integer wardId, Integer candidateId, Integer electionYear);

    List<LbWardResult> findByElectionYearAndCandidateIdIn(int year, Set<Integer> candIds);

    List<LbWardResult> findByElectionYearAndWardIdIn(int year, Set<Long> wardIds);



    @Query("""
        SELECT r
        FROM LbWardResult r
        JOIN Ward w ON w.id = r.wardId
        WHERE r.electionYear = :year
          AND w.delimitationYear = :delimYear
          AND (:acCode IS NULL OR w.ac.acCode = :acCode)
          AND (:districtCode IS NULL OR w.localbody.district.districtCode = :districtCode)
          AND (:types IS NULL OR LOWER(w.localbody.type) IN :types)
    """)
    List<LbWardResult> findResultsByScope(
            @Param("year") int year,
            @Param("delimYear") int delimYear,
            @Param("acCode") Integer acCode,
            @Param("districtCode") Integer districtCode,
            @Param("types") List<String> types
    );

}