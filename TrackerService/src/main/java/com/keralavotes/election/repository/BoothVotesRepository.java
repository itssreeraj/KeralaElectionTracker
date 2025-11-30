package com.keralavotes.election.repository;

import com.keralavotes.election.dto.LocalbodyAllianceVotesDto;
import com.keralavotes.election.dto.LocalbodyPartyVotesDto;
import com.keralavotes.election.entity.BoothVotes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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
}
