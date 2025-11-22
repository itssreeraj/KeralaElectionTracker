package com.keralavotes.election.service;

import com.keralavotes.election.entity.*;
import com.keralavotes.election.repository.*;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.BoothVotes;
import com.keralavotes.election.entity.Candidate;
import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.entity.PollingStation;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.BoothVotesRepository;
import com.keralavotes.election.repository.CandidateRepository;
import com.keralavotes.election.repository.LoksabhaConstituencyRepository;
import com.keralavotes.election.repository.PollingStationRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CsvImportService {

    private final PollingStationRepository psRepo;
    private final LoksabhaConstituencyRepository lsRepo;
    private final AssemblyConstituencyRepository acRepo;
    private final CandidateRepository candidateRepo;
    private final BoothVotesRepository bvRepo;
    private final BoothTotalsRepository boothTotalsRepo;

    // ----------------------------------------
    // Import booth list parsed from PDF
    // ----------------------------------------
    public void importBoothsCsv(MultipartFile file, String lsCode) throws Exception {
        LoksabhaConstituency ls = lsRepo.findByLsCode(lsCode)
                .orElseThrow(() -> new IllegalArgumentException("LS not found: " + lsCode));

        try (var in = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            CSVFormat format = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withIgnoreEmptyLines(true)
                    .withTrim(true);
            CSVParser parser = new CSVParser(in, format);

            for (CSVRecord rec : parser) {
                String acCode = rec.get("ac");
                String psNumberRaw = rec.get("ps_number_raw");
                Integer psNumber = Integer.valueOf(rec.get("ps_number"));
                String psSuffix = rec.get("ps_suffix");
                String name = rec.get("polling_station_name");

                AssemblyConstituency ac = acRepo.findByAcCode(acCode)
                        .orElseThrow(() -> new IllegalArgumentException("AC not found: " + acCode));

                PollingStation ps = PollingStation.builder()
                        .ls(ls)
                        .ac(ac)
                        .psNumber(psNumber)
                        .psSuffix(psSuffix == null || psSuffix.isBlank() ? null : psSuffix)
                        .psNumberRaw(psNumberRaw)
                        .name(name)
                        .build();

                psRepo.save(ps);
            }
        }
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
                String acCode = rec.get("ac");
                Integer psNumber = Integer.valueOf(rec.get("ps_number"));
                String psSuffix = rec.get("ps_suffix");
                String lsCode = rec.get("ls");
                String candidateName = rec.get("candidate_name");
                Integer year = Integer.valueOf(rec.get("year"));
                Integer votes = Integer.valueOf(rec.get("votes"));

                PollingStation ps = psRepo
                        .findByAc_AcCodeAndPsNumberAndPsSuffix(acCode, psNumber,
                                (psSuffix == null || psSuffix.isBlank()) ? null : psSuffix);

                if (ps == null) {
                    // log & skip
                    continue;
                }

                Optional<Candidate> optionalCandidate = candidateRepo
                        .findByNameAndLs_LsCodeAndElectionYear(candidateName, lsCode, year);

                optionalCandidate.ifPresent(candidate -> {
                    BoothVotes bv = BoothVotes.builder()
                            .pollingStation(ps)
                            .candidate(candidate)
                            .votes(votes)
                            .year(year)
                            .build();

                    bvRepo.save(bv);
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

            String acCode = row.get("ac");
            String lsCode = row.get("ls");

            Integer psNumber = Integer.valueOf(row.get("ps_number"));
            String psSuffix = row.get("ps_suffix");

            Integer year = Integer.valueOf(row.get("year"));
            Integer totalValid = Integer.valueOf(row.get("total_valid"));
            Integer rejected = Integer.valueOf(row.get("rejected"));
            Integer nota = Integer.valueOf(row.get("nota"));

            PollingStation ps = psRepo
                    .findByAc_AcCodeAndPsNumberAndPsSuffix(acCode, psNumber,
                            psSuffix.isBlank() ? null : psSuffix);

            if (ps == null) {
                System.out.println("Skipping totals: Unknown PS " + acCode + "-" + psNumber);
                continue;
            }

            BoothTotals bt = BoothTotals.builder()
                    .pollingStation(ps)
                    .totalValid(totalValid)
                    .rejected(rejected)
                    .nota(nota)
                    .year(year)
                    .build();

            boothTotalsRepo.save(bt);
        }
    }

}
