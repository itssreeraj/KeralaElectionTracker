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

import java.util.ArrayList;
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

                    List<PollingStation> pollingStationList = new ArrayList<>();
                    List<Candidate> candidateList;
                    List<BoothTotals> boothTotalsList = new ArrayList<>();
                    List<BoothVotes>  boothVotesList = new ArrayList<>();

                    if (electionType.equalsIgnoreCase("LS")) {
                        candidateList = candidateRepository
                                .findByLs_IdAndElectionYearOrderByNameAsc(
                                        (long) lsCode,
                                        electionYear
                                );
                    } else {
                        candidateList = new ArrayList<>();
                    }

                    LoksabhaConstituency ls = loksabhaConstituencyRepository
                            .findById((long) lsCode)
                            .orElseThrow(() ->
                                    new IllegalArgumentException(
                                            "LS Constituency not found: " + lsCode)
                            );

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
                                pollingStationList.add(pollingStation);

                                BoothTotals.BoothTotalsBuilder boothTotalsBuilder = BoothTotals.builder();
                                boothTotalsBuilder.pollingStation(pollingStation);
                                boothTotalsBuilder.totalValid(psResult.getTotalValidVotes());
                                boothTotalsBuilder.rejected(psResult.getRejectedVotes());
                                boothTotalsBuilder.year(electionYear);
                                psResult.getCandidateVotes().forEach((key, value) -> {
                                    if (key.startsWith("NOTA"))
                                        boothTotalsBuilder.nota(value);
                                    else if (electionType.equalsIgnoreCase("LS")) {
                                        List<String> candidates = candidateList.stream()
                                                .map(Candidate::getName)
                                                .filter(name -> name.equalsIgnoreCase(key)).toList();
                                        Candidate savedCandidate;
                                        if (candidates.isEmpty()) {
                                            Candidate candidate = Candidate.builder()
                                                    .name(key)
                                                    .electionYear(electionYear)
                                                    .electionType(electionType)
                                                    .ls(ls)
                                                    .ac(null)
                                                    .build();
                                            savedCandidate = candidateRepository.save(candidate);
                                        } else {
                                            savedCandidate = candidateList.stream()
                                                    .filter(cand -> cand.getName().equalsIgnoreCase(key))
                                                    .findFirst()
                                                    .orElse(null);
                                        }
                                        BoothVotes boothVotes = BoothVotes.builder()
                                                .pollingStation(pollingStation)
                                                .candidate(savedCandidate)
                                                .votes(value)
                                                .year(electionYear)
                                                .build();
                                        boothVotesList.add(boothVotes);
                                    }
                                });
                                BoothTotals totals = boothTotalsBuilder.build();
                                boothTotalsList.add(totals);
                                log.info("Booth Total saved in memory for booth {}", totals.getPollingStation().getPsNumber());
                            });
                    pollingStationRepository.saveAll(pollingStationList);
                    boothVotesRepository.saveAll(boothVotesList);
                    boothTotalsRepository.saveAll(boothTotalsList);
                    log.info("Successfully inserted pollingStationResult for constituency: {}", constituency.getName());
                });
        return "OK";
    }
}
