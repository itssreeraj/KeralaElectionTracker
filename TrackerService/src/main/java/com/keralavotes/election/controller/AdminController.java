package com.keralavotes.election.controller;

import com.keralavotes.election.model.CreatePartyWithMappingRequest;
import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.entity.Alliance;
import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.entity.Party;
import com.keralavotes.election.entity.PartyAllianceMapping;
import com.keralavotes.election.repository.AllianceRepository;
import com.keralavotes.election.repository.LoksabhaConstituencyRepository;
import com.keralavotes.election.repository.PartyAllianceMappingRepository;
import com.keralavotes.election.repository.PartyRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final LoksabhaConstituencyRepository lsRepo;
    private final PartyRepository partyRepo;
    private final AllianceRepository allianceRepo;
    private final PartyAllianceMappingRepository mappingRepo;

    @PostMapping("/ls")
    public ResponseEntity<String> addLsMapping(@RequestBody Map<String, Object> body) {
        String lsName = (String) body.get("lsName");
        Integer lsCode = (Integer) body.get("lsCode");

        if (lsName == null || lsCode == null) {
            return ResponseEntity.badRequest().body("Missing parameters");
        }

        LoksabhaConstituency ls = lsRepo.findByName(lsName)
                .orElseGet(LoksabhaConstituency::new);

        ls.setName(lsName);
        ls.setLsCode(lsCode);

        lsRepo.save(ls);

        return ResponseEntity.ok("Saved LS Mapping: " + lsName + " → " + lsCode);
    }

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
