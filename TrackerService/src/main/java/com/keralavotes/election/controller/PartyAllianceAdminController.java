package com.keralavotes.election.controller;

import com.keralavotes.election.dto.CandidateDto;
import com.keralavotes.election.dto.CreatePartyRequest;
import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.dto.MapCandidatePartyRequest;
import com.keralavotes.election.dto.PartyAllianceMappingDto;
import com.keralavotes.election.dto.UpdatePartyAllianceRequest;
import com.keralavotes.election.entity.Alliance;
import com.keralavotes.election.entity.Candidate;
import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.entity.Party;
import com.keralavotes.election.model.PartyAllianceAdminRow;
import com.keralavotes.election.repository.AllianceRepository;
import com.keralavotes.election.repository.CandidateRepository;
import com.keralavotes.election.repository.LoksabhaConstituencyRepository;
import com.keralavotes.election.repository.PartyRepository;
import com.keralavotes.election.service.PartyAllianceAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PartyAllianceAdminController {

    private final PartyAllianceAdminService service;

    @GetMapping("/party-alliance")
    public List<PartyAllianceAdminRow> getMappings(
            @RequestParam int year,
            @RequestParam ElectionType type
    ) {
        //return service.getMappings(year, type);
        return service.getAllMappings(year, type);
    }

    @PostMapping("/party-alliance")
    public void saveMapping(
            @RequestParam Long partyId,
            @RequestParam Long allianceId,
            @RequestParam int year,
            @RequestParam ElectionType type
    ) {
        service.upsertMapping(partyId, allianceId, year, type);
    }
}