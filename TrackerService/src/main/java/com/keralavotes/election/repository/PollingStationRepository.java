package com.keralavotes.election.repository;

import com.keralavotes.election.dto.details.BoothVoteDetailsRowDto;
import com.keralavotes.election.entity.PollingStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("""
        select new com.keralavotes.election.dto.details.BoothVoteDetailsRowDto(
            ps.id,
            ps.psNumber,
            ps.name,
            null,
            new com.keralavotes.election.dto.details.BoothVoteTotalsDataDto(
                coalesce(bt.totalValid, 0),
                   coalesce(bt.rejected, 0),
                      coalesce(bt.nota, 0)
            )
        )
        from PollingStation ps
        left join BoothTotals bt
            on bt.pollingStation = ps and bt.year = ps.electionYear
        where ps.ac.acCode = :acCode and ps.electionYear = :year
        order by ps.psNumber
   """)
    List<BoothVoteDetailsRowDto> findBoothTotals(
            @Param("acCode") Integer acCode,
            @Param("year") Integer year
    );

}
