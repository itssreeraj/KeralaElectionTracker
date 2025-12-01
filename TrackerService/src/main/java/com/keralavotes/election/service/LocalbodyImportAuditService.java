package com.keralavotes.election.service;

import com.keralavotes.election.dto.LocalbodyImportAudit;
import com.keralavotes.election.dto.MongoLocalbodyResult;
import com.keralavotes.election.dto.MongoWardData;
import com.keralavotes.election.entity.*;
import com.keralavotes.election.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocalbodyImportAuditService {

    private final MongoWardDataRepository mongoWardRepo;
    private final MongoLocalbodyResultRepository mongoResultRepo;
    private final WardRepository wardRepo;
    private final LbCandidateRepository candidateRepo;
    private final LbWardResultRepository wardResultRepo;
    private final PartyRepository partyRepo;

    private String norm(String s) {
        if (s == null) return "";
        return s.trim().toUpperCase();
    }

    public LocalbodyImportAudit audit() {

        log.info("=== STARTING LOCALBODY AUDIT ===");

        LocalbodyImportAudit audit = new LocalbodyImportAudit();

        log.info("Loading MongoDB + SQL data...");

        List<MongoWardData> mongoWards = mongoWardRepo.findAll();
        List<MongoLocalbodyResult> mongoResults = mongoResultRepo.findAll();
        List<Ward> sqlWards = wardRepo.findAll();
        List<LbCandidate> sqlCandidates = candidateRepo.findAll();
        List<LbWardResult> sqlResults = wardResultRepo.findAll();
        List<Party> sqlParties = partyRepo.findAll();

        log.info("Loaded Mongo Wards={}, Mongo Results={}", mongoWards.size(), mongoResults.size());
        log.info("Loaded SQL Wards={}, SQL Candidates={}, SQL Results={}",
                sqlWards.size(), sqlCandidates.size(), sqlResults.size());

        // ----------------------------------------------------
        // WARD CHECK
        // ----------------------------------------------------
        log.info("Checking for missing Wards...");

        Map<String, Ward> sqlWardMap = sqlWards.stream()
                .filter(w -> w.getWardDetailsId() != null)
                .collect(Collectors.toMap(Ward::getWardDetailsId, w -> w));

        Set<String> mongoWardIds = mongoWards.stream()
                .map(MongoWardData::getId)
                .collect(Collectors.toSet());

        List<String> missingWards = mongoWardIds.stream()
                .filter(id -> !sqlWardMap.containsKey(id))
                .toList();

        log.info("Missing Wards detected: {}", missingWards.size());

        // ----------------------------------------------------
        // PARTY CHECK
        // ----------------------------------------------------
        Set<String> sqlPartyNames = sqlParties.stream()
                .map(p -> norm(p.getShortName()))
                .collect(Collectors.toSet());

        List<String> missingParties = mongoResults.stream()
                .map(MongoLocalbodyResult::getParty)
                .filter(Objects::nonNull)
                .map(this::norm)
                .filter(p -> !p.isEmpty())
                .filter(p -> !sqlPartyNames.contains(p))
                .distinct()
                .collect(Collectors.toList());

        log.info("Missing Parties detected: {}", missingParties.size());

        // ----------------------------------------------------
        // CANDIDATE CHECK
        // ----------------------------------------------------
        log.info("Checking for missing Candidates...");

        Map<Long, Party> partyById = partyRepo.findAll().stream()
                .collect(Collectors.toMap(Party::getId, p -> p));

        Set<String> mongoCandidateKeys = new HashSet<>();
        Set<String> sqlCandidateKeys = new HashSet<>();

        // Build SQL candidate keys
        for (LbCandidate c : sqlCandidates) {

            String partyName = "NULL";
            if (c.getPartyId() != null) {
                Party p = partyById.get(c.getPartyId());
                if (p != null) partyName = norm(p.getShortName());
            }

            String key = c.getLocalbodyId() + "|" +
                    c.getElectionYear() + "|" +
                    norm(c.getName()) + "|" +
                    partyName;

            sqlCandidateKeys.add(key);
        }

        // Build Mongo candidate keys
        for (MongoLocalbodyResult mr : mongoResults) {

            Ward w = sqlWardMap.get(mr.getWard_details_id());
            if (w == null) continue;

            Long lbId = w.getLocalbody().getId();
            int year = Integer.parseInt(mr.getElection_year());
            String name = norm(mr.getCand_name());
            String party = mr.getParty() == null ? "NULL" : norm(mr.getParty());

            String key = lbId + "|" + year + "|" + name + "|" + party;

            mongoCandidateKeys.add(key);
        }

        // Compute missing
        List<String> missingCandidates = mongoCandidateKeys.stream()
                .filter(key -> !sqlCandidateKeys.contains(key))
                .toList();

        log.info("✔ Corrected Missing Candidates = {}", missingCandidates.size());


        // ----------------------------------------------------
        // RESULT CHECK
        // ----------------------------------------------------
        log.info("Checking for missing Ward Results...");

        Set<String> sqlResultKeys = sqlResults.stream()
                .map(r -> r.getWardId() + "|" + r.getCandidateId() + "|" + r.getElectionYear())
                .collect(Collectors.toSet());

        List<String> missingResults = new ArrayList<>();

        long counter = 0;
        for (MongoLocalbodyResult mr : mongoResults) {

            if (++counter % 5000 == 0) {
                log.info("Processed {} / {} result audit entries...", counter, mongoResults.size());
            }

            Ward w = sqlWardMap.get(mr.getWard_details_id());
            if (w == null) continue;

            int year = Integer.parseInt(mr.getElection_year());

            List<LbCandidate> candidates = sqlCandidates.stream()
                    .filter(c ->
                            Objects.equals(c.getLocalbodyId(), w.getLocalbody().getId()) &&
                                    c.getElectionYear() == year &&
                                    norm(c.getName()).equals(norm(mr.getCand_name()))
                    )
                    .toList();

            for (LbCandidate c : candidates) {
                String key = w.getId() + "|" + c.getId() + "|" + year;

                if (!sqlResultKeys.contains(key)) {
                    missingResults.add(key);
                }
            }
        }

        log.info("Missing Results detected: {}", missingResults.size());

        // ----------------------------------------------------
        // Fill DTO
        // ----------------------------------------------------
        audit.setTotalMongoWards(mongoWards.size());
        audit.setTotalSQLWards(sqlWards.size());

        audit.setMissingWards(missingWards.size());
        audit.setMissingWardIds(missingWards);

        audit.setMissingParties(missingParties.size());
        audit.setMissingPartyNames(missingParties);

        audit.setMissingCandidates(missingCandidates.size());
        audit.setMissingCandidateKeys(missingCandidates);

        audit.setMissingResults(missingResults.size());
        audit.setMissingResultKeys(missingResults);

        log.info("=== AUDIT COMPLETE ===");
        log.info("Summary → Missing Wards={}, Missing Candidates={}, Missing Results={}, Missing Parties={}",
                missingWards.size(),
                missingCandidates.size(),
                missingResults.size(),
                missingParties.size()
        );

        return audit;
    }
}
