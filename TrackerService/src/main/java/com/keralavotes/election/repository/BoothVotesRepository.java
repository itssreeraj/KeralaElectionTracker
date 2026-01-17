package com.keralavotes.election.repository;

import com.keralavotes.election.dto.LocalbodyAllianceVotesDto;
import com.keralavotes.election.dto.LocalbodyPartyVotesDto;
import com.keralavotes.election.entity.BoothVotes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface BoothVotesRepository extends JpaRepository<BoothVotes, Long> {

    /* ================================
       PARTY-WISE VOTES FOR LOCALBODY
       ================================ */
    @Query("""
        select new com.keralavotes.election.dto.LocalbodyPartyVotesDto(
                         p.id,
                         p.name,
                         p.shortName,
                         a.id,
                         a.name,
                         a.color,
                         sum(bv.votes)
                     )
        from BoothVotes bv
            join bv.pollingStation ps
            join ps.localbody lb
            join bv.candidate c
            left join c.party p
            left join p.alliance a
        where lb.id = :localbodyId
          and bv.year = :year
        group by p.id, p.name, p.shortName, a.id, a.name, a.color
    """)
    List<LocalbodyPartyVotesDto> sumVotesByPartyForLocalbody(
            @Param("localbodyId") Long localbodyId,
            @Param("year") int year);


    /* ================================
       ALLIANCE-WISE VOTES FOR LOCALBODY
       ================================ */
    @Query("""
        select new com.keralavotes.election.dto.LocalbodyAllianceVotesDto(
            a,
            sum(bv.votes)
        )
        from BoothVotes bv
            join bv.pollingStation ps
            join ps.localbody lb
            join bv.candidate c
            left join c.party p
            left join p.alliance a
        where lb.id = :localbodyId
          and bv.year = :year
        group by a
    """)
    List<LocalbodyAllianceVotesDto> sumVotesByAllianceForLocalbody(
            @Param("localbodyId") Long localbodyId,
            @Param("year") int year);

    @Query("""
    SELECT 
        w.wardNum,
        w.wardName,
        COALESCE(a.name, 'OTH') AS alliance,
        SUM(bv.votes) AS votes
    FROM BoothVotes bv
        JOIN bv.pollingStation ps
        JOIN ps.ward w
        JOIN bv.candidate c
        LEFT JOIN c.party p
        LEFT JOIN p.alliance a
    WHERE ps.localbody.id = :lbId
      AND bv.year = :year
    GROUP BY w.wardNum, w.wardName, a.name
    ORDER BY w.wardNum ASC
""")
    List<Object[]> getWardAllianceVotes(Long lbId, Integer year);

    @Query("""
    SELECT 
        ps.psNumber,
        ps.name,
        COALESCE(a.name, 'OTH') AS alliance,
        SUM(bv.votes) AS votes
    FROM BoothVotes bv
        JOIN bv.pollingStation ps
        JOIN bv.candidate c
        LEFT JOIN c.party p
        LEFT JOIN p.alliance a
    WHERE ps.localbody.id = :lbId
      AND bv.year = :year
    GROUP BY ps.psNumber, ps.name, a.name
    ORDER BY ps.psNumber ASC
""")
    List<Object[]> getBoothAllianceVotes(Long lbId, Integer year);

    @Query("select concat(v.pollingStation.psNumber, '_', v.candidate.id)" +
            "from BoothVotes v " +
            "where v.pollingStation.ac.acCode = :acCode and v.year = :year")
    Set<String> findExistingVoteKeys(int acCode, int year);

    List<BoothVotes> findByYearAndPollingStation_Ac_AcCode(int year, int acCode);
}
