package com.keralavotes.election.service;

import com.keralavotes.election.constants.ElectionYear;
import com.keralavotes.election.dto.AssemblyAnalysisResponseDto;
import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.dto.SingleElectionAnalysisDto;
import com.keralavotes.election.dto.VoteShareRowDto;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.BoothTotals;
import com.keralavotes.election.entity.PollingStation;
import com.keralavotes.election.model.AssemblyHistoricResultsResponseDto;
import com.keralavotes.election.model.VoteRow;
import com.keralavotes.election.model.WardAccumulator;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.BoothTotalsRepository;
import com.keralavotes.election.repository.BoothVotesRepository;
import com.keralavotes.election.repository.LocalbodyRepository;
import com.keralavotes.election.repository.PartyAllianceMappingRepository;
import com.keralavotes.election.repository.LbWardResultRepository;
import com.keralavotes.election.repository.PollingStationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssemblyAnalysisService {

    private final LbWardResultRepository wardResultRepository;
    private final PartyAllianceMappingRepository partyAllianceMappingRepository;
    private final LocalbodyRepository localbodyRepository;
    private final AssemblyConstituencyRepository assemblyConstituencyRepository;
    private final BoothVotesRepository boothVotesRepository;
    private final PollingStationRepository pollingStationRepository;
    private final BoothTotalsRepository boothTotalsRepository;

    /* ============================================================
       PUBLIC ENTRY POINTS
    ============================================================ */

    @Transactional
    public AssemblyAnalysisResponseDto analyzeByAcCode(Integer acCode, int year, List<String> includeTypes) {
        log.info("analyzeByAcCode called with acCode={}, year={}, includeTypes={}", acCode, year, includeTypes);
        return analyze(year, acCode, null, includeTypes, ElectionType.LOCALBODY, "Assembly " + acCode);
    }

    @Transactional
    public AssemblyAnalysisResponseDto analyzeByDistrict(
            Integer districtCode,
            int year,
            List<String> includeTypes
    ) {
        return analyze(
                year,
                null,
                districtCode,
                includeTypes,
                ElectionType.LOCALBODY,
                "District " + districtCode
        );
    }

    @Transactional
    public AssemblyAnalysisResponseDto analyzeState(
            int year,
            List<String> includeTypes
    ) {
        return analyze(
                year,
                null,
                null,
                includeTypes,
                ElectionType.LOCALBODY,
                "Kerala State"
        );
    }

    /* ============================================================
       CORE ANALYSIS (SINGLE SOURCE OF TRUTH)
    ============================================================ */

    @Transactional
    protected AssemblyAnalysisResponseDto analyze(int year,
                                                  Integer acCode,
                                                  Integer districtCode,
                                                  List<String> includeTypes,
                                                  ElectionType electionType,
                                                  String scopeName) {
        log.info("analyze called with year={}, acCode={}, districtCode={}, includeTypes={}, electionType={}, scopeName={}",
                year, acCode, districtCode, includeTypes, electionType, scopeName);
        /* ------------------------------
           Load party → alliance mapping
        ------------------------------ */
        Map<Long, String> partyAlliance =
                partyAllianceMappingRepository
                        .findForYearAndType(year, electionType)
                        .stream()
                        .collect(Collectors.toMap(
                                m -> m.getParty().getId(),
                                m -> m.getAlliance().getName()
                        ));
        log.info("Loaded party-alliance mapping for year={} type={}: {} entries",
                year, electionType, partyAlliance.size());

        if (partyAlliance.isEmpty()) {
            log.warn(
                    "No party-alliance mapping found for year={} type={}",
                    year, electionType
            );
        }

        /* ------------------------------
           Accumulators
        ------------------------------ */
        Map<Long, WardAccumulator> wardMap = new LinkedHashMap<>();
        Map<String, Long> overallVotes = new HashMap<>();

        /* ------------------------------
           Stream votes (NO IN clause)
        ------------------------------ */
        try (Stream<VoteRow> stream =
                     wardResultRepository.streamVotes(
                             year,
                             acCode,
                             districtCode,
                             normalizeTypes(includeTypes)
                     )) {

            stream.forEach(r -> {

                String alliance =
                        r.getPartyId() == null
                                ? "OTH"
                                : partyAlliance.getOrDefault(
                                r.getPartyId(),
                                "OTH"
                        );

                WardAccumulator acc =
                        wardMap.computeIfAbsent(
                                r.getWardId(),
                                id -> new WardAccumulator(r)
                        );

                acc.add(alliance, r.getVotes());
                overallVotes.merge(alliance, (long) r.getVotes(), Long::sum);
            });
        }

        return buildDto(scopeName, year, wardMap, overallVotes);
    }

    /* ============================================================
       DTO BUILDING
    ============================================================ */

    private AssemblyAnalysisResponseDto buildDto(
            String name,
            int year,
            Map<Long, WardAccumulator> wardMap,
            Map<String, Long> overallVotes
    ) {

    /* ------------------------------
       Ward rows (SOURCE OF TRUTH)
    ------------------------------ */
        List<AssemblyAnalysisResponseDto.WardRow> wardRows =
                wardMap.values().stream()
                        .map(this::toWardRow)
                        .sorted(Comparator.comparingInt(
                                AssemblyAnalysisResponseDto.WardRow::getWardNum
                        ))
                        .toList();

    /* ------------------------------
       Overall vote share
    ------------------------------ */
        long totalVotes =
                overallVotes.values().stream().mapToLong(Long::longValue).sum();

        List<AssemblyAnalysisResponseDto.AllianceVoteShare> overall =
                overallVotes.entrySet().stream()
                        .map(e -> AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                                .alliance(e.getKey())
                                .votes(e.getValue())
                                .percentage(
                                        totalVotes == 0 ? 0.0 :
                                                (e.getValue() * 100.0 / totalVotes)
                                )
                                .build())
                        .sorted(Comparator.comparingLong(
                                AssemblyAnalysisResponseDto.AllianceVoteShare::getVotes
                        ).reversed())
                        .toList();

    /* ------------------------------
       Localbody summaries (DERIVED)
    ------------------------------ */
        List<AssemblyAnalysisResponseDto.LocalbodySummary> localbodies =
                buildLocalbodies(wardRows);

    /* ------------------------------
       FINAL RESPONSE (ALL LEVELS)
    ------------------------------ */
        return AssemblyAnalysisResponseDto.builder()
                .acName(name)
                .year(year)
                .totalWards(wardRows.size())
                .overallVoteShare(overall)
                .localbodies(localbodies)
                .wards(wardRows)        // ✅ RESTORED
                .build();
    }


    /* ============================================================
       WARD CONVERSION
    ============================================================ */

    private AssemblyAnalysisResponseDto.WardRow toWardRow(
            WardAccumulator w
    ) {

        int totalVotes = w.getTotalVotes();

        if (totalVotes == 0) {
            totalVotes = 1; // avoid divide-by-zero
        }

        int finalTotalVotes = totalVotes;
        List<AssemblyAnalysisResponseDto.AllianceVoteShare> alliances =
                w.getAllianceVotes().entrySet().stream()
                        .map(e -> AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                                .alliance(e.getKey())
                                .votes(e.getValue())
                                .percentage((e.getValue() * 100.0) / finalTotalVotes)
                                .build())
                        .sorted(Comparator.comparingLong(
                                AssemblyAnalysisResponseDto.AllianceVoteShare::getVotes
                        ).reversed())
                        .toList();

        String winner =
                alliances.isEmpty()
                        ? null
                        : alliances.getFirst().getAlliance();

        Integer margin = null;
        if (alliances.size() > 1) {
            margin =
                    (int) (
                            alliances.get(0).getVotes() -
                                    alliances.get(1).getVotes()
                    );
        }

        return AssemblyAnalysisResponseDto.WardRow.builder()
                .wardId(w.getWardId())
                .wardNum(w.getWardNum())
                .wardName(w.getWardName())
                .localbodyId(w.getLocalbodyId())
                .localbodyName(w.getLocalbodyName())
                .alliances(alliances)
                .total(w.getTotalVotes())
                .winner(winner)
                .margin(margin)
                .build();
    }

    /* ============================================================
       HELPERS
    ============================================================ */

    private AssemblyAnalysisResponseDto emptyResponse(
            String name,
            int year
    ) {
        return AssemblyAnalysisResponseDto.builder()
                .acName(name)
                .year(year)
                .totalWards(0)
                .overallVoteShare(List.of())
                .localbodies(List.of())
                .wards(List.of())
                .build();
    }

    private String[] normalizeTypes(List<String> types) {
        if (types == null || types.isEmpty()) {
            return null;
        }
        return types.stream()
                .map(String::toLowerCase)
                .toArray(String[]::new);
    }

    private List<AssemblyAnalysisResponseDto.LocalbodySummary> buildLocalbodies(
            List<AssemblyAnalysisResponseDto.WardRow> wards
    ) {

        Map<Long, List<AssemblyAnalysisResponseDto.WardRow>> byLocalbody =
                wards.stream()
                        .filter(w -> w.getLocalbodyId() != null)
                        .collect(Collectors.groupingBy(
                                AssemblyAnalysisResponseDto.WardRow::getLocalbodyId
                        ));

        List<AssemblyAnalysisResponseDto.LocalbodySummary> result = new ArrayList<>();

        for (var entry : byLocalbody.entrySet()) {

            Long lbId = entry.getKey();
            List<AssemblyAnalysisResponseDto.WardRow> rows = entry.getValue();

            Map<String, Long> votes = new HashMap<>();

            rows.forEach(w ->
                    w.getAlliances().forEach(a ->
                            votes.merge(a.getAlliance(), (long) a.getVotes(), Long::sum)
                    )
            );

            long totalVotes =
                    votes.values().stream().mapToLong(Long::longValue).sum();

            List<AssemblyAnalysisResponseDto.AllianceVoteShare> voteShare =
                    votes.entrySet().stream()
                            .map(e -> AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                                    .alliance(e.getKey())
                                    .votes(e.getValue())
                                    .percentage(
                                            totalVotes == 0 ? 0.0 :
                                                    (e.getValue() * 100.0 / totalVotes)
                                    )
                                    .build())
                            .sorted(Comparator.comparingLong(
                                    AssemblyAnalysisResponseDto.AllianceVoteShare::getVotes
                            ).reversed())
                            .toList();

            AssemblyAnalysisResponseDto.WardRow first = rows.getFirst();

            localbodyRepository.findById(lbId).ifPresent(lb -> {
                result.add(
                        AssemblyAnalysisResponseDto.LocalbodySummary.builder()
                                .localbodyId(lbId)
                                .localbodyName(lb.getName())
                                .localbodyType(lb.getType())
                                .wardsCount(rows.size())
                                .voteShare(voteShare)
                                .wardPerformance(List.of())
                                .build()
                );
            });
        }
        return result;
    }

    @Transactional()
    public AssemblyHistoricResultsResponseDto doHistoricAnalysis(int acCode, String years, List<String> includeTypes) {
        AssemblyConstituency assemblyConstituency = assemblyConstituencyRepository.findByAcCode(acCode)
                .orElseThrow(() -> new RuntimeException("Invalid AC code: " + acCode));

        List<Integer> yearList = Arrays.stream(years.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .toList();

        if (yearList.isEmpty()) {
            throw new RuntimeException("No valid years provided");
        }

        AssemblyHistoricResultsResponseDto responseDto = new AssemblyHistoricResultsResponseDto();
        responseDto.setAssembly(assemblyConstituency);

        List<SingleElectionAnalysisDto> historicResults = new ArrayList<>();
        for (int year : yearList) {
            SingleElectionAnalysisDto singleElectionAnalysisDto = new SingleElectionAnalysisDto();
            singleElectionAnalysisDto.setYear(year);
            singleElectionAnalysisDto.setType(ElectionYear.typeOf(year));
            singleElectionAnalysisDto.setLabel(ElectionYear.labelOf(year));

            if (ElectionYear.fromYear(year).isGeneral()) {
                List<Object[]> assemblyVoteshare;
                // Find the poling stations for this localbody
                Set<Long> pollingStationIds = pollingStationRepository
                        .findByAc_AcCodeAndElectionYearOrderByPsNumberAsc(acCode, year)
                        .stream()
                        .map(PollingStation::getId)
                        .collect(Collectors.toSet());

                // Find total valid votes across all booths in this localbody/year
                long totalVotes = boothTotalsRepository.findByYearAndPollingStation_IdIn(year, pollingStationIds)
                        .stream()
                        .mapToLong(BoothTotals::getTotalValid)
                        .sum();

                assemblyVoteshare = boothVotesRepository.getAssemblyVoteShare(acCode, year);
                List<VoteShareRowDto> boothVoteShare = assemblyVoteshare.stream()
                        .map(a -> {
                            String alliance = a[0].toString();
                            long votes = ((Number) a[1]).longValue();
                            double pct = totalVotes == 0 ? 0 : (votes * 100.0 / totalVotes);
                            return new VoteShareRowDto(alliance, votes, pct);
                        })
                        .sorted(Comparator.comparingLong(VoteShareRowDto::getVotes).reversed())
                        .toList();

                VoteShareRowDto winner = !boothVoteShare.isEmpty() ? boothVoteShare.getFirst() : null;
                VoteShareRowDto runnerUp = boothVoteShare.size() > 1 ? boothVoteShare.get(1) : null;

                String winnerAlliance = winner != null ? winner.getAlliance() : "OTH";
                String runnerUpAlliance = runnerUp != null ? runnerUp.getAlliance() : null;
                long margin = (winner != null && runnerUp != null) ? winner.getVotes() - runnerUp.getVotes() : 0;

                singleElectionAnalysisDto.setVoteShare(boothVoteShare);

                singleElectionAnalysisDto.setWinner(winnerAlliance);
                singleElectionAnalysisDto.setRunnerUp(runnerUpAlliance);
                singleElectionAnalysisDto.setMargin(margin);

                historicResults.add(singleElectionAnalysisDto);
            } else {
                AssemblyAnalysisResponseDto assemblyAnalysisResponseDto =
                        analyze(year, acCode, null, includeTypes, ElectionType.LOCALBODY, "Assembly " + acCode);
                List<VoteShareRowDto> voteShareRowDtoList = assemblyAnalysisResponseDto.getOverallVoteShare().stream()
                        .map(voteshare -> {
                                    String alliance = voteshare.getAlliance();
                                    long votes = voteshare.getVotes();
                                    double percentage = voteshare.getPercentage();
                                    return new VoteShareRowDto(alliance, votes, percentage);
                                }
                        )
                        .sorted(Comparator.comparingLong(VoteShareRowDto::getVotes).reversed())
                        .toList();

                VoteShareRowDto winner = !voteShareRowDtoList.isEmpty() ? voteShareRowDtoList.getFirst() : null;
                VoteShareRowDto runnerUp = voteShareRowDtoList.size() > 1 ? voteShareRowDtoList.get(1) : null;

                String winnerAlliance = winner != null ? winner.getAlliance() : "OTH";
                String runnerUpAlliance = runnerUp != null ? runnerUp.getAlliance() : null;
                long margin = (winner != null && runnerUp != null) ? winner.getVotes() - runnerUp.getVotes() : 0;

                singleElectionAnalysisDto.setVoteShare(voteShareRowDtoList);

                singleElectionAnalysisDto.setWinner(winnerAlliance);
                singleElectionAnalysisDto.setRunnerUp(runnerUpAlliance);
                singleElectionAnalysisDto.setMargin(margin);

                historicResults.add(singleElectionAnalysisDto);
            }
        }
        responseDto.setHistoricResults(historicResults);

        return responseDto;
    }
}
