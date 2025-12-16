package com.keralavotes.election.repository;

import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.dto.PartyAllianceMappingDto;
import com.keralavotes.election.entity.PartyAllianceMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PartyAllianceMappingRepository
        extends JpaRepository<PartyAllianceMapping, Long> {

    List<PartyAllianceMapping>
    findByElectionYearAndElectionType(
            Integer electionYear,
            ElectionType electionType
    );

    Optional<PartyAllianceMapping>
    findByParty_IdAndElectionYearAndElectionType(
            Long partyId,
            Integer electionYear,
            ElectionType electionType
    );

    @Query("""
        select pam
        from PartyAllianceMapping pam
        where pam.party.id in :partyIds
          and pam.electionYear = :year
          and pam.electionType = :type
    """)
    List<PartyAllianceMapping> findForParties(
            @Param("partyIds") Set<Long> partyIds,
            @Param("year") Integer year,
            @Param("type") ElectionType type
    );

    @Query("""
        select m
        from PartyAllianceMapping m
        where m.electionYear = :year
          and m.electionType = :type
    """)
    List<PartyAllianceMapping> findForYearAndType(
            int year,
            ElectionType type
    );
}
