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
import java.util.Optional;

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
                District district = districtRepo.findByDistrictCode(districtCode)
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
    public void importForm20Votes(MultipartFile file) throws Exception {

        try (var in = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withIgnoreEmptyLines(true)
                    .withTrim(true)
                    .parse(in);

            for (CSVRecord rec : parser) {
                Integer acCode = Integer.parseInt(rec.get("ac"));
                Integer psNumber = Integer.valueOf(rec.get("ps_number"));
                String psSuffix = rec.get("ps_suffix");
                String lsCode = rec.get("ls");
                String candidateName = rec.get("candidate_name");
                Integer year = Integer.valueOf(rec.get("year"));
                Integer votes = Integer.valueOf(rec.get("votes"));

                Optional<PollingStation> optionalPollingStation = psRepo
                        .findByAc_AcCodeAndPsNumberAndPsSuffix(acCode, psNumber, psSuffix);

                optionalPollingStation.ifPresentOrElse(pollingStation -> {
                    Optional<Candidate> optionalCandidate = candidateRepo
                            .findByNameAndLs_LsCodeAndElectionYear(candidateName, lsCode, year);

                    optionalCandidate.ifPresent(candidate -> {
                        BoothVotes bv = BoothVotes.builder()
                                .pollingStation(pollingStation)
                                .candidate(candidate)
                                .votes(votes)
                                .year(year)
                                .build();

                        bvRepo.save(bv);
                    });
                }, () -> {
                    log.info("Skipping votes: Unknown PS {} - {}", acCode, psNumber);
                });
            }
        }
    }

    // ----------------------------------------
    // Import booth totals from Form 20 CSV
    // ----------------------------------------
    public void importForm20Totals(MultipartFile file) throws Exception {

        CSVParser parser = CSVFormat.DEFAULT
                .withFirstRecordAsHeader()
                .withIgnoreSurroundingSpaces()
                .withTrim()
                .parse(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));

        for (CSVRecord row : parser) {

            Integer acCode = Integer.parseInt(row.get("ac"));
            String lsCode = row.get("ls");

            Integer psNumber = Integer.valueOf(row.get("ps_number"));
            String psSuffix = row.get("ps_suffix");

            Integer year = Integer.valueOf(row.get("year"));
            Integer totalValid = Integer.valueOf(row.get("total_valid"));
            Integer rejected = Integer.valueOf(row.get("rejected"));
            Integer nota = Integer.valueOf(row.get("nota"));

            Optional<PollingStation> optionalPollingStation = psRepo
                    .findByAc_AcCodeAndPsNumberAndPsSuffix(acCode, psNumber, psSuffix);

            optionalPollingStation.ifPresentOrElse(pollingStation -> {
                BoothTotals bt = BoothTotals.builder()
                        .pollingStation(pollingStation)
                        .totalValid(totalValid)
                        .rejected(rejected)
                        .nota(nota)
                        .year(year)
                        .build();

                boothTotalsRepo.save(bt);
            }, () -> {
                log.info("Skipping totals: Unknown PS {} - {}", acCode, psNumber);
            });
        }
    }

}
