package com.keralavotes.election.service;

import com.keralavotes.election.dto.AssemblyAnalysisResponseDto;
import com.keralavotes.election.entity.*;
import com.keralavotes.election.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssemblyAnalysisService {

    private final WardRepository wardRepository;
    private final LbWardResultRepository wardResultRepository;
    private final LbCandidateRepository candidateRepository;
    private final PartyRepository partyRepository;
    private final LocalbodyRepository localbodyRepository;

    /* ============================================================
       ASSEMBLY ANALYSIS
    ============================================================ */
    @Transactional
    public AssemblyAnalysisResponseDto analyzeByAcCode(
            Integer acCode,
            int year,
            List<String> includeTypes
    ) {

        List<Ward> wards = (includeTypes == null || includeTypes.isEmpty())
                ? wardRepository.findByAc_AcCodeAndDelimitationYear(acCode, year)
                : wardRepository.findByAc_AcCodeAndDelimitationYearAndLocalbody_TypeInIgnoreCase(
                acCode, year, includeTypes
        );

        List<LbWardResult> results =
                wardResultRepository.findResultsByScope(
                        year,
                        year,
                        acCode,
                        null,
                        normalizeTypes(includeTypes)
                );

        String name = wards.isEmpty() || wards.getFirst().getAc() == null
                ? "Assembly " + acCode
                : wards.getFirst().getAc().getName();

        return buildAggregateResponse(wards, results, year, name);
    }

    /* ============================================================
       DISTRICT ANALYSIS
    ============================================================ */
    @Transactional
    public AssemblyAnalysisResponseDto analyzeByDistrict(
            Integer districtCode,
            int year,
            List<String> includeTypes
    ) {

        List<Ward> wards = (includeTypes == null || includeTypes.isEmpty())
                ? wardRepository.findByDelimitationYearAndLocalbody_District_DistrictCode(year, districtCode)
                : wardRepository.findByDelimitationYearAndLocalbody_District_DistrictCodeAndLocalbody_TypeInIgnoreCase(
                year, districtCode, includeTypes
        );

        List<LbWardResult> results =
                wardResultRepository.findResultsByScope(
                        year,
                        year,
                        null,
                        districtCode,
                        normalizeTypes(includeTypes)
                );

        return buildAggregateResponse(
                wards,
                results,
                year,
                "District " + districtCode
        );
    }

    /* ============================================================
       STATE ANALYSIS
    ============================================================ */
    @Transactional
    public AssemblyAnalysisResponseDto analyzeState(
            int year,
            List<String> includeTypes
    ) {

        List<Ward> wards = (includeTypes == null || includeTypes.isEmpty())
                ? wardRepository.findByDelimitationYear(year)
                : wardRepository.findByDelimitationYearAndLocalbody_TypeInIgnoreCase(
                year, includeTypes
        );

        List<LbWardResult> results =
                wardResultRepository.findResultsByScope(
                        year,
                        year,
                        null,
                        null,
                        normalizeTypes(includeTypes)
                );

        return buildAggregateResponse(
                wards,
                results,
                year,
                "Kerala State"
        );
    }

    /* ============================================================
       CORE AGGREGATION ENGINE (SINGLE SOURCE OF TRUTH)
    ============================================================ */
    protected AssemblyAnalysisResponseDto buildAggregateResponse(
            List<Ward> wards,
            List<LbWardResult> results,
            int year,
            String displayName
    ) {

        if (wards == null || wards.isEmpty()) {
            return AssemblyAnalysisResponseDto.builder()
                    .acName(displayName)
                    .year(year)
                    .totalWards(0)
                    .overallVoteShare(List.of())
                    .localbodies(List.of())
                    .wards(List.of())
                    .build();
        }

        /* ------------------------------
           Candidate → Alliance map
        ------------------------------ */
        Map<Integer, String> candidateAlliance = new HashMap<>();

        for (LbCandidate c : candidateRepository.findByElectionYear(year)) {
            String alliance = "OTH";
            if (c.getPartyId() != null) {
                Party p = partyRepository.findById(c.getPartyId()).orElse(null);
                if (p != null && p.getAlliance() != null) {
                    alliance = p.getAlliance().getName();
                }
            }
            candidateAlliance.put(c.getId(), alliance);
        }

        /* ------------------------------
           Group results by ward
        ------------------------------ */
        Map<Long, List<LbWardResult>> resultsByWard =
                results.stream()
                        .collect(Collectors.groupingBy(r -> r.getWardId().longValue()));

        Map<String, Long> overallVotes = new HashMap<>();
        List<AssemblyAnalysisResponseDto.WardRow> wardRows = new ArrayList<>();

        /* ------------------------------
           Per-ward aggregation
        ------------------------------ */
        for (Ward w : wards) {

            List<LbWardResult> wardVotes =
                    resultsByWard.getOrDefault(w.getId(), List.of());

            Map<String, Long> allianceVotes = new HashMap<>();
            int totalVotes = 0;

            for (LbWardResult r : wardVotes) {
                int v = r.getVotes();
                totalVotes += v;

                String alliance =
                        candidateAlliance.getOrDefault(r.getCandidateId(), "OTH");

                allianceVotes.merge(alliance, (long) v, Long::sum);
                overallVotes.merge(alliance, (long) v, Long::sum);
            }

            List<Map.Entry<String, Long>> sorted =
                    allianceVotes.entrySet().stream()
                            .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                            .toList();

            String winner = sorted.isEmpty() ? null : sorted.get(0).getKey();
            Integer margin = sorted.size() > 1
                    ? (int) (sorted.get(0).getValue() - sorted.get(1).getValue())
                    : null;

            int finalTotalVotes = totalVotes;

            List<AssemblyAnalysisResponseDto.AllianceVoteShare> allianceShares =
                    allianceVotes.entrySet().stream()
                            .map(e -> AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                                    .alliance(e.getKey())
                                    .votes(e.getValue())
                                    .percentage(finalTotalVotes == 0
                                            ? 0.0
                                            : (e.getValue() * 100.0 / finalTotalVotes))
                                    .build())
                            .sorted((a, b) -> Long.compare(b.getVotes(), a.getVotes()))
                            .toList();

            wardRows.add(
                    AssemblyAnalysisResponseDto.WardRow.builder()
                            .wardId(w.getId())
                            .wardNum(w.getWardNum())
                            .wardName(w.getWardName())
                            .localbodyId(w.getLocalbody().getId())
                            .localbodyName(w.getLocalbody().getName())
                            .alliances(allianceShares)
                            .total(totalVotes)
                            .winner(winner)
                            .margin(margin)
                            .build()
            );
        }

        /* ------------------------------
           Overall vote share
        ------------------------------ */
        long totalVotes =
                overallVotes.values().stream().mapToLong(Long::longValue).sum();

        List<AssemblyAnalysisResponseDto.AllianceVoteShare> overallVoteShare =
                overallVotes.entrySet().stream()
                        .map(e -> AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                                .alliance(e.getKey())
                                .votes(e.getValue())
                                .percentage(totalVotes == 0
                                        ? 0.0
                                        : (e.getValue() * 100.0 / totalVotes))
                                .build())
                        .sorted((a, b) -> Long.compare(b.getVotes(), a.getVotes()))
                        .toList();

        /* ------------------------------
           Localbody aggregation (FIX)
        ------------------------------ */
        Map<Long, List<AssemblyAnalysisResponseDto.WardRow>> byLocalbody =
                wardRows.stream()
                        .filter(w -> w.getLocalbodyId() != null)
                        .collect(Collectors.groupingBy(
                                AssemblyAnalysisResponseDto.WardRow::getLocalbodyId
                        ));

        List<AssemblyAnalysisResponseDto.LocalbodySummary> localbodies =
                new ArrayList<>();

        for (var entry : byLocalbody.entrySet()) {

            Long lbId = entry.getKey();
            List<AssemblyAnalysisResponseDto.WardRow> rows = entry.getValue();
            Localbody lb = localbodyRepository.findById(lbId).orElse(null);

            Map<String, Long> lbVotes = new HashMap<>();

            rows.forEach(r ->
                    r.getAlliances().forEach(a ->
                            lbVotes.merge(
                                    a.getAlliance(),
                                    (long) a.getVotes(),
                                    Long::sum
                            )
                    )
            );

            long lbTotalVotes =
                    lbVotes.values().stream().mapToLong(Long::longValue).sum();

            List<AssemblyAnalysisResponseDto.AllianceVoteShare> lbVoteShare =
                    lbVotes.entrySet().stream()
                            .map(e -> AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                                    .alliance(e.getKey())
                                    .votes(e.getValue())
                                    .percentage(lbTotalVotes == 0
                                            ? 0.0
                                            : (e.getValue() * 100.0 / lbTotalVotes))
                                    .build())
                            .sorted((a, b) -> Long.compare(b.getVotes(), a.getVotes()))
                            .toList();

            localbodies.add(
                    AssemblyAnalysisResponseDto.LocalbodySummary.builder()
                            .localbodyId(lbId)
                            .localbodyName(lb != null ? lb.getName() : "Unknown")
                            .localbodyType(lb != null ? lb.getType() : null)
                            .wardsCount(rows.size())
                            .voteShare(lbVoteShare)
                            .wardPerformance(List.of())
                            .build()
            );
        }

        /* ------------------------------
           FINAL RESPONSE
        ------------------------------ */
        return AssemblyAnalysisResponseDto.builder()
                .acName(displayName)
                .year(year)
                .totalWards(wards.size())
                .overallVoteShare(overallVoteShare)
                .localbodies(localbodies)
                .wards(wardRows)
                .build();
    }

    private List<String> normalizeTypes(List<String> types) {
        return (types == null || types.isEmpty())
                ? null
                : types.stream().map(String::toLowerCase).toList();
    }
}
