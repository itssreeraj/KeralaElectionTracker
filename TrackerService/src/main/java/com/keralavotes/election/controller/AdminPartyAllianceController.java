package com.keralavotes.election.controller;

import com.keralavotes.election.dto.CreatePartyWithMappingRequest;
import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.entity.*;
import com.keralavotes.election.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminPartyAllianceController {

    private final PartyRepository partyRepo;
    private final AllianceRepository allianceRepo;
    private final PartyAllianceMappingRepository mappingRepo;

//    /* ---------------- Create Alliance ---------------- */
//    @PostMapping("/alliances")
//    public Alliance createAlliance(@RequestBody CreateAllianceRequest req) {
//
//        if (allianceRepo.existsByNameIgnoreCase(req.getName())) {
//            throw new RuntimeException("Alliance already exists");
//        }
//
//        Alliance a = new Alliance();
//        a.setName(req.getName());
//        a.setColor(req.getColor());
//
//        return allianceRepo.save(a);
//    }

//    /* ---------------- Create Party ---------------- */
//    @PostMapping("/parties")
//    public Party createParty(@RequestBody CreatePartyRequest req) {
//
//        if (partyRepo.existsByNameIgnoreCase(req.getName())) {
//            throw new RuntimeException("Party already exists");
//        }
//
//        Party p = new Party();
//        p.setName(req.getName());
//        p.setShortName(req.getCode());
//
//        return partyRepo.save(p);
//    }

    /* ---------------- Create / Update Party + Mapping ---------------- */
    @Transactional
    @PostMapping("/party-with-mapping")
    public void createPartyWithMapping(
            @RequestBody CreatePartyWithMappingRequest req
    ) {

        /* ---------------- Validate ---------------- */
        if (req.getPartyName() == null || req.getPartyName().isBlank()) {
            throw new RuntimeException("Party name is required");
        }

        if (req.getAllianceId() == null) {
            throw new RuntimeException("Alliance is required");
        }

        /* ---------------- Party (create or reuse) ---------------- */
        Party party = partyRepo
                .findByNameIgnoreCase(req.getPartyName())
                .orElseGet(() -> {
                    Party p = new Party();
                    p.setName(req.getPartyName().trim());
                    p.setShortName(
                            req.getPartyShortName() != null
                                    ? req.getPartyShortName().trim()
                                    : null
                    );
                    return partyRepo.save(p);
                });

        /* ---------------- Alliance ---------------- */
        Alliance alliance = allianceRepo.findById(req.getAllianceId())
                .orElseThrow(() -> new RuntimeException("Invalid allianceId"));

        ElectionType electionType = ElectionType.valueOf(req.getElectionType());

        /* ---------------- Mapping (create or update) ---------------- */
        PartyAllianceMapping mapping =
                mappingRepo
                        .findByPartyIdAndElectionYearAndElectionType(
                                party.getId(),
                                req.getElectionYear(),
                                electionType
                        )
                        .orElseGet(PartyAllianceMapping::new);

        mapping.setParty(party);
        mapping.setAlliance(alliance);
        mapping.setElectionYear(req.getElectionYear());
        mapping.setElectionType(electionType);

        mappingRepo.save(mapping);
    }

}

