package com.keralavotes.election.service;

import com.keralavotes.election.dto.LocalbodyFixReport;
import com.keralavotes.election.dto.MongoLocalbodyResult;
import com.keralavotes.election.dto.MongoWardData;
import com.keralavotes.election.entity.*;
import com.keralavotes.election.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocalbodyImportFixService {

    private final MongoWardDataRepository mongoWardRepo;
    private final MongoLocalbodyResultRepository mongoResultRepo;
    private final WardRepository wardRepo;
    private final LocalbodyRepository localbodyRepo;
    private final LbCandidateRepository candidateRepo;
    private final LbWardResultRepository wardResultRepo;
    private final PartyRepository partyRepo;
    private final DistrictRepository districtRepo;

    private String norm(String s) {
        if (s == null) return "";
        return s.trim().toUpperCase();
    }

    private String normalizeType(String t) {
        if (t == null) return "";
        t = t.trim().toUpperCase();
        return switch (t) {
            case "GRAMA_PANCHAYATH", "GRAMAPANCHAYATH", "GRAMAPANCHAYAT" -> "gramapanchayat";
            case "BLOCKPANCHAYATH" -> "blockpanchayat";
            case "DISTRICTPANCHAYATH" -> "districtpanchayat";
            default -> t.toLowerCase();
        };
    }

    // ==========================================================
    // 1️⃣ FIX MISSING WARDS
    // ==========================================================
    @Transactional
    public LocalbodyFixReport fixMissingWards() {

        LocalbodyFixReport report = new LocalbodyFixReport();

        List<MongoWardData> mongoWards = mongoWardRepo.findAll();

        Map<String, Ward> sqlWardMap = wardRepo.findAll().stream()
                .filter(w -> w.getWardDetailsId() != null)
                .collect(Collectors.toMap(Ward::getWardDetailsId, w -> w));

        Map<String, District> districtByName =
                districtRepo.findAll().stream()
                        .collect(Collectors.toMap(d -> norm(d.getName()), d -> d));

        Map<String, Localbody> lbByKey = localbodyRepo.findAll().stream()
                .collect(Collectors.toMap(
                        lb -> norm(lb.getDistrict().getName()) + "|" +
                                norm(lb.getName()) + "|" +
                                normalizeType(lb.getType()),
                        lb -> lb,
                        (a,b)->a
                ));

        List<Ward> toInsert = new ArrayList<>();
        List<String> insertedIds = new ArrayList<>();

        for (MongoWardData mw : mongoWards) {

            if (sqlWardMap.containsKey(mw.getId()))
                continue;

            String dKey = norm(mw.getDistrict());
            District dist = districtByName.get(dKey);
            if (dist == null) {
                log.warn("District not found: {}", mw.getDistrict());
                continue;
            }

            String lbKey = dKey + "|" +
                    norm(mw.getLocalbody_name()) + "|" +
                    normalizeType(mw.getLocalbody_type());

            Localbody lb = lbByKey.get(lbKey);
            if (lb == null) {
                log.warn("Localbody missing for ward: {}", lbKey);
                continue;
            }

            Ward w = new Ward();
            w.setLocalbody(lb);
            w.setWardNum(Integer.parseInt(mw.getWard_num()));
            w.setWardName(mw.getWard_name());
            w.setWardDetailsId(mw.getId());
            w.setDelimitationYear(Integer.parseInt(mw.getDelimitation_year()));

            toInsert.add(w);
            insertedIds.add(mw.getId());
        }

        wardRepo.saveAll(toInsert);

        report.setWardsInserted(toInsert.size());
        report.setWardIdsInserted(insertedIds);
        report.setMessage("Missing wards fixed.");

        return report;
    }


    // ==========================================================
    // 2️⃣ FIX MISSING CANDIDATES (with PARTY key)
    // ==========================================================
    @Transactional
    public LocalbodyFixReport fixMissingCandidates() {

        LocalbodyFixReport report = new LocalbodyFixReport();
        List<MongoLocalbodyResult> mongoResults = mongoResultRepo.findAll();

        Map<String, Ward> wardByDetailsId = wardRepo.findAll().stream()
                .filter(w -> w.getWardDetailsId() != null)
                .collect(Collectors.toMap(Ward::getWardDetailsId, w -> w));

        Map<String, Party> partyByName = partyRepo.findAll().stream()
                .collect(Collectors.toMap(p -> norm(p.getShortName()), p -> p));

        Set<String> sqlCandKeys = candidateRepo.findAll().stream()
                .map(c -> c.getLocalbodyId() + "|" +
                        c.getElectionYear() + "|" +
                        norm(c.getName()) + "|" +
                        (c.getPartyId() == null ? "NULL" : c.getPartyId()))
                .collect(Collectors.toSet());

        List<LbCandidate> toInsert = new ArrayList<>();
        List<String> insertedKeys = new ArrayList<>();

        for (MongoLocalbodyResult mr : mongoResults) {

            Ward w = wardByDetailsId.get(mr.getWard_details_id());
            if (w == null) continue;

            int year = Integer.parseInt(mr.getElection_year());

            Long partyId = null;
            if (mr.getParty() != null && !mr.getParty().isBlank()) {
                Party p = partyByName.get(norm(mr.getParty()));
                if (p != null) partyId = p.getId();
            }

            String key =
                    w.getLocalbody().getId() + "|" +
                            year + "|" +
                            norm(mr.getCand_name()) + "|" +
                            (partyId == null ? "NULL" : partyId);

            if (sqlCandKeys.contains(key)) continue;

            LbCandidate c = new LbCandidate();
            c.setLocalbodyId(w.getLocalbody().getId());
            c.setElectionYear(year);
            c.setName(mr.getCand_name());
            c.setPartyId(partyId);

            toInsert.add(c);
            insertedKeys.add(key);
        }

        candidateRepo.saveAll(toInsert);

        report.setCandidatesInserted(toInsert.size());
        report.setCandidateKeysInserted(insertedKeys);
        report.setMessage("Missing candidates fixed.");

        return report;
    }


    // ==========================================================
    // 3️⃣ FIX MISSING RESULTS (duplicate-safe)
    // ==========================================================
    @Transactional
    public LocalbodyFixReport fixMissingResults() {

        LocalbodyFixReport report = new LocalbodyFixReport();
        List<MongoLocalbodyResult> mongoResults = mongoResultRepo.findAll();

        Map<String, Ward> wardByDetailsId = wardRepo.findAll().stream()
                .filter(w -> w.getWardDetailsId() != null)
                .collect(Collectors.toMap(Ward::getWardDetailsId, w -> w));

        Map<String, LbCandidate> candMap = candidateRepo.findAll().stream()
                .collect(Collectors.toMap(
                        c -> c.getLocalbodyId() + "|" +
                                c.getElectionYear() + "|" +
                                norm(c.getName()) + "|" +
                                (c.getPartyId() == null ? "NULL" : c.getPartyId()),
                        c -> c,
                        (a,b)->a
                ));

        Set<String> sqlResults = wardResultRepo.findAll().stream()
                .map(r -> r.getWardId() + "|" + r.getCandidateId() + "|" + r.getElectionYear())
                .collect(Collectors.toSet());

        List<LbWardResult> toInsert = new ArrayList<>();
        List<String> insertedKeys = new ArrayList<>();

        for (MongoLocalbodyResult mr : mongoResults) {

            Ward w = wardByDetailsId.get(mr.getWard_details_id());
            if (w == null) continue;

            int year = Integer.parseInt(mr.getElection_year());
            int votes = Integer.parseInt(mr.getCand_vote());

            // candidate key with party:
            String candKey =
                    w.getLocalbody().getId() + "|" +
                            year + "|" +
                            norm(mr.getCand_name()) + "|" +
                            (mr.getParty() == null ? "NULL" : norm(mr.getParty()));

            LbCandidate cand = candMap.get(candKey);
            if (cand == null) continue;

            String key =
                    w.getId() + "|" +
                            cand.getId() + "|" +
                            year;

            if (sqlResults.contains(key)) continue;

            LbWardResult wr = new LbWardResult();
            wr.setWardId(w.getId().intValue());
            wr.setCandidateId(cand.getId());
            wr.setElectionYear(year);
            wr.setVotes(votes);

            toInsert.add(wr);
            insertedKeys.add(key);
        }

        wardResultRepo.saveAll(toInsert);

        report.setResultsInserted(toInsert.size());
        report.setResultKeysInserted(insertedKeys);
        report.setMessage("Missing results fixed.");

        return report;
    }
}
