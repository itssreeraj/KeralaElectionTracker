package com.keralavotes.election.service;

import com.keralavotes.election.constants.ElectionYear;
import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.model.PollingStationResultInsertRequest;
import com.keralavotes.election.dto.details.BoothVoteDetailsRowDto;
import com.keralavotes.election.dto.details.CandidateVoteDataDto;
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
import java.util.stream.Collectors;

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

            Set<Integer> existingPs = pollingStationRepository.findExistingPsNumbers(acCode, electionYear);

            Map<Integer, BoothTotals> boothTotalsMap = new HashMap<>();
            boothTotalsRepository.findByYearAndPollingStation_Ac_AcCode(electionYear, acCode)
                    .forEach(bt -> boothTotalsMap.put(bt.getPollingStation().getPsNumber(), bt));

            Map<String, BoothVotes> boothVotesMap = new HashMap<>();
            boothVotesRepository.findByYearAndPollingStation_Ac_AcCode(electionYear, acCode)
                    .forEach(bv -> {
                        String key = bv.getPollingStation().getPsNumber() + "_" + bv.getCandidate().getId();
                        boothVotesMap.put(key, bv);
                    });

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
                PollingStation pollingStation;
                if (existingPs.contains(psResult.getSerialNo())) {
                    pollingStation = pollingStationRepository
                            .findByAc_AcCodeAndElectionYearAndPsNumber(acCode, electionYear, psResult.getSerialNo())
                            .orElseThrow(() -> new IllegalStateException(
                                    "PS exists in set but not in DB: " + psResult.getSerialNo()));
                } else {
                    Localbody lb = localbodyRepository.findSingleByNameIgnoreCaseAndTypeIn(
                            psResult.getLbName(), List.of("grama_panchayath", "municipality", "corporation")
                    );
                    pollingStation = PollingStation.builder()
                            .electionYear(electionYear)
                            .psNumber(psResult.getSerialNo())
                            .psNumberRaw(String.valueOf(psResult.getSerialNo()))
                            .name(psResult.getPsName())
                            .ac(constituency)
                            .localbody(lb)
                            .build();
                    pollingStations.add(pollingStation);
                }
                BoothTotals totals = boothTotalsMap.get(psResult.getSerialNo());

                if (totals == null) {
                    totals = BoothTotals.builder()
                            .pollingStation(pollingStation)
                            .year(electionYear)
                            .build();
                    boothTotals.add(totals);
                }
                totals.setTotalValid(psResult.getTotalValidVotes());
                totals.setRejected(psResult.getRejectedVotes());
                totals.setNota(psResult.getNota().intValue());

                for (var entry : psResult.getCandidateVotes().entrySet()) {

                    String name = entry.getKey().toUpperCase();
                    Integer votes = entry.getValue() == null ? 0 : entry.getValue();

                    Candidate candidate = candidateMap.get(name);

                    if (candidate == null) {
                        candidate = Candidate.builder()
                                .name(name)
                                .electionYear(electionYear)
                                .electionType(ElectionType.valueOf(electionType))
                                .ls(ls)
                                .ac(constituency)
                                .build();

                        newCandidates.add(candidate);
                        candidateMap.put(name, candidate);
                    }
                    String votekey = psResult.getSerialNo() + "_" +candidate.getId();
                    BoothVotes bv = boothVotesMap.get(votekey);

                    if(bv == null) {
                        bv = BoothVotes.builder()
                                .pollingStation(pollingStation)
                                .candidate(candidate)
                                .year(electionYear)
                                .build();
                        boothVotes.add(bv);
                    }
                    bv.setVotes(votes);
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

    /**
     * Get the candidate vote data for booths in an AC
     * @param acCode The assembly code
     * @param year The election year
     * @return The List of Booth Vote details
     */
    public List<BoothVoteDetailsRowDto> getBoothResultsData(Integer acCode, Integer year) {
        AssemblyConstituency ac = assemblyRepository.findByAcCode(acCode)
                .orElseThrow(() -> new RuntimeException("Invalid AC code: " + acCode));
        log.info("BoothResultService::getBoothResultsData -> Get booth data for Assembly constituency: {}, " +
                        "for Year: {}", ac.getName(), year);

        if (ElectionYear.fromYear(year).isGeneral()) {
            List<BoothVoteDetailsRowDto> booths = pollingStationRepository.findBoothTotals(acCode, year);
            List<CandidateVoteDataDto> votes = boothVotesRepository.findBoothVotes(acCode, year);

            Map<Long, List<CandidateVoteDataDto>> voteMap =
                    votes.stream().collect(Collectors.groupingBy(CandidateVoteDataDto::getPsId));

                booths.forEach(b -> {
                b.setCandidates(voteMap.getOrDefault(b.getPsId(), List.of()));
            });

            return booths;
        } else {
            throw new RuntimeException("No valid years provided");
        }
    }

    @Transactional
    public void saveBoothVote(Long psId, Long candidateId, Integer year, Integer votes) {
        PollingStation pollingStation = pollingStationRepository.findById(psId)
                .orElseThrow(() -> new RuntimeException("Invalid PS ID: " + psId));
        Candidate candidate = candidateRepository.findById(candidateId)
                        .orElseThrow(() -> new RuntimeException("Invalid Candidate ID: " + candidateId));
        boothVotesRepository.findByPollingStation_IdAndCandidate_IdAndYear(psId, candidateId, year)
                .ifPresentOrElse(
                        bv -> bv.setVotes(votes),
                        () -> boothVotesRepository.save(
                                BoothVotes.builder()
                                        .pollingStation(pollingStation)
                                        .candidate(candidate)
                                        .year(year)
                                        .votes(votes)
                                        .build()
                        )
                );
    }

    @Transactional
    public void saveBoothTotals(Long psId, Integer year, Integer totalValid, Integer rejected, Integer nota) {
        PollingStation pollingStation = pollingStationRepository.findById(psId)
                .orElseThrow(() -> new RuntimeException("Invalid PS ID: " + psId));
        boothTotalsRepository.findByYearAndPollingStation_Id(year, psId)
                .ifPresentOrElse(
                        bt -> {
                            bt.setTotalValid(totalValid);
                            bt.setRejected(rejected);
                            bt.setNota(nota);
                        },
                        () -> boothTotalsRepository.save(
                                BoothTotals.builder()
                                        .pollingStation(pollingStation)
                                        .year(year)
                                        .totalValid(totalValid)
                                        .rejected(rejected)
                                        .nota(nota)
                                        .build()
                        )
                );
    }
}
