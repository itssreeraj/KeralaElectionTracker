package com.keralavotes.election.repository;

import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.dto.PartyAllianceMappingDto;
import com.keralavotes.election.entity.PartyAllianceMapping;
import com.keralavotes.election.model.PartyAllianceAdminRow;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    Optional<PartyAllianceMapping> findByPartyIdAndElectionYearAndElectionType(Long id, @NotNull Integer electionYear, @NotBlank ElectionType electionType);

    @Query("SELECT p.id AS partyId, p.name AS partyName, p.shortName AS partyShortName, " +
            "a.id AS allianceId, a.name AS allianceName " +
            "FROM Party p LEFT JOIN PartyAllianceMapping pam ON pam.party = p " +
            "AND pam.electionYear = :year AND pam.electionType = :type " +
            "LEFT JOIN pam.alliance a ORDER BY p.name")
    List<PartyAllianceAdminRow> findAllForAdmin(
            @Param("year") int year,
            @Param("type") ElectionType type
    );

}
