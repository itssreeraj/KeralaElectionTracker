package com.keralavotes.election.controller;

import com.keralavotes.election.dto.*;
import com.keralavotes.election.entity.Alliance;
import com.keralavotes.election.entity.Candidate;
import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.entity.Party;
import com.keralavotes.election.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PartyCandidateAdminController {

    private final AllianceRepository allianceRepo;
    private final PartyRepository partyRepo;
    private final CandidateRepository candidateRepo;
    private final LoksabhaConstituencyRepository lsRepo;

    /* ---------------- Alliances ---------------- */

    @GetMapping("/alliances")
    public List<Alliance> listAlliances() {
        return allianceRepo.findAll();
    }

    @PostMapping("/alliances")
    public Alliance createAlliance(@RequestBody Alliance req) {
        Alliance a = Alliance.builder()
                .name(req.getName())
                .color(req.getColor())
                .build();
        return allianceRepo.save(a);
    }

    /* ---------------- Parties ---------------- */

    @GetMapping("/parties")
    public List<Party> listParties() {
        return partyRepo.findAllByOrderByNameAsc();
    }

    @PostMapping("/parties")
    public Party createParty(@RequestBody CreatePartyRequest req) {
        Party.PartyBuilder builder = Party.builder()
                .name(req.getName())
                .shortName(req.getCode());

        if (req.getAllianceId() != null) {
            Alliance alliance = allianceRepo.findById(req.getAllianceId())
                    .orElseThrow(() -> new IllegalArgumentException("Alliance not found: " + req.getAllianceId()));
            builder.alliance(alliance);
        }

        return partyRepo.save(builder.build());
    }

    @PutMapping("/parties/{id}/alliance")
    public Party updatePartyAlliance(@PathVariable Long id,
                                     @RequestBody UpdatePartyAllianceRequest req) {
        Party party = partyRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Party not found: " + id));

        if (req.getAllianceId() == null) {
            party.setAlliance(null);
        } else {
            Alliance alliance = allianceRepo.findById(req.getAllianceId())
                    .orElseThrow(() -> new IllegalArgumentException("Alliance not found: " + req.getAllianceId()));
            party.setAlliance(alliance);
        }
        return partyRepo.save(party);
    }

    /* ---------------- Candidates ---------------- */

    @GetMapping("/candidates")
    public List<CandidateDto> listCandidates(@RequestParam int year,
                                             @RequestParam(required = false) Long lsId) {
        List<Candidate> candidates = (lsId == null)
                ? candidateRepo.findByElectionYearOrderByNameAsc(year)
                : candidateRepo.findByLs_IdAndElectionYearOrderByNameAsc(lsId, year);

        return candidates.stream()
                .map(c -> {
                    Party p = c.getParty();
                    Alliance a = (p != null) ? p.getAlliance() : null;
                    LoksabhaConstituency ls = c.getLs();
                    return new CandidateDto(
                            c.getId(),
                            c.getName(),
                            c.getElectionYear(),
                            ls != null ? ls.getId() : null,
                            ls != null ? ls.getName() : null,
                            p != null ? p.getId() : null,
                            p != null ? p.getName() : null,
                            p != null ? p.getShortName() : null,
                            a != null ? a.getId() : null,
                            a != null ? a.getName() : null,
                            a != null ? a.getColor() : null
                    );
                })
                .toList();
    }

    @PutMapping("/candidates/{id}/party")
    public CandidateDto mapCandidateToParty(@PathVariable Long id,
                                            @RequestBody MapCandidatePartyRequest req) {
        Candidate c = candidateRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + id));

        Party p = null;
        if (req.getPartyId() != null) {
            p = partyRepo.findById(req.getPartyId())
                    .orElseThrow(() -> new IllegalArgumentException("Party not found: " + req.getPartyId()));
        }
        c.setParty(p);
        Candidate saved = candidateRepo.save(c);

        Party savedParty = saved.getParty();
        Alliance a = savedParty != null ? savedParty.getAlliance() : null;
        LoksabhaConstituency ls = saved.getLs();

        return new CandidateDto(
                saved.getId(),
                saved.getName(),
                saved.getElectionYear(),
                ls != null ? ls.getId() : null,
                ls != null ? ls.getName() : null,
                savedParty != null ? savedParty.getId() : null,
                savedParty != null ? savedParty.getName() : null,
                savedParty != null ? savedParty.getShortName() : null,
                a != null ? a.getId() : null,
                a != null ? a.getName() : null,
                a != null ? a.getColor() : null
        );
    }
}
