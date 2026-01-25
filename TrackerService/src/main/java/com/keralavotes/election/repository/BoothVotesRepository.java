package com.keralavotes.election.repository;

import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.dto.LocalbodyAllianceVotesDto;
import com.keralavotes.election.dto.LocalbodyPartyVotesDto;
import com.keralavotes.election.dto.details.CandidateVoteDataDto;
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
    SELECT\s
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

    @Query("SELECT p.shortName, a.name, SUM(bv.votes) as total " +
            "FROM BoothVotes bv JOIN bv.pollingStation ps JOIN bv.candidate c " +
            "LEFT JOIN c.party p LEFT JOIN PartyAllianceMapping pam ON pam.party.id=p.id " +
            "AND pam.electionYear = :year AND pam.electionType = :type " +
            "LEFT JOIN pam.alliance a " +
            "WHERE ps.localbody.id = :lbId AND bv.year = :year " +
            "GROUP BY p.shortName, a.name ORDER BY total DESC")
    List<Object[]> getBoothPartyVotes(Long lbId, Integer year, ElectionType type);

    @Query("SELECT ps.id, COALESCE(a.name, 'OTH'), SUM(bv.votes) as total " +
            "FROM BoothVotes bv JOIN bv.pollingStation ps JOIN bv.candidate c " +
            "LEFT JOIN c.party p LEFT JOIN PartyAllianceMapping pam ON pam.party.id = p.id " +
            "AND pam.electionYear = :year AND pam.electionType = :type " +
            "LEFT JOIN pam.alliance a WHERE ps.localbody.id = :lbId AND bv.year = :year " +
            "GROUP BY ps.id, a.name")
    List<Object[]> getBoothResultsGroupedByBooth(Long lbId, Integer year, ElectionType type);

    @Query("SELECT ps.id, ps.psNumber, ps.name, COALESCE(a.name, 'OTH'), SUM(bv.votes) " +
            "FROM BoothVotes bv JOIN bv.pollingStation ps JOIN bv.candidate c " +
            "LEFT JOIN c.party p LEFT JOIN PartyAllianceMapping pam on pam.party.id = p.id " +
            "and pam.electionYear = :year LEFT JOIN pam.alliance a " +
            "WHERE ps.localbody.id = :lbId AND bv.year = :year " +
            "GROUP BY ps.id, ps.psNumber, ps.name, a.name")
    List<Object[]> getBoothVotesDetails(Long lbId, Integer year);

    @Query("select concat(v.pollingStation.psNumber, '_', v.candidate.id)" +
            "from BoothVotes v " +
            "where v.pollingStation.ac.acCode = :acCode and v.year = :year")
    Set<String> findExistingVoteKeys(int acCode, int year);

    List<BoothVotes> findByYearAndPollingStation_Ac_AcCode(int year, int acCode);

    @Query("SELECT COALESCE(a.name, 'OTH'), SUM(bv.votes) " +
            "FROM BoothVotes bv " +
            "JOIN bv.pollingStation ps " +
            "JOIN bv.candidate c " +
            "LEFT JOIN c.party p " +
            "LEFT JOIN PartyAllianceMapping pam ON pam.party.id = p.id AND pam.electionYear = :year " +
            "LEFT JOIN pam.alliance a WHERE ps.ac.acCode  = :acCode AND bv.year = :year AND c.electionYear = :year " +
            "GROUP BY COALESCE(a.name, 'OTH') ORDER BY SUM(bv.votes) DESC")
    List<Object[]> getAssemblyVoteShare(int acCode, int year);

    @Query("""
        select new com.keralavotes.election.dto.details.CandidateVoteDataDto(
            bv.pollingStation.id,
            bv.candidate.id,
            bv.candidate.name,
            p.shortName,
            bv.votes
        )
        from BoothVotes bv
            left join candidate c on c.id = bv.candidate.id
            left join party p on p.id = c.party.id
        where bv.year = :year
          and bv.pollingStation.ac.acCode = :acCode
        order by bv.candidate.id
    """)
    List<CandidateVoteDataDto> findBoothVotes(
            @Param("acCode") Integer acCode,
            @Param("year") Integer year
    );
}
