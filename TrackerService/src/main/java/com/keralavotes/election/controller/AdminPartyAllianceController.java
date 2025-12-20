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
}

