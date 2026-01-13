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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
        for (var psListResults : resultInsertRequest.getResults()) {

            String acName = psListResults.getAcName();
            int acCode = psListResults.getAcCode();
            AssemblyConstituency constituency = assemblyRepository.findByAcCode(acCode)
                    .or(() -> assemblyRepository.findByNameIgnoreCase(acName))
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Assembly not found by code or name: " + acCode + " / " + acName));

            int electionYear = Integer.parseInt(psListResults.getElectionYear());
            String electionType = psListResults.getElectionType();
            int lsCode = psListResults.getLsCode();

            Set<Integer> existingPs =
                    pollingStationRepository.findExistingPsNumbers(acCode, electionYear);

            Set<Integer> existingTotals =
                    boothTotalsRepository.findExistingTotals(acCode, electionYear);

            Set<String> existingVotes =
                    boothVotesRepository.findExistingVoteKeys(acCode, electionYear);

            LoksabhaConstituency ls = loksabhaConstituencyRepository.findById((long) lsCode)
                    .orElseThrow(() -> new IllegalArgumentException("LS Constituency not found: " + lsCode));

            /*
             * 1. Load all candidates once
             */
            List<Candidate> existingCandidates =
                    candidateRepository.findByLs_IdAndElectionYearOrderByNameAsc((long) lsCode, electionYear);

            Map<String, Candidate> candidateMap = new HashMap<>();
            for (Candidate c: existingCandidates) {
                candidateMap.put(c.getName().toUpperCase(), c);
            }

            List<Candidate> newCandidates = new ArrayList<>();

            List<PollingStation> pollingStations = new ArrayList<>();
            List<BoothTotals> boothTotals = new ArrayList<>();
            List<BoothVotes>  boothVotes = new ArrayList<>();

            for (var psResult : psListResults.getResults()) {

                Localbody lb = localbodyRepository.findSingleByNameIgnoreCaseAndTypeIn(
                        psResult.getLbName(), List.of("grama_panchayath", "municipality", "corporation")
                );
                if (existingPs.contains(psResult.getSerialNo()))
                    continue;
                PollingStation pollingStation = PollingStation.builder()
                        .electionYear(electionYear)
                        .psNumber(psResult.getSerialNo())
                        .psNumberRaw(String.valueOf(psResult.getSerialNo()))
                        .name(psResult.getPsName())
                        .ac(constituency)
                        .localbody(lb)
                        .build();
                pollingStations.add(pollingStation);

                BoothTotals totals = BoothTotals.builder()
                        .pollingStation(pollingStation)
                        .totalValid(psResult.getTotalValidVotes())
                        .rejected(psResult.getRejectedVotes())
                        .nota(psResult.getNota().intValue())
                        .year(electionYear)
                        .build();
                if(!existingTotals.contains(psResult.getSerialNo())) {
                    boothTotals.add(totals);
                }

                for (var entry : psResult.getCandidateVotes().entrySet()) {

                    String name = entry.getKey().toUpperCase();
                    Integer votes = entry.getValue() == null ? 0 : entry.getValue();

                    Candidate candidate = candidateMap.get(name);

                    if (candidate == null) {
                        candidate = Candidate.builder()
                                .name(name)
                                .electionYear(electionYear)
                                .electionType(electionType)
                                .ls(ls)
                                .ac(null)
                                .build();

                        newCandidates.add(candidate);
                        candidateMap.put(name, candidate);
                    }
                    String votekey = psResult.getSerialNo() + "_" +candidate.getId();
                    if(!existingVotes.contains(votekey)) {
                        boothVotes.add(
                                BoothVotes.builder()
                                        .pollingStation(pollingStation)
                                        .candidate(candidate)
                                        .votes(votes)
                                        .year(electionYear)
                                        .build()
                        );
                    }
                }
                log.info("Booth Total saved in memory for booth {}", totals.getPollingStation().getPsNumber());
            }

            if (!newCandidates.isEmpty())
                candidateRepository.saveAll(newCandidates);

            pollingStationRepository.saveAll(pollingStations);
            boothTotalsRepository.saveAll(boothTotals);
            boothVotesRepository.saveAll(boothVotes);

            log.info("Successfully inserted {} booths, {} votes, for constituency: {}",
                    pollingStations.size(), boothVotes.size(), constituency.getName());
        };
        return "OK";
    }
}
