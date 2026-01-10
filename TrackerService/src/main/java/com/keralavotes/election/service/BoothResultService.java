package com.keralavotes.election.service;

import com.keralavotes.election.dto.PollingStationResultInsertRequest;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.BoothTotals;
import com.keralavotes.election.entity.BoothVotes;
import com.keralavotes.election.entity.Candidate;
import com.keralavotes.election.entity.Localbody;
import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.entity.PollingStation;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.BoothTotalsRepository;
import com.keralavotes.election.repository.BoothVotesRepository;
import com.keralavotes.election.repository.CandidateRepository;
import com.keralavotes.election.repository.LocalbodyRepository;
import com.keralavotes.election.repository.LoksabhaConstituencyRepository;
import com.keralavotes.election.repository.PollingStationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoothResultService {

    private final AssemblyConstituencyRepository assemblyRepository;
    private final PollingStationRepository pollingStationRepository;
    private final CandidateRepository candidateRepository;
    private final LoksabhaConstituencyRepository loksabhaConstituencyRepository;
    private final BoothVotesRepository boothVotesRepository;
    private final BoothTotalsRepository  boothTotalsRepository;
    private final LocalbodyRepository localbodyRepository;

    @Transactional
    public String insertPollingStationResult(PollingStationResultInsertRequest  resultInsertRequest) {
        resultInsertRequest.getResults()
                .forEach(psListResults->{
                    String acName = psListResults.getAcName();
                    AssemblyConstituency constituency = assemblyRepository.findByName(acName);
                    int electionYear = Integer.parseInt(psListResults.getElectionYear());
                    String electionType = psListResults.getElectionType();
                    int lsCode = psListResults.getLsCode();

                    psListResults.getResults()
                            .forEach(psResult -> {
                                Localbody lb = localbodyRepository.findSingleByNameIgnoreCaseAndTypeIn(
                                        psResult.getLbName(),
                                        List.of("grama_panchayath", "municipality", "corporation"));
                                PollingStation pollingStation =  PollingStation.builder()
                                        .electionYear(electionYear)
                                        .psNumber(psResult.getSerialNo())
                                        .psNumberRaw(String.valueOf(psResult.getSerialNo()))
                                        .name(psResult.getPsName())
                                        .ac(constituency)
                                        .localbody(lb)
                                        .build();
                                PollingStation savedPs = pollingStationRepository.save(pollingStation);
                                BoothTotals.BoothTotalsBuilder boothTotalsBuilder = BoothTotals.builder();
                                boothTotalsBuilder.pollingStation( savedPs );
                                boothTotalsBuilder.totalValid(psResult.getTotalValidVotes());
                                boothTotalsBuilder.rejected(psResult.getRejectedVotes());
                                boothTotalsBuilder.year(electionYear);
                                psResult.getCandidateVotes().forEach((key, value) -> {
                                    if (key.startsWith("NOTA"))
                                        boothTotalsBuilder.nota(value);
                                    else if (electionType.equalsIgnoreCase("LS")) {
                                        List<Candidate> candidates = candidateRepository
                                                .findByNameAndLs_LsCodeAndElectionYearOrderByNameAsc(
                                                        key,
                                                        (long) lsCode,
                                                        electionYear
                                                );
                                        Candidate savedCandidate;
                                        if (candidates.isEmpty()) {
                                            LoksabhaConstituency ls = loksabhaConstituencyRepository
                                                    .findById((long) lsCode)
                                                    .orElseThrow(() ->
                                                            new IllegalArgumentException(
                                                                    "LS Constituency not found: " + lsCode)
                                                    );
                                            Candidate candidate = Candidate.builder()
                                                    .name(key)
                                                    .electionYear(electionYear)
                                                    .electionType(electionType)
                                                    .ls(ls)
                                                    .ac(null)
                                                    .build();
                                            savedCandidate = candidateRepository.save(candidate);
                                        } else {
                                            savedCandidate = candidates.getFirst();
                                        }
                                        BoothVotes boothVotes = BoothVotes.builder()
                                                .pollingStation(savedPs)
                                                .candidate(savedCandidate)
                                                .votes(value)
                                                .year(electionYear)
                                                .build();
                                        boothVotesRepository.save(boothVotes);
                                    }
                                });
                                BoothTotals totals = boothTotalsBuilder.build();
                                boothTotalsRepository.save(totals);
                                log.info("Booth Total saved for booth {}", totals.getPollingStation().getPsNumber());
                            });
                    log.info("Successfully inserted pollingStationResult for constituency: {}", constituency.getName());
                });
        return "OK";
    }
}
