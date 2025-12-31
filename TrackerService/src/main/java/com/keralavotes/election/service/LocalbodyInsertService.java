package com.keralavotes.election.service;

import com.keralavotes.election.dto.BatchImportRequest;
import com.keralavotes.election.dto.WardInsertRequest;
import com.keralavotes.election.dto.WardResultInsertRequest;
import com.keralavotes.election.entity.District;
import com.keralavotes.election.entity.LbCandidate;
import com.keralavotes.election.entity.LbWardResult;
import com.keralavotes.election.entity.Localbody;
import com.keralavotes.election.entity.Party;
import com.keralavotes.election.entity.Ward;
import com.keralavotes.election.repository.DistrictRepository;
import com.keralavotes.election.repository.LbCandidateRepository;
import com.keralavotes.election.repository.LbWardResultRepository;
import com.keralavotes.election.repository.LocalbodyRepository;
import com.keralavotes.election.repository.PartyRepository;
import com.keralavotes.election.repository.WardRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class LocalbodyInsertService {
    private final DistrictRepository districtRepo;
    private final LocalbodyRepository lbRepo;
    private final WardRepository wardRepo;
    private final PartyRepository partyRepo;
    private final LbCandidateRepository candidateRepo;
    private final LbWardResultRepository resultRepo;

    // ---------------- API 1: Insert Ward Metadata ----------------
    @Transactional
    public Ward insertWard(WardInsertRequest r) {

        District dist = districtRepo.findByNameIgnoreCase(r.getDistrict())
                .orElseThrow(() -> new RuntimeException("Unknown district: " + r.getDistrict()));

        String lbType = r.getLocalbody_type().trim().toLowerCase();

        Localbody lb = lbRepo.findByNameIgnoreCaseAndTypeIgnoreCaseAndDistrict_DistrictCode(
                r.getLocalbody_name(), lbType, dist.getDistrictCode()
        ).orElseGet(() -> {
            Localbody newLb = new Localbody();
            newLb.setName(r.getLocalbody_name());
            newLb.setType(lbType);
            newLb.setDistrict(dist);
            return lbRepo.save(newLb);
        });

        String wardDetailsId = UUID.randomUUID().toString();

        Ward w = new Ward();
        w.setWardNum(Integer.parseInt(r.getWard_num()));
        w.setWardName(r.getWard_name());
        w.setLocalbody(lb);
        w.setDelimitationYear(Integer.parseInt(r.getDelimitation_year()));
        w.setWardDetailsId(wardDetailsId);

        return wardRepo.save(w);
    }

    // ---------------- API 2: Insert Candidate Result ----------------
    @Transactional
    public void insertWardResult(WardResultInsertRequest r) {

        Ward ward = wardRepo.findByWardDetailsId(r.getWard_details_id())
                .orElseThrow(() -> new RuntimeException("Unknown wardDetailsId: " + r.getWard_details_id()));

        Integer year = Integer.valueOf(r.getElection_year());

        Party party;
        if (r.getParty() != null) {
            party = partyRepo.findByShortNameIgnoreCase(r.getParty()).orElse(null);
        } else {
            party = null;
        }

        LbCandidate candidate = candidateRepo
                .findByLocalbodyIdAndElectionYearAndNameIgnoreCaseAndPartyId(
                        ward.getLocalbody().getId(),
                        year,
                        r.getCand_name(),
                        party != null ? party.getId() : null
                )
                .orElseGet(() -> {
                    LbCandidate c = new LbCandidate();
                    c.setLocalbodyId(ward.getLocalbody().getId());
                    c.setElectionYear(year);
                    c.setName(r.getCand_name());
                    c.setPartyId(party != null ? party.getId() : null);
                    return candidateRepo.save(c);
                });

        LbWardResult wr = resultRepo
                .findByWardIdAndCandidateIdAndElectionYear(
                        ward.getId().intValue(),
                        candidate.getId(),
                        year
                )
                .orElseGet(() -> {
                    LbWardResult x = new LbWardResult();
                    x.setWardId(ward.getId().intValue());
                    x.setCandidateId(candidate.getId());
                    x.setElectionYear(year);
                    return x;
                });

        wr.setVotes(Integer.parseInt(r.getCand_vote()));

        resultRepo.save(wr);
    }

    @Transactional
    public long batchImport(BatchImportRequest req) {

        final String districtName = req.getDistrict().trim();
        final int delimYear = Integer.parseInt(req.getDelimitation_year());
        final int electionYear = Integer.parseInt(req.getElection_year());
        final String lbType = req.getLocalbody_type().trim().toLowerCase();

        log.info("Batch import started → district={}, localbody={}, type={}, wards={}, results={}",
                districtName, req.getLocalbody_name(), lbType,
                req.getWards().size(), req.getResults().size());

        // --------------------------------------------------------------------
        // 1. District
        // --------------------------------------------------------------------
        District dist = districtRepo.findByNameIgnoreCase(districtName)
                .orElseThrow(() -> new RuntimeException("Invalid district: " + districtName));

        // --------------------------------------------------------------------
        // 2. Localbody
        // --------------------------------------------------------------------
        Localbody lb = lbRepo.findByNameIgnoreCaseAndTypeIgnoreCaseAndDistrict_DistrictCode(
                        req.getLocalbody_name(), lbType, dist.getDistrictCode())
                .orElseGet(() -> {
                    Localbody x = new Localbody();
                    x.setName(req.getLocalbody_name());
                    x.setType(lbType);
                    x.setDistrict(dist);
                    return lbRepo.save(x);
                });

        long lbId = lb.getId();

        // --------------------------------------------------------------------
        // 3. Party map
        // --------------------------------------------------------------------
        Map<String, Party> partyByShortName = partyRepo.findAll().stream()
                .filter(p -> p.getShortName() != null)
                .collect(Collectors.toMap(
                        p -> p.getShortName().toUpperCase(),
                        p -> p,
                        (a, b) -> a
                ));

        // --------------------------------------------------------------------
        // 4. Load existing wards into Map<String, List<Ward>>
        // --------------------------------------------------------------------
        List<Ward> wardsOfLb = wardRepo.findByLocalbodyId(lbId);

        Map<String, List<Ward>> wardsByDetailsIdMap = new HashMap<>();

        for (Ward w : wardsOfLb) {
            if (w.getWardDetailsId() != null) {
                wardsByDetailsIdMap
                        .computeIfAbsent(w.getWardDetailsId(), k -> new ArrayList<>())
                        .add(w);
            }
        }

        // --------------------------------------------------------------------
        // 5. Insert or update wards → Three cases:
        //    A: same detailsId + same delimYear → update name/num
        //    B: same detailsId + different delimYear → create new row
        //    C: no detailsId at all → new row
        // --------------------------------------------------------------------
        List<Ward> newWards = new ArrayList<>();

        for (BatchImportRequest.WardDto wd : req.getWards()) {

            String wdId = wd.getWard_details_id();
            int wn = Integer.parseInt(wd.getWard_num());

            List<Ward> matches = wardsByDetailsIdMap.get(wdId);

            if (matches == null || matches.isEmpty()) {
                // CASE C: brand-new detailsId → new row
                Ward w = new Ward();
                w.setLocalbody(lb);
                w.setWardNum(wn);
                w.setWardName(wd.getWard_name());
                w.setDelimitationYear(delimYear);
                w.setWardDetailsId(wdId);
                newWards.add(w);
                continue;
            }

            // CASE A/B: detailsId exists → find same delimYear
            Ward sameDelim = matches.stream()
                    .filter(w -> w.getDelimitationYear() == delimYear)
                    .findFirst().orElse(null);

            if (sameDelim != null) {
                // CASE A: update fields if changed
                boolean changed = false;

                if (!sameDelim.getWardName().equals(wd.getWard_name())) {
                    sameDelim.setWardName(wd.getWard_name());
                    changed = true;
                }

                if (sameDelim.getWardNum() != wn) {
                    sameDelim.setWardNum(wn);
                    changed = true;
                }

                if (changed) wardRepo.save(sameDelim);

            } else {
                // CASE B: same detailsId but older delimYear exists → create new row
                Ward w = new Ward();
                w.setLocalbody(lb);
                w.setWardNum(wn);
                w.setWardName(wd.getWard_name());
                w.setDelimitationYear(delimYear);
                w.setWardDetailsId(wdId);
                newWards.add(w);
            }
        }

        if (!newWards.isEmpty()) {
            wardRepo.saveAll(newWards);
            for (Ward w : newWards)
                wardsByDetailsIdMap.computeIfAbsent(w.getWardDetailsId(), k -> new ArrayList<>()).add(w);
        }

        log.info("Wards inserted: {} | Total ward_details_id groups for LB={}",
                newWards.size(), wardsByDetailsIdMap.size());

        // --------------------------------------------------------------------
        // 6. Validate result → all refer to a known ward_details_id
        // --------------------------------------------------------------------
        for (BatchImportRequest.ResultDto rd : req.getResults()) {
            if (!wardsByDetailsIdMap.containsKey(rd.getWard_details_id())) {
                throw new RuntimeException("Unknown ward_details_id: " + rd.getWard_details_id());
            }
        }

        // --------------------------------------------------------------------
        // 7. Resolve candidates per *ward instance (correct delimYear)*
        // --------------------------------------------------------------------
        Map<String, LbCandidate> candidateMap = new HashMap<>();
        List<LbCandidate> newCandidates = new ArrayList<>();

        for (BatchImportRequest.ResultDto rd : req.getResults()) {

            List<Ward> wardList = wardsByDetailsIdMap.get(rd.getWard_details_id());

            Ward ward = wardList.stream()
                    .filter(w -> w.getDelimitationYear() == delimYear)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException(
                            "Ward missing for ward_details_id=" + rd.getWard_details_id()
                                    + " delimYear=" + delimYear
                    ));

            Long partyId = null;
            if (rd.getParty() != null) {
                Party p = partyByShortName.get(rd.getParty().toUpperCase());
                if (p != null) partyId = p.getId();
            }

            String key = ward.getId() + "|" + rd.getCand_name().toUpperCase() + "|" + partyId;

            if (candidateMap.containsKey(key))
                continue;

            List<LbCandidate> stored = candidateRepo.findCandidateForWard(
                    lbId, electionYear, rd.getCand_name(), partyId, ward.getId().intValue()
            );

            if (stored.isEmpty()) {
                LbCandidate c = new LbCandidate();
                c.setLocalbodyId(lbId);
                c.setElectionYear(electionYear);
                c.setName(rd.getCand_name());
                c.setPartyId(partyId);

                newCandidates.add(c);
                candidateMap.put(key, c);

            } else {
                candidateMap.put(key, stored.get(0));
            }
        }

        if (!newCandidates.isEmpty()) {
            candidateRepo.saveAll(newCandidates);
            log.info("New candidates inserted={}", newCandidates.size());
        }

        // --------------------------------------------------------------------
        // 8. Insert/update results
        // --------------------------------------------------------------------
        List<LbWardResult> newResults = new ArrayList<>();
        List<LbWardResult> updates = new ArrayList<>();

        for (BatchImportRequest.ResultDto rd : req.getResults()) {

            List<Ward> wardList = wardsByDetailsIdMap.get(rd.getWard_details_id());

            Ward ward = wardList.stream()
                    .filter(w -> w.getDelimitationYear() == delimYear)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException(
                            "Ward missing for results → ward_details_id=" + rd.getWard_details_id()
                                    + " delimYear=" + delimYear
                    ));

            Long partyId = null;
            if (rd.getParty() != null) {
                Party p = partyByShortName.get(rd.getParty().toUpperCase());
                if (p != null) partyId = p.getId();
            }

            String key = ward.getId() + "|" + rd.getCand_name().toUpperCase() + "|" + partyId;
            LbCandidate cand = candidateMap.get(key);

            if (cand == null) {
                throw new RuntimeException("Candidate missing for wardId=" + ward.getId());
            }

            LbWardResult existing = resultRepo
                    .findByWardIdAndCandidateIdAndElectionYear(
                            ward.getId().intValue(), cand.getId(), electionYear)
                    .orElse(null);

            if (existing == null) {
                LbWardResult x = new LbWardResult();
                x.setWardId(ward.getId().intValue());
                x.setCandidateId(cand.getId());
                x.setElectionYear(electionYear);
                x.setVotes(Integer.parseInt(rd.getCand_vote()));
                newResults.add(x);
                log.info("New result to insert for wardId= {}, candId= {} and election_year = {}",
                        ward.getId(), cand.getId(), electionYear);

            } else {
                existing.setVotes(Integer.parseInt(rd.getCand_vote()));
                updates.add(existing);
            }
        }

        if (!newResults.isEmpty()) resultRepo.saveAll(newResults);
        if (!updates.isEmpty()) resultRepo.saveAll(updates);

        log.info("Results inserted={}, updated={}", newResults.size(), updates.size());

        long totalOps = newWards.size() + newCandidates.size() + newResults.size() + updates.size();

        log.info("Batch import successful. Total operations={}", totalOps);

        return totalOps;
    }


    private String candKey(Long lbId, int year, String name, Long pid) {
        return lbId + "|" + year + "|" + name.toUpperCase() + "|" + pid;
    }

    private String resultKey(Long wardId, Long candId, int year) {
        return wardId + "|" + candId + "|" + year;
    }

    private String batchResultKey(String wardDetailsId, String name, Long partyId) {
        return wardDetailsId + "|" + name.toUpperCase() + "|" + (partyId == null ? "NULL" : partyId);
    }

}
