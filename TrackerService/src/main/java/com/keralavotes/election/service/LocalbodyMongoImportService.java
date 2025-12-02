package com.keralavotes.election.service;

import com.keralavotes.election.dto.MongoLocalbodyResult;
import com.keralavotes.election.dto.MongoWardData;
import com.keralavotes.election.entity.*;
import com.keralavotes.election.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class LocalbodyMongoImportService {

    private final MongoWardDataRepository mongoWardRepo;
    private final MongoLocalbodyResultRepository mongoResultRepo;
    private final LocalbodyRepository localbodyRepo;
    private final WardRepository wardRepo;
    private final LbCandidateRepository candidateRepo;
    private final LbWardResultRepository wardResultRepo;
    private final DistrictRepository districtRepo;
    private final PartyRepository partyRepo;

    public LocalbodyMongoImportService(
            MongoWardDataRepository mongoWardRepo,
            MongoLocalbodyResultRepository mongoResultRepo,
            LocalbodyRepository localbodyRepo,
            WardRepository wardRepo,
            LbCandidateRepository candidateRepo,
            LbWardResultRepository wardResultRepo,
            DistrictRepository districtRepo,
            PartyRepository partyRepo
    ) {
        this.mongoWardRepo = mongoWardRepo;
        this.mongoResultRepo = mongoResultRepo;
        this.localbodyRepo = localbodyRepo;
        this.wardRepo = wardRepo;
        this.candidateRepo = candidateRepo;
        this.wardResultRepo = wardResultRepo;
        this.districtRepo = districtRepo;
        this.partyRepo = partyRepo;
    }

    // ----------------------------------------------------
    // Helper normalization
    // ----------------------------------------------------
    /** For keys like district/localbody/type (ignore spaces & underscores) */
    private String normKey(String s) {
        if (s == null) return "";
        return s.trim().toUpperCase().replace(" ", "").replace("_", "");
    }

    /** For human names (candidate, party short name) – keep spaces */
    private String normName(String s) {
        if (s == null) return "";
        return s.trim().toUpperCase();
    }

    private String normalizeType(String t) {
        if (t == null) return "";
        String n = normKey(t);
        if (n.equals("GRAMAPANCHAYATH") || n.equals("GRAMAPANCHAYAT"))
            return "gramapanchayat";
        if (n.equals("BLOCKPANCHAYATH"))
            return "blockpanchayat";
        if (n.equals("DISTRICTPANCHAYATH"))
            return "districtpanchayat";
        return t.trim().toLowerCase();
    }

    private String lbKey(String districtName, String lbName, String type) {
        return normKey(districtName) + "|" + normKey(lbName) + "|" + normalizeType(type);
    }

    /** For existing wards in DB we use (localbody_id + ward_num) to respect DB UNIQUE constraint */
    private String wardDbKey(Long localbodyId, int wardNum) {
        return localbodyId + "|" + wardNum;
    }

    /** For mapping Mongo ward rows during this run (includes delimitation year too) */
    private String wardCacheKey(String lbKey, int delimYear, int wardNum) {
        return lbKey + "|" + delimYear + "|" + wardNum;
    }

    /** Candidate key including party */
    private String candidateKey(Long lbId, int year, String name, Long partyId) {
        return lbId + "|" + year + "|" + normName(name) + "|" + (partyId == null ? "NULL" : partyId);
    }

    /** Result key */
    private String resultKey(int wardId, int candId, int year) {
        return wardId + "|" + candId + "|" + year;
    }

    // Helper to hold result rows before we know candidate IDs
    private static class PendingResult {
        final int wardId;
        final String candKey;
        final int year;
        int votes;

        PendingResult(int wardId, String candKey, int year, int votes) {
            this.wardId = wardId;
            this.candKey = candKey;
            this.year = year;
            this.votes = votes;
        }
    }

    // ----------------------------------------------------
    // MAIN IMPORT
    // ----------------------------------------------------
    @Transactional
    public void importAll() {

        log.info("=== LOCALBODY MONGO → SQL IMPORT STARTED ===");

        List<MongoWardData> mongoWards = mongoWardRepo.findAll();
        List<MongoLocalbodyResult> mongoResults = mongoResultRepo.findAll();

        log.info("Mongo: wards = {}, results = {}", mongoWards.size(), mongoResults.size());

        // ----------------------------------------------------
        // LOAD EXISTING SQL DATA
        // ----------------------------------------------------
        Map<String, District> districtByKey =
                districtRepo.findAll().stream()
                        .collect(Collectors.toMap(
                                d -> normKey(d.getName()),
                                d -> d
                        ));

        Map<String, Party> partyByShortName =
                partyRepo.findAll().stream()
                        .collect(Collectors.toMap(
                                p -> normName(p.getShortName()),
                                p -> p
                        ));

        Map<String, Localbody> existingLBs =
                localbodyRepo.findAll().stream()
                        .collect(Collectors.toMap(
                                lb -> lbKey(lb.getDistrict().getName(), lb.getName(), lb.getType()),
                                lb -> lb,
                                (a, b) -> a
                        ));

        // IMPORTANT: ward uniqueness in DB is (localbody_id, ward_num)
        Map<String, Ward> existingWardsByDbKey =
                wardRepo.findAll().stream()
                        .filter(w -> w.getLocalbody() != null && w.getWardNum() != null)
                        .collect(Collectors.toMap(
                                w -> wardDbKey(w.getLocalbody().getId(), w.getWardNum()),
                                w -> w,
                                (a, b) -> a
                        ));
        Map<String, Ward> existingWardsByDetailsId =
                wardRepo.findAll().stream()
                        .filter(w -> w.getWardDetailsId() != null)
                        .collect(Collectors.toMap(
                                Ward::getWardDetailsId,
                                w -> w,
                                (a, b) -> a
                        ));


        // Load existing candidates and ward results for idempotent upsert
        Map<String, LbCandidate> existingCandidatesByKey =
                candidateRepo.findAll().stream()
                        .collect(Collectors.toMap(
                                c -> candidateKey(c.getLocalbodyId(), c.getElectionYear(), c.getName(), c.getPartyId()),
                                c -> c,
                                (a, b) -> a
                        ));

        Map<String, LbWardResult> existingResultsByKey =
                wardResultRepo.findAll().stream()
                        .collect(Collectors.toMap(
                                r -> resultKey(r.getWardId(), r.getCandidateId(), r.getElectionYear()),
                                r -> r,
                                (a, b) -> a
                        ));

        log.info("Existing: localbodies = {}, wards = {}, candidates = {}, results = {}",
                existingLBs.size(), existingWardsByDbKey.size(), existingCandidatesByKey.size(), existingResultsByKey.size());

        // ----------------------------------------------------
        // STAGE 1 – INSERT/REUSE LOCALBODIES & WARDS
        // ----------------------------------------------------
        List<Localbody> lbInsertList = new ArrayList<>();
        List<Ward> wardInsertList = new ArrayList<>();

        Map<String, Localbody> lbCache = new HashMap<>();
        Map<String, Ward> wardCache = new HashMap<>();

        log.info("=== Processing wards from Mongo ===");

        int wardCounter = 0;

        for (MongoWardData mw : mongoWards) {

            if (++wardCounter % 5000 == 0) {
                log.info("Processed {} / {} mongo wards...", wardCounter, mongoWards.size());
            }

            String distKey = normKey(mw.getDistrict());
            District dist = districtByKey.get(distKey);

            if (dist == null) {
                log.warn("Skipping ward {}, unknown district: {}", mw.getId(), mw.getDistrict());
                continue;
            }

            String typeNorm = normalizeType(mw.getLocalbody_type());
            String lbKey = lbKey(mw.getDistrict(), mw.getLocalbody_name(), mw.getLocalbody_type());

            // 1️⃣ Localbody: reuse from cache → existing → or create new
            Localbody lb = lbCache.get(lbKey);

            if (lb == null) {
                lb = existingLBs.get(lbKey);
                if (lb != null) {
                    log.debug("Reusing existing localbody: {}", lbKey);
                } else {
                    lb = new Localbody();
                    lb.setName(mw.getLocalbody_name());
                    lb.setType(typeNorm);
                    lb.setDistrict(dist);

                    lbInsertList.add(lb);
                    log.debug("Prepared NEW localbody: {}", lbKey);
                }
                lbCache.put(lbKey, lb);
            }

            int wardNum = Integer.parseInt(mw.getWard_num());
            int delimYear = Integer.parseInt(mw.getDelimitation_year());
            String cacheKey = wardCacheKey(lbKey, delimYear, wardNum);

// 0️⃣ First check by ward_details_id
            Ward w = existingWardsByDetailsId.get(mw.getId());
            if (w != null) {
                log.debug("Reusing ward via ward_details_id={}", mw.getId());
                wardCache.put(cacheKey, w);
                continue;
            }

// 1️⃣ Next check by (localbody_id, ward_num)
            if (lb.getId() != null) {
                String dbKey = wardDbKey(lb.getId(), wardNum);
                w = existingWardsByDbKey.get(dbKey);
                if (w != null) {
                    log.debug("Reusing ward via localbody+wardNum: LB={} WN={}", lb.getId(), wardNum);
                    wardCache.put(cacheKey, w);
                    continue;
                }
            }

// 2️⃣ Create NEW ward
            w = new Ward();
            w.setLocalbody(lb);
            w.setWardNum(wardNum);
            w.setWardName(mw.getWard_name());
            w.setDelimitationYear(delimYear);
            w.setWardDetailsId(mw.getId());

            wardInsertList.add(w);
            wardCache.put(cacheKey, w);

            log.debug("NEW ward created: {}", cacheKey);

        }

        // Save new localbodies then wards
        if (!lbInsertList.isEmpty()) {
            localbodyRepo.saveAll(lbInsertList);
            log.info("Inserted {} new localbodies", lbInsertList.size());
        }
        if (!wardInsertList.isEmpty()) {
            wardRepo.saveAll(wardInsertList);
            log.info("Inserted {} new wards", wardInsertList.size());
        }

        // Reload wardByDetailsId to resolve ward from ward_details_id
        Map<String, Ward> wardByDetailsId = wardRepo.findAll().stream()
                .filter(w -> w.getWardDetailsId() != null)
                .collect(Collectors.toMap(
                        Ward::getWardDetailsId,
                        w -> w,
                        (a, b) -> a
                ));

        log.info("Total wards with wardDetailsId after import: {}", wardByDetailsId.size());

        // ----------------------------------------------------
        // STAGE 2 – CANDIDATES & RESULTS
        // ----------------------------------------------------
        log.info("=== Processing results from Mongo ===");

        // candidate cache starts with existing candidates; we add new ones on top
        Map<String, LbCandidate> candByKey = new HashMap<>(existingCandidatesByKey);
        List<LbCandidate> newCandidates = new ArrayList<>();

        // pending results keyed by (wardId + candKey + year)
        Map<String, PendingResult> pendingResultMap = new HashMap<>();

        int resCounter = 0;

        for (MongoLocalbodyResult mr : mongoResults) {

            if (++resCounter % 10000 == 0) {
                log.info("Processed {} / {} mongo results...", resCounter, mongoResults.size());
            }

            Ward ward = wardByDetailsId.get(mr.getWard_details_id());
            if (ward == null) {
                log.warn("Result row skipped, wardDetailsId={} not found in SQL", mr.getWard_details_id());
                continue;
            }

            int year = Integer.parseInt(mr.getElection_year());
            int votes = Integer.parseInt(mr.getCand_vote());
            Long lbId = ward.getLocalbody().getId();

            // resolve partyId from shortName
            Long partyId = null;
            if (mr.getParty() != null && !mr.getParty().isBlank()) {
                Party p = partyByShortName.get(normName(mr.getParty()));
                if (p != null) partyId = p.getId();
            }

            String candKey = candidateKey(lbId, year, mr.getCand_name(), partyId);

            LbCandidate cand = candByKey.get(candKey);
            if (cand == null) {
                // new candidate
                cand = new LbCandidate();
                cand.setLocalbodyId(lbId);
                cand.setElectionYear(year);
                cand.setName(mr.getCand_name());
                cand.setPartyId(partyId);

                newCandidates.add(cand);
                candByKey.put(candKey, cand);
            }

            String prKey = ward.getId() + "|" + candKey + "|" + year;
            PendingResult pr = pendingResultMap.get(prKey);
            if (pr == null) {
                pr = new PendingResult(ward.getId().intValue(), candKey, year, votes);
                pendingResultMap.put(prKey, pr);
            } else {
                // if duplicates in Mongo for same ward+candidate+year, last one wins (or sum if you want)
                pr.votes = votes;
            }
        }

        log.info("New candidates to insert: {}", newCandidates.size());
        candidateRepo.saveAll(newCandidates);

        // After saving, rebuild candidate map WITH IDs
        Map<String, LbCandidate> finalCandByKey =
                candidateRepo.findAll().stream()
                        .collect(Collectors.toMap(
                                c -> candidateKey(c.getLocalbodyId(), c.getElectionYear(), c.getName(), c.getPartyId()),
                                c -> c,
                                (a, b) -> a
                        ));

        // Rebuild existingResultsByKey as well (in case some rows were inserted by other runs)
        existingResultsByKey =
                wardResultRepo.findAll().stream()
                        .collect(Collectors.toMap(
                                r -> resultKey(r.getWardId(), r.getCandidateId(), r.getElectionYear()),
                                r -> r,
                                (a, b) -> a
                        ));

        List<LbWardResult> toInsert = new ArrayList<>();
        List<LbWardResult> toUpdate = new ArrayList<>();

        for (PendingResult pr : pendingResultMap.values()) {

            LbCandidate cand = finalCandByKey.get(pr.candKey);
            if (cand == null) {
                log.warn("No candidate found for candKey={}, skipping result", pr.candKey);
                continue;
            }

            String rk = resultKey(pr.wardId, cand.getId(), pr.year);
            LbWardResult existing = existingResultsByKey.get(rk);

            if (existing == null) {
                LbWardResult wr = new LbWardResult();
                wr.setWardId(pr.wardId);
                wr.setCandidateId(cand.getId());
                wr.setElectionYear(pr.year);
                wr.setVotes(pr.votes);

                toInsert.add(wr);
                existingResultsByKey.put(rk, wr);
            } else {
                existing.setVotes(pr.votes);
                toUpdate.add(existing);
            }
        }

        if (!toInsert.isEmpty()) {
            wardResultRepo.saveAll(toInsert);
        }
        if (!toUpdate.isEmpty()) {
            wardResultRepo.saveAll(toUpdate);
        }

        log.info("WardResults inserted = {}, updated = {}", toInsert.size(), toUpdate.size());
        log.info("=== LOCALBODY IMPORT COMPLETED SUCCESSFULLY ===");
    }
}
