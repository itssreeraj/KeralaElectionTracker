package com.keralavotes.election.controller;

import com.keralavotes.election.dto.*;
import com.keralavotes.election.entity.Alliance;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.Candidate;
import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.entity.Party;
import com.keralavotes.election.model.BatchCreateCandidateRequest;
import com.keralavotes.election.model.CreateCandidateRequest;
import com.keralavotes.election.model.CreatePartyRequest;
import com.keralavotes.election.model.MapCandidatePartyRequest;
import com.keralavotes.election.model.UpdatePartyAllianceRequest;
import com.keralavotes.election.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class PartyCandidateAdminController {

    private final AllianceRepository allianceRepo;
    private final PartyRepository partyRepo;
    private final CandidateRepository candidateRepo;
    private final LoksabhaConstituencyRepository lsRepo;
    private final AssemblyConstituencyRepository assemblyConstituencyRepo;



    /* ---------------- Parties ---------------- */

    @GetMapping("/public/parties")
    public List<Party> listParties() {
        return partyRepo.findAllByOrderByNameAsc();
    }

    @PostMapping("/admin/parties")
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

    @PutMapping("/admin/parties/{id}/alliance")
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

    @GetMapping("/public/candidates")
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
                    AssemblyConstituency assemblyConstituency = c.getAc();
                    return new CandidateDto(
                            c.getId(),
                            c.getName(),
                            c.getElectionYear(),
                            ls != null ? ls.getId() : null,
                            ls != null ? ls.getName() : null,
                            assemblyConstituency != null ? assemblyConstituency.getAcCode() : null,
                            assemblyConstituency != null ? assemblyConstituency.getName() : null,
                            p != null ? p.getId() : null,
                            p != null ? p.getName() : null,
                            p != null ? p.getShortName() : null,
                            c.getElectionType().name(),
                            a != null ? a.getId() : null,
                            a != null ? a.getName() : null,
                            a != null ? a.getColor() : null
                    );
                })
                .toList();
    }

    @PostMapping("/admin/candidates")
    public ResponseEntity<List<Candidate>> addCandidates(@RequestBody BatchCreateCandidateRequest req) {
        List<Candidate> candidates = new ArrayList<>();

        for (CreateCandidateRequest cReq : req.getCandidates()) {
            if (cReq.getElectionType() == null) {
                throw new IllegalArgumentException("Election type is required");
            }

            ElectionType electionType = cReq.getElectionType();

            LoksabhaConstituency ls = null;
            AssemblyConstituency ac = null;

            switch (electionType) {
                case LOKSABHA:
                    if (cReq.getLsCode() == null) {
                        throw new IllegalArgumentException("lsCode is required for LS candidate");
                    }
                    if (cReq.getAcCode() != null) {
                        throw new IllegalArgumentException("acCode must be null for LS candidate");
                    }

                    ls = lsRepo.findByLsCode(cReq.getLsCode())
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "LS Constituency not found: " + cReq.getLsCode()
                                    )
                            );
                    break;
                case ASSEMBLY:
                    if (cReq.getAcCode() == null) {
                        throw new IllegalArgumentException("acCode is required for AC candidate");
                    }
                    if (cReq.getLsCode() != null) {
                        throw new IllegalArgumentException("lsCode must be null for AC candidate");
                    }

                    ac = assemblyConstituencyRepo.findByAcCode(cReq.getAcCode())
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "AC Constituency not found: " + cReq.getAcCode()
                                    )
                            );
                    ls = ac.getLs();
                    break;
                default:
                    throw new IllegalArgumentException(
                            "Invalid electionType: " + cReq.getElectionType()
                    );
            }

            Party party = partyRepo.findById(cReq.getPartyId()).orElseGet(() -> {
                log.info("PartyCandidateAdminController::addCandidates -> No party found for id : {}", cReq.getPartyId());
                return null;
            });

            Candidate candidate = Candidate.builder()
                    .name(cReq.getName())
                    .electionYear(cReq.getElectionYear())
                    .electionType(electionType)
                    .ls(ls)
                    .ac(ac)
                    .party(party)
                    .build();
            candidates.add(candidate);
        }

        List<Candidate> saved = candidateRepo.saveAll(candidates);

        return saved.isEmpty()
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(saved);
    }

    @PutMapping("/admin/candidates/{id}/party")
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
        AssemblyConstituency ac = saved.getAc();

        return new CandidateDto(
                saved.getId(),
                saved.getName(),
                saved.getElectionYear(),
                ls != null ? ls.getId() : null,
                ls != null ? ls.getName() : null,
                ac != null ? ac.getAcCode() : null,
                ac != null ? ac.getName() : null,
                savedParty != null ? savedParty.getId() : null,
                savedParty != null ? savedParty.getName() : null,
                savedParty != null ? savedParty.getShortName() : null,
                saved.getElectionType().name(),
                a != null ? a.getId() : null,
                a != null ? a.getName() : null,
                a != null ? a.getColor() : null
        );
    }
}
