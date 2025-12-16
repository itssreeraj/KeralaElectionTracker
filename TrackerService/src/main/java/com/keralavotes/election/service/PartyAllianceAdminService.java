package com.keralavotes.election.service;

import com.keralavotes.election.dto.AssemblyAnalysisResponseDto;
import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.dto.PartyAllianceMappingDto;
import com.keralavotes.election.entity.Alliance;
import com.keralavotes.election.entity.Party;
import com.keralavotes.election.entity.PartyAllianceMapping;
import com.keralavotes.election.model.VoteRow;
import com.keralavotes.election.model.WardAccumulator;
import com.keralavotes.election.repository.AllianceRepository;
import com.keralavotes.election.repository.LbWardResultRepository;
import com.keralavotes.election.repository.PartyAllianceMappingRepository;
import com.keralavotes.election.repository.PartyRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PartyAllianceAdminService {

    private final PartyRepository partyRepo;
    private final AllianceRepository allianceRepo;
    private final PartyAllianceMappingRepository mappingRepo;

    public List<PartyAllianceMappingDto> getMappings(int year, ElectionType type) {

        return mappingRepo.findByElectionYearAndElectionType(year, type)
                .stream()
                .map(m -> {
                    Party p = m.getParty();
                    Alliance a = m.getAlliance();

                    PartyAllianceMappingDto d = new PartyAllianceMappingDto();
                    d.setPartyId(p.getId());
                    d.setPartyName(p.getName());
                    d.setPartyShortName(p.getShortName());

                    d.setAllianceId(a.getId());
                    d.setAllianceName(a.getName());

                    d.setElectionYear(m.getElectionYear());
                    d.setElectionType(m.getElectionType());
                    return d;
                })
                .toList();
    }

    public void upsertMapping(Long partyId, Long allianceId, int year, ElectionType type) {
        Party party = partyRepo.findById(partyId)
                .orElseThrow(() -> new RuntimeException("Party not found"));

        Alliance alliance = allianceRepo.findById(allianceId)
                .orElseThrow(() -> new RuntimeException("Alliance not found"));

        PartyAllianceMapping mapping =
                mappingRepo.findByParty_IdAndElectionYearAndElectionType(
                        partyId, year, type
                ).orElseGet(PartyAllianceMapping::new);

        mapping.setParty(party);
        mapping.setAlliance(alliance);
        mapping.setElectionYear(year);
        mapping.setElectionType(type);

        mappingRepo.save(mapping);
    }
}

