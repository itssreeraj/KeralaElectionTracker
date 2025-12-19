package com.keralavotes.election.service;

import com.keralavotes.election.dto.AssemblyAnalysisResponseDto;
import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.model.VoteRow;
import com.keralavotes.election.model.WardAccumulator;
import com.keralavotes.election.repository.PartyAllianceMappingRepository;
import com.keralavotes.election.repository.LbWardResultRepository;
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

            result.add(
                    AssemblyAnalysisResponseDto.LocalbodySummary.builder()
                            .localbodyId(lbId)
                            .localbodyName(first.getLocalbodyName())
                            .wardsCount(rows.size())
                            .voteShare(voteShare)
                            .wardPerformance(List.of())
                            .build()
            );
        }

        return result;
    }

}
