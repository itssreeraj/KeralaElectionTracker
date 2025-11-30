package com.keralavotes.election.service;

import com.keralavotes.election.entity.*;
import com.keralavotes.election.repository.*;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.BoothVotes;
import com.keralavotes.election.entity.Candidate;
import com.keralavotes.election.entity.PollingStation;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.BoothVotesRepository;
import com.keralavotes.election.repository.CandidateRepository;
import com.keralavotes.election.repository.LoksabhaConstituencyRepository;
import com.keralavotes.election.repository.PollingStationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CsvImportService {

    private final PollingStationRepository psRepo;
    private final LoksabhaConstituencyRepository lsRepo;
    private final AssemblyConstituencyRepository acRepo;
    private final CandidateRepository candidateRepo;
    private final BoothVotesRepository bvRepo;
    private final BoothTotalsRepository boothTotalsRepo;
    private final DistrictRepository districtRepo;

    /* ===========================================================
       BOOTH IMPORT WITH AUTO-CREATE + DUPLICATE SKIP
       =========================================================== */
    @Transactional
    public String importBoothsCsv(MultipartFile file) throws Exception {

        int inserted = 0;
        int skipped = 0;

        try (var in = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {

            CSVFormat format = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withIgnoreEmptyLines(true)
                    .withTrim(true);

            CSVParser parser = new CSVParser(in, format);

            for (CSVRecord rec : parser) {

                // ======= READ CSV FIELDS =======
                String districtCode = rec.get("district_code");
                String districtName = rec.get("district_name");

                Integer acCode = Integer.parseInt(rec.get("ac_code"));
                String acName = rec.get("ac_name");

                String psNumberRaw = rec.get("ps_number_raw");
                Integer psNumber = Integer.valueOf(rec.get("ps_number"));
                String psSuffix = rec.get("ps_suffix");
                String name = rec.get("polling_station_name");


                // ======= 1. AUTO-CREATE DISTRICT =======
                District district = districtRepo.findByDistrictCode(Integer.parseInt(districtCode))
                        .orElseGet(() -> {
                            District d = District.builder()
                                    .districtCode(Integer.parseInt(districtCode))
                                    .name(districtName)
                                    .build();
                            return districtRepo.save(d);
                        });


                // ======= 2. AUTO-CREATE ASSEMBLY CONSTITUENCY =======
                AssemblyConstituency ac = acRepo.findByAcCode(acCode)
                        .orElseGet(() -> {
                            AssemblyConstituency a = AssemblyConstituency.builder()
                                    .acCode(acCode)
                                    .name(acName)
                                    .district(district)
                                    .ls(null) // LS mapping done later via admin UI
                                    .build();
                            return acRepo.save(a);
                        });


                // Normalize suffix (empty = null)
                String normalizedSuffix = (psSuffix == null || psSuffix.isBlank()) ? "" : psSuffix;


                // ======= 3. CHECK FOR DUPLICATE POLLING STATION =======
                Optional<PollingStation> existing =
                        psRepo.findByAc_AcCodeAndPsNumberAndPsSuffix(acCode, psNumber, normalizedSuffix);

                if (existing.isPresent()) {
                    skipped++;
                    log.info("Skipping duplicate PS: AC {} PS {} {}",acCode, psNumber, normalizedSuffix);
                    continue;
                }


                // ======= 4. INSERT POLLING STATION (ls = null) =======
                PollingStation ps = PollingStation.builder()
                        .ac(ac)
                        .ls(null)                    // will be populated later
                        .psNumber(psNumber)
                        .psSuffix(normalizedSuffix)
                        .psNumberRaw(psNumberRaw)
                        .name(name)
                        .localbody(null)
                        .ward(null)
                        .build();

                psRepo.save(ps);
                inserted++;
            }
        }

        return "Booths inserted = " + inserted + ", Skipped duplicates = " + skipped;
    }

    // ----------------------------------------
    // Import booth-wise votes from Form 20 CSV
    // ----------------------------------------
    @Transactional
    public void importForm20Votes(MultipartFile file) throws Exception {

        long start = System.currentTimeMillis();
        log.info("=== Form20 import started ===");

    /* ---------------------------------------------------------
       STEP 1: Load full lookup data into memory (FAST)
    --------------------------------------------------------- */

        // Map <(acCode,psNumber,psSuffix), PollingStation>
        Map<String, PollingStation> psMap = psRepo.findAll()
                .stream()
                .collect(Collectors.toMap(
                        ps -> ps.getAc().getAcCode() + "|" +
                                ps.getPsNumber() + "|" +
                                (ps.getPsSuffix() == null ? "" : ps.getPsSuffix().trim()),
                        ps -> ps
                ));

        log.info("Loaded {} polling stations", psMap.size());

        // Map <(lsName|candidateName|year), Candidate>
        Map<String, Candidate> candidateMap = candidateRepo.findAll()
                .stream()
                .collect(Collectors.toMap(
                        c -> c.getLs().getName().trim().toLowerCase() + "|" +
                                c.getName().trim().toLowerCase() + "|" +
                                c.getElectionYear(),
                        c -> c
                ));

        log.info("Loaded {} candidates", candidateMap.size());

        // Map existing booth votes to skip duplicates
        // key format: "psId|candidateId|year"
        Map<String, BoothVotes> existingVotes = bvRepo.findAll()
                .stream()
                .collect(Collectors.toMap(
                        bv -> bv.getPollingStation().getId() + "|" +
                                bv.getCandidate().getId() + "|" +
                                bv.getYear(),
                        bv -> bv,
                        (a, b) -> a     // ignore duplicates
                ));

        log.info("Loaded {} existing booth vote rows", existingVotes.size());


    /* ---------------------------------------------------------
       STEP 2: Parse CSV rows
    --------------------------------------------------------- */
        List<BoothVotes> toInsert = new ArrayList<>();

        try (var in = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withIgnoreEmptyLines(true)
                    .withTrim(true)
                    .parse(in);

            int processed = 0;
            int skippedMissingPS = 0;
            int skippedMissingCandidate = 0;
            int skippedDuplicate = 0;

            for (CSVRecord rec : parser) {

                processed++;

                int acCode = Integer.parseInt(rec.get("ac"));
                int psNumber = Integer.parseInt(rec.get("ps_number"));
                String psSuffix = rec.get("ps_suffix");
                if (psSuffix == null) psSuffix = "";
                psSuffix = psSuffix.trim();

                String lsName = rec.get("ls").trim().toLowerCase();
                String candidateName = rec.get("candidate_name").trim().toLowerCase();
                int year = Integer.parseInt(rec.get("year"));
                int votes = Integer.parseInt(rec.get("votes"));

            /* ---------------------------------------------------------
               STEP 2A: Find polling station (from cached map)
            --------------------------------------------------------- */
                String psKey = acCode + "|" + psNumber + "|" + psSuffix;
                PollingStation ps = psMap.get(psKey);

                if (ps == null) {
                    skippedMissingPS++;
                    continue;
                }

            /* ---------------------------------------------------------
               STEP 2B: Find candidate (from cached map)
            --------------------------------------------------------- */
                String candKey = lsName + "|" + candidateName + "|" + year;
                Candidate candidate = candidateMap.get(candKey);

                if (candidate == null) {
                    skippedMissingCandidate++;
                    continue;
                }

            /* ---------------------------------------------------------
               STEP 2C: Skip duplicates (existing booth vote)
            --------------------------------------------------------- */
                String voteKey = ps.getId() + "|" + candidate.getId() + "|" + year;
                if (existingVotes.containsKey(voteKey)) {
                    skippedDuplicate++;
                    continue;
                }

            /* ---------------------------------------------------------
               STEP 2D: Add batch insert
            --------------------------------------------------------- */
                BoothVotes bv = BoothVotes.builder()
                        .pollingStation(ps)
                        .candidate(candidate)
                        .votes(votes)
                        .year(year)
                        .build();

                toInsert.add(bv);

                // Gradually free memory for huge imports
                if (toInsert.size() >= 2000) {
                    bvRepo.saveAll(toInsert);
                    toInsert.clear();
                }
            }

            // Final batch save
            if (!toInsert.isEmpty()) {
                bvRepo.saveAll(toInsert);
            }

            long ms = System.currentTimeMillis() - start;

            log.info("=== Form20 import finished in {} ms ===", ms);
            log.info("Total rows processed  : {}", processed);
            log.info("Inserted new votes    : {}", toInsert.size());
            log.info("Skipped missing PS    : {}", skippedMissingPS);
            log.info("Skipped missing cand  : {}", skippedMissingCandidate);
            log.info("Skipped duplicates    : {}", skippedDuplicate);
        }
    }


    // ----------------------------------------
    // Import booth totals from Form 20 CSV
    // ----------------------------------------
    @Transactional
    public void importForm20Totals(MultipartFile file) throws Exception {

        long start = System.currentTimeMillis();
        log.info("=== Form20 Totals Import Started ===");

    /* ---------------------------------------------------------
       STEP 1: Preload lookup maps (FAST)
    --------------------------------------------------------- */

        // Map <acCode|psNumber|psSuffix> → PollingStation
        Map<String, PollingStation> psMap = psRepo.findAll()
                .stream()
                .collect(Collectors.toMap(
                        ps -> ps.getAc().getAcCode() + "|" +
                                ps.getPsNumber() + "|" +
                                (ps.getPsSuffix() == null ? "" : ps.getPsSuffix().trim()),
                        ps -> ps
                ));

        log.info("Loaded {} polling stations", psMap.size());

        // Map existing totals to detect duplicates
        // key: "psId|year"
        Map<String, BoothTotals> existingTotals = boothTotalsRepo.findAll()
                .stream()
                .collect(Collectors.toMap(
                        bt -> bt.getPollingStation().getId() + "|" + bt.getYear(),
                        bt -> bt,
                        (a, b) -> a
                ));

        log.info("Loaded {} existing booth totals", existingTotals.size());

    /* ---------------------------------------------------------
       STEP 2: Read CSV and build list of inserts
    --------------------------------------------------------- */

        List<BoothTotals> batchInsert = new ArrayList<>();

        CSVParser parser = CSVFormat.DEFAULT
                .withFirstRecordAsHeader()
                .withIgnoreSurroundingSpaces()
                .withTrim()
                .parse(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));

        int processed = 0;
        int skippedMissingPS = 0;
        int skippedDuplicate = 0;

        for (CSVRecord row : parser) {

            processed++;

            int acCode = Integer.parseInt(row.get("ac"));
            int psNumber = Integer.parseInt(row.get("ps_number"));
            String psSuffix = row.get("ps_suffix");
            if (psSuffix == null) psSuffix = "";
            psSuffix = psSuffix.trim();

            int year = Integer.parseInt(row.get("year"));
            int totalValid = Integer.parseInt(row.get("total_valid"));
            int rejected = Integer.parseInt(row.get("rejected"));
            int nota = Integer.parseInt(row.get("nota"));

        /* ---------------------------------------------------------
           Lookup PollingStation (O(1), no DB)
        --------------------------------------------------------- */
            String psKey = acCode + "|" + psNumber + "|" + psSuffix;
            PollingStation ps = psMap.get(psKey);

            if (ps == null) {
                skippedMissingPS++;
                continue;
            }

        /* ---------------------------------------------------------
           Skip duplicate totals (O(1), no DB)
        --------------------------------------------------------- */
            String totalKey = ps.getId() + "|" + year;
            if (existingTotals.containsKey(totalKey)) {
                skippedDuplicate++;
                continue;
            }

        /* ---------------------------------------------------------
           Add to batch insert
        --------------------------------------------------------- */
            BoothTotals bt = BoothTotals.builder()
                    .pollingStation(ps)
                    .totalValid(totalValid)
                    .rejected(rejected)
                    .nota(nota)
                    .year(year)
                    .build();

            batchInsert.add(bt);

            // batch flush to keep memory low
            if (batchInsert.size() >= 2000) {
                boothTotalsRepo.saveAll(batchInsert);
                batchInsert.clear();
            }
        }

        // final flush
        if (!batchInsert.isEmpty()) {
            boothTotalsRepo.saveAll(batchInsert);
        }

        long ms = System.currentTimeMillis() - start;

    /* ---------------------------------------------------------
       LOG SUMMARY
    --------------------------------------------------------- */

        log.info("=== Form20 Totals Import Completed in {} ms ===", ms);
        log.info("Total CSV rows processed : {}", processed);
        log.info("Inserted new totals     : {}", batchInsert.size());
        log.info("Skipped missing PS      : {}", skippedMissingPS);
        log.info("Skipped duplicates      : {}", skippedDuplicate);
    }


    @Transactional
    public String importCandidatesCsv(MultipartFile file) throws Exception {

        log.info("Starting Candidate CSV import: {}", file.getOriginalFilename());

        int inserted = 0;
        int updated = 0;

        Pattern p = Pattern.compile(
                "^LS_(.*?)_AC(\\d+)_C\\(\\s*(\\d+),\\s*'(.+)'\\s*\\)$"
        );

        try (var in = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            CSVParser parser = new CSVParser(in,
                    CSVFormat.DEFAULT
                            .withFirstRecordAsHeader()
                            .withTrim(true)
                            .withIgnoreEmptyLines(true)
            );

            for (CSVRecord rec : parser) {

                try {
                    String key = rec.get("candidate_key").trim();

                    Matcher m = p.matcher(key);
                    if (!m.matches()) {
                        log.warn("Skipping invalid candidate_key format: {}", key);
                        continue;
                    }

                    String lsName = m.group(1).trim();
                    Integer acCode = Integer.valueOf(m.group(2));
                    Integer candidateIndex = Integer.valueOf(m.group(3));
                    String candidateName = m.group(4).trim();

                    Integer year = 2024; // default for now

                    // ---- LS ----
                    LoksabhaConstituency ls = lsRepo.findByName(lsName)
                            .orElseGet(() -> {
                                log.info("Creating LS entry: {}", lsName);
                                return null;
                            });

                    // ---- Candidate Existence Check ----
                    Optional<Candidate> existing =
                            candidateRepo.findByNameAndLs_NameAndElectionYear(candidateName, lsName, year);

                    if (existing.isPresent()) {
                        // maybe update index later
                        updated++;
                        continue;
                    }

                    Candidate candidate = Candidate.builder()
                            .name(candidateName)
                            .ls(ls)
                            .electionYear(year)
                            .party(null)
                            .alliance(null)
                            .build();

                    candidateRepo.save(candidate);
                    log.info("Inserted Candidate: {} (LS: {}, AC: {})",candidateName, lsName, acCode);
                    inserted++;

                } catch (Exception ex) {
                    log.error("Error processing candidate row: {}", rec, ex);
                }
            }
        }

        String summary = "Inserted = " + inserted + ", Updated = " + updated;
        log.info("Candidate CSV Import Finished: {}", summary);
        return summary;
    }


}
