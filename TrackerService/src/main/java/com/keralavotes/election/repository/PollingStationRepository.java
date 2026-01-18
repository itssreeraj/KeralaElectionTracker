package com.keralavotes.election.repository;

import com.keralavotes.election.entity.PollingStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PollingStationRepository extends JpaRepository<PollingStation, Long> {
    Optional<PollingStation> findByAc_AcCodeAndPsNumberAndPsSuffix(
            Integer acCode, Integer psNumber, String psSuffix
    );
    List<PollingStation> findByAc_AcCodeOrderByPsNumberAsc(String acCode);

    List<PollingStation> findByAc_AcCodeAndElectionYearOrderByPsNumberAsc(
            Integer acCode, Integer electionYear
    );

    @Query("select ps.psNumber from PollingStation ps where ps.ac.acCode = :acCode and ps.electionYear = :year")
    Set<Integer> findExistingPsNumbers(int acCode, int year);

    Optional<PollingStation> findByAc_AcCodeAndElectionYearAndPsNumber(
            Integer acCode, Integer electionYear, Integer psNumbers
    );

    List<PollingStation> findByLocalbody_Id(Long localbodyId);

}
