package com.keralavotes.election.service;

import com.keralavotes.election.dto.AssemblyAnalysisResponseDto;
import com.keralavotes.election.entity.LbCandidate;
import com.keralavotes.election.entity.LbWardResult;
import com.keralavotes.election.entity.Localbody;
import com.keralavotes.election.entity.Ward;
import com.keralavotes.election.repository.LbCandidateRepository;
import com.keralavotes.election.repository.LbWardResultRepository;
import com.keralavotes.election.repository.LocalbodyRepository;
import com.keralavotes.election.repository.PartyRepository;
import com.keralavotes.election.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssemblyAnalysisService {

    private final WardRepository wardRepo;
    private final LbWardResultRepository wardResultRepo;
    private final LbCandidateRepository candidateRepo;
    private final PartyRepository partyRepo;
    private final LocalbodyRepository localbodyRepo;

    /**
     * Build assembly analysis for acId and year.
     * NOTE: This is vote-only (no swing/majority/winnable).
     */
    public AssemblyAnalysisResponseDto analyzeByAcCode(Integer acCode, int year) {
        // 1. Load wards belonging to this AC
        List<Ward> wards = wardRepo.findByAc_AcCode(acCode);
        if (wards == null) wards = Collections.emptyList();
        Set<Long> wardIds = wards.stream().map(Ward::getId).collect(Collectors.toSet());

        // 2. Load all ward results for these wards for the year
        List<LbWardResult> results = wardResultRepo.findByElectionYearAndWardIdIn(year, wardIds);
        // 3. Build candidate -> alliance map for all candidate ids present
        Set<Integer> candidateIds = results.stream().map(LbWardResult::getCandidateId).collect(Collectors.toSet());
        List<LbCandidate> candidates = candidateRepo.findByIdIn(new ArrayList<>(candidateIds));

        Map<Integer, String> candidateAlliance = new HashMap<>();
        for (LbCandidate c : candidates) {
            String alliance = "OTH";
            if (c.getPartyId() != null) {
                var pOpt = partyRepo.findById(c.getPartyId());
                if (pOpt.isPresent() && pOpt.get().getAlliance() != null) {
                    alliance = pOpt.get().getAlliance().getName();
                }
            }
            candidateAlliance.put(c.getId(), alliance);
        }

        // 4. Aggregate AC-level vote counts by alliance
        Map<String, Long> acVoteMap = new HashMap<>();
        Map<Long, List<LbWardResult>> wardGrouped = results.stream()
                .collect(Collectors.groupingBy(r -> r.getWardId().longValue()));

        List<AssemblyAnalysisResponseDto.WardRow> wardRows = new ArrayList<>();

        for (Ward w : wards) {
            List<LbWardResult> wardVotes = wardGrouped.getOrDefault(w.getId(), Collections.emptyList());

            // compute per-alliance votes for this ward
            Map<String, Long> allianceVotes = new HashMap<>();
            int totalVotes = 0;
            for (LbWardResult rv : wardVotes) {
                int votes = rv.getVotes();
                totalVotes += votes;
                String a = candidateAlliance.getOrDefault(rv.getCandidateId(), "OTH");
                allianceVotes.merge(a, (long) votes, Long::sum);
            }

            // convert to list and compute winner + margin
            List<Map.Entry<String, Long>> sortedAlliances = allianceVotes.entrySet()
                    .stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .toList();

            String winnerAlliance = !sortedAlliances.isEmpty() ? sortedAlliances.get(0).getKey() : null;
            Integer margin = null;
            if (sortedAlliances.size() > 1) {
                margin = (int) (sortedAlliances.get(0).getValue() - sortedAlliances.get(1).getValue());
            }

            // add to AC-level totals
            allianceVotes.forEach((k, v) -> acVoteMap.merge(k, v, Long::sum));

            // build alliances list for DTO with percentage (will compute later)
            int finalTotalVotes = totalVotes;
            List<AssemblyAnalysisResponseDto.AllianceVoteShare> allianceListForWard = allianceVotes.entrySet()
                    .stream()
                    .map(e -> {
                        double pct = finalTotalVotes == 0 ? 0.0 : (e.getValue() * 100.0) / finalTotalVotes;
                        return AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                                .alliance(e.getKey())
                                .votes(e.getValue())
                                .percentage(pct)
                                .build();
                    })
                    .sorted((a, b) -> Long.compare(b.getVotes(), a.getVotes()))
                    .collect(Collectors.toList());

            wardRows.add(AssemblyAnalysisResponseDto.WardRow.builder()
                    .wardId(w.getId())
                    .wardNum(w.getWardNum()) // adapt getter name if needed
                    .wardName(w.getWardName())
                    .localbodyId(w.getLocalbody() != null ? w.getLocalbody().getId() : null)
                    .localbodyName(w.getLocalbody() != null ? w.getLocalbody().getName() : null)
                    .alliances(allianceListForWard)
                    .total(totalVotes)
                    .winner(winnerAlliance)
                    .margin(margin)
                    .build());
        }

        // 5. AC overall vote shares
        long acTotalVotes = acVoteMap.values().stream().mapToLong(Long::longValue).sum();
        List<AssemblyAnalysisResponseDto.AllianceVoteShare> overallVoteShare =
                acVoteMap.entrySet().stream()
                        .map(e -> AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                                .alliance(e.getKey())
                                .votes(e.getValue())
                                .percentage(acTotalVotes == 0 ? 0.0 : (e.getValue() * 100.0) / acTotalVotes)
                                .build())
                        .sorted((a, b) -> Long.compare(b.getVotes(), a.getVotes()))
                        .collect(Collectors.toList());

        // 6. Localbody aggregation (only wards that belong to this AC)
        Map<Long, List<AssemblyAnalysisResponseDto.WardRow>> lbToWardRows = wardRows.stream()
                .filter(r -> r.getLocalbodyId() != null)
                .collect(Collectors.groupingBy(AssemblyAnalysisResponseDto.WardRow::getLocalbodyId));

        List<AssemblyAnalysisResponseDto.LocalbodySummary> localbodySummaries = new ArrayList<>();
        for (Map.Entry<Long, List<AssemblyAnalysisResponseDto.WardRow>> e : lbToWardRows.entrySet()) {
            Long lbId = e.getKey();
            List<AssemblyAnalysisResponseDto.WardRow> rows = e.getValue();
            Localbody lb = localbodyRepo.findById(lbId).orElse(null);
            String lbName = lb != null ? lb.getName() : "Unknown";
            String lbType = lb != null ? lb.getType() : null;
            int wardsCount = rows.size();

            // aggregate votes per alliance for this localbody (using ward alliance lists)
            Map<String, Long> lbVoteMap = new HashMap<>();
            rows.forEach(rw -> {
                // alliances list already has votes per ward
                rw.getAlliances().forEach(av -> {
                    lbVoteMap.merge(av.getAlliance(), (long) av.getVotes(), Long::sum);
                });
            });
            long lbTotalVotes = lbVoteMap.values().stream().mapToLong(Long::longValue).sum();
            List<AssemblyAnalysisResponseDto.AllianceVoteShare> lbVoteShare = lbVoteMap.entrySet().stream()
                    .map(entry -> AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                            .alliance(entry.getKey())
                            .votes(entry.getValue())
                            .percentage(lbTotalVotes == 0 ? 0.0 : (entry.getValue() * 100.0) / lbTotalVotes)
                            .build())
                    .sorted((a, b) -> Long.compare(b.getVotes(), a.getVotes()))
                    .collect(Collectors.toList());

            // compute winner/runnerUp/third counts per alliance within localbody wards
            Map<String, AssemblyAnalysisResponseDto.PerformanceRow> perfMap = new HashMap<>();
            for (AssemblyAnalysisResponseDto.WardRow rw : rows) {
                String winner = rw.getWinner();
                // identify runnerUp/third by sorted alliances
                List<AssemblyAnalysisResponseDto.AllianceVoteShare> sorted = rw.getAlliances().stream()
                        .sorted((x, y) -> Long.compare((long)y.getVotes(), (long)x.getVotes()))
                        .toList();
                String r1 = !sorted.isEmpty() ? sorted.get(0).getAlliance() : null;
                String r2 = sorted.size() > 1 ? sorted.get(1).getAlliance() : null;
                String r3 = sorted.size() > 2 ? sorted.get(2).getAlliance() : null;

                if (r1 != null) {
                    perfMap.computeIfAbsent(r1, k -> {
                        var pr = new AssemblyAnalysisResponseDto.PerformanceRow();
                        pr.setAlliance(k);
                        pr.setWinner(0);
                        pr.setRunnerUp(0);
                        pr.setThird(0);
                        return pr;
                    }).setWinner(perfMap.get(r1).getWinner() + 1);
                }
                if (r2 != null) {
                    perfMap.computeIfAbsent(r2, k -> {
                        var pr = new AssemblyAnalysisResponseDto.PerformanceRow();
                        pr.setAlliance(k);
                        pr.setWinner(0);
                        pr.setRunnerUp(0);
                        pr.setThird(0);
                        return pr;
                    }).setRunnerUp(perfMap.get(r2).getRunnerUp() + 1);
                }
                if (r3 != null) {
                    perfMap.computeIfAbsent(r3, k -> {
                        var pr = new AssemblyAnalysisResponseDto.PerformanceRow();
                        pr.setAlliance(k);
                        pr.setWinner(0);
                        pr.setRunnerUp(0);
                        pr.setThird(0);
                        return pr;
                    }).setThird(perfMap.get(r3).getThird() + 1);
                }
            }

            List<AssemblyAnalysisResponseDto.PerformanceRow> perfList = perfMap.values().stream().collect(Collectors.toList());

            localbodySummaries.add(AssemblyAnalysisResponseDto.LocalbodySummary.builder()
                    .localbodyId(lbId)
                    .localbodyName(lbName)
                    .localbodyType(lbType)
                    .wardsCount(wardsCount)
                    .voteShare(lbVoteShare)
                    .wardPerformance(perfList)
                    .build());
        }

        // 7. Build response
        AssemblyAnalysisResponseDto resp = AssemblyAnalysisResponseDto.builder()
                .acName( (!wards.isEmpty() && wards.getFirst().getAc() != null) ? wards.getFirst().getAc().getName() : null)
                .acCode(acCode)
                .year(year)
                .totalWards(wards.size())
                .overallVoteShare(overallVoteShare)
                .localbodies(localbodySummaries)
                .wards(wardRows)
                .build();

        return resp;
    }
}

