package com.keralavotes.election.service;

import com.keralavotes.election.dto.AssemblyAnalysisResponseDto;
import com.keralavotes.election.entity.LbCandidate;
import com.keralavotes.election.entity.LbWardResult;
import com.keralavotes.election.entity.Localbody;
import com.keralavotes.election.entity.Party;
import com.keralavotes.election.entity.Ward;
import com.keralavotes.election.repository.LbCandidateRepository;
import com.keralavotes.election.repository.LbWardResultRepository;
import com.keralavotes.election.repository.LocalbodyRepository;
import com.keralavotes.election.repository.PartyRepository;
import com.keralavotes.election.repository.WardRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssemblyAnalysisService {

    private final WardRepository wardRepository;
    private final LbWardResultRepository wardResultRepository;
    private final LbCandidateRepository candidateRepository;
    private final PartyRepository partyRepository;
    private final LocalbodyRepository localbodyRepo;

    /**
     * Build assembly analysis for acId and year.
     * NOTE: This is vote-only (no swing/majority/winnable).
     */
    public AssemblyAnalysisResponseDto analyzeByAcCode(Integer acCode, int year) {
        // 1. Load wards belonging to this AC
        List<Ward> wards = wardRepository.findByAc_AcCode(acCode);
        if (wards == null) wards = Collections.emptyList();
        Set<Long> wardIds = wards.stream().map(Ward::getId).collect(Collectors.toSet());

        // 2. Load all ward results for these wards for the year
        List<LbWardResult> results = wardResultRepository.findByElectionYearAndWardIdIn(year, wardIds);
        // 3. Build candidate -> alliance map for all candidate ids present
        Set<Integer> candidateIds = results.stream().map(LbWardResult::getCandidateId).collect(Collectors.toSet());
        List<LbCandidate> candidates = candidateRepository.findByIdIn(new ArrayList<>(candidateIds));

        Map<Integer, String> candidateAlliance = new HashMap<>();
        for (LbCandidate c : candidates) {
            String alliance = "OTH";
            if (c.getPartyId() != null) {
                var pOpt = partyRepository.findById(c.getPartyId());
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

            List<AssemblyAnalysisResponseDto.PerformanceRow> perfList = new ArrayList<>(perfMap.values());

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

        return AssemblyAnalysisResponseDto.builder()
                .acName( (!wards.isEmpty() && wards.getFirst().getAc() != null) ? wards.getFirst().getAc().getName() : null)
                .acCode(acCode)
                .year(year)
                .totalWards(wards.size())
                .overallVoteShare(overallVoteShare)
                .localbodies(localbodySummaries)
                .wards(wardRows)
                .build();
    }

    /**
     * Analyze an assembly constituency by acCode.
     *
     * @param acCode assembly code
     * @param year election / delimitation year (you used same year param for assembly earlier)
     * @param includeTypes optional list of localbody types to include. If null -> include all.
     */
    @Transactional
    public AssemblyAnalysisResponseDto analyzeByAcCode(Integer acCode, Integer year, List<String> includeTypes) {

        // 1) fetch wards in this AC and year, optionally filter by types
        List<Ward> wards;
        if (includeTypes == null || includeTypes.isEmpty()) {
            wards = wardRepository.findByAc_AcCodeAndDelimitationYear(acCode, year);
        } else {
            wards = wardRepository.findByAc_AcCodeAndDelimitationYearAndLocalbody_TypeIn(acCode, year, includeTypes);
        }

        // 2) group wards by localbody
        Map<Long, List<Ward>> wardsByLocalbody = wards.stream()
                .filter(w -> w.getLocalbody() != null)
                .collect(Collectors.groupingBy(w -> w.getLocalbody().getId()));

        // 3) Build top-level response
        AssemblyAnalysisResponseDto resp = new AssemblyAnalysisResponseDto();
        resp.setAcCode(acCode);
        resp.setYear(year);

        // compute overall vote share across all wards (by alliance) -- ward results aggregated
        Map<String, Long> overallAllianceVotes = new HashMap<>();
        long overallTotalVotes = 0L;

        // We'll also build per-localbody summaries
        List<AssemblyAnalysisResponseDto.LocalbodySummary> lbSummaries = new ArrayList<>();

        for (Map.Entry<Long, List<Ward>> entry : wardsByLocalbody.entrySet()) {
            Long lbId = entry.getKey();
            List<Ward> lbWards = entry.getValue();
            Localbody lb = lbWards.getFirst().getLocalbody();

            // collect wardIds
            Set<Long> wardIds = lbWards.stream().map(Ward::getId).collect(Collectors.toSet());
            if (wardIds.isEmpty()) continue;

            // Fetch ward results for these wards for the election year
            List<LbWardResult> results = wardResultRepository.findByElectionYearAndWardIdIn(year, wardIds);

            // Map candidateId -> alliance
            Map<Integer, String> candAlliance = new HashMap<>();
            // get candidate list for these wards (or for year)
            List<LbCandidate> candidates = candidateRepository.findByElectionYear(year);
            for (LbCandidate c : candidates) {
                Party p = c.getPartyId() == null ? null : partyRepository.findById(c.getPartyId()).orElse(null);
                String a = (p == null || p.getAlliance() == null) ? "OTH" : p.getAlliance().getName();
                candAlliance.put(c.getId(), a.toUpperCase());
            }

            // Group results per ward
            Map<Integer, List<LbWardResult>> byWard = results.stream()
                    .collect(Collectors.groupingBy(LbWardResult::getWardId));

            // per-localbody aggregations
            long lbTotalVotes = 0L;
            Map<String, Long> lbAllianceVotes = new HashMap<>();
            int lbWardsCount = lbWards.size();

            for (var wg : byWard.entrySet()) {
                List<LbWardResult> wardVotes = wg.getValue();
                for (LbWardResult vr : wardVotes) {
                    String alliance = candAlliance.get(vr.getCandidateId());
                    if (alliance == null) alliance = "OTH";
                    lbTotalVotes += vr.getVotes();
                    lbAllianceVotes.merge(alliance, (long) vr.getVotes(), Long::sum);
                    overallAllianceVotes.merge(alliance, (long) vr.getVotes(), Long::sum);
                    overallTotalVotes += vr.getVotes();
                }
            }

            // Build vote share DTO for LB
            long finalLbTotalVotes = lbTotalVotes;
            List<AssemblyAnalysisResponseDto.AllianceVoteShare> lbVoteShare = lbAllianceVotes.entrySet()
                    .stream()
                    .map(e -> {
                        double pct = finalLbTotalVotes == 0 ? 0.0 : (e.getValue() * 100.0 / finalLbTotalVotes);
                        return new AssemblyAnalysisResponseDto.AllianceVoteShare(e.getKey(), e.getValue(), pct);
                    })
                    .sorted(Comparator.comparingLong(AssemblyAnalysisResponseDto.AllianceVoteShare::getVotes).reversed())
                    .toList();

            // ward performance (count of wins / 2nd / 3rd)
            Map<String, AssemblyAnalysisResponseDto.PerformanceCounts> perfMap = new HashMap<>();
            for (var wEntry : byWard.entrySet()) {
                List<LbWardResult> wardVotes = wEntry.getValue()
                        .stream()
                        .sorted((a, b) -> Integer.compare(b.getVotes(), a.getVotes()))
                        .toList();
                for (int i = 0; i < Math.min(3, wardVotes.size()); i++) {
                    LbWardResult r = wardVotes.get(i);
                    String alliance = candAlliance.get(r.getCandidateId());
                    if (alliance == null) alliance = "OTH";

                    AssemblyAnalysisResponseDto.PerformanceCounts perf = perfMap.computeIfAbsent(alliance, k -> new AssemblyAnalysisResponseDto.PerformanceCounts());
                    if (i == 0) perf.setWinner(perf.getWinner() + 1);
                    else if (i == 1) perf.setRunnerUp(perf.getRunnerUp() + 1);
                    else perf.setThird(perf.getThird() + 1);
                }
            }

            List<AssemblyAnalysisResponseDto.PerformanceRow> perfRows = perfMap.entrySet().stream()
                    .map(e -> new AssemblyAnalysisResponseDto.PerformanceRow(e.getKey(), e.getValue().getWinner(), e.getValue().getRunnerUp(), e.getValue().getThird()))
                    .sorted((a,b) -> Integer.compare(b.getWinner(), a.getWinner()))
                    .toList();

            AssemblyAnalysisResponseDto.LocalbodySummary lbSummary = new AssemblyAnalysisResponseDto.LocalbodySummary();
            lbSummary.setLocalbodyId(lbId);
            lbSummary.setLocalbodyName(lb.getName());
            lbSummary.setLocalbodyType(lb.getType());
            lbSummary.setWardsCount(lbWards.size());
            lbSummary.setVoteShare(lbVoteShare);
            lbSummary.setWardPerformance(perfRows);

            lbSummaries.add(lbSummary);
        }

        // overall vote share across AC
        long finalOverallTotalVotes = overallTotalVotes;
        List<AssemblyAnalysisResponseDto.AllianceVoteShare> overall = overallAllianceVotes.entrySet().stream()
                .map(e -> {
                    double pct = finalOverallTotalVotes == 0 ? 0.0 : (e.getValue() * 100.0 / finalOverallTotalVotes);
                    return new AssemblyAnalysisResponseDto.AllianceVoteShare(e.getKey(), e.getValue(), pct);
                })
                .sorted(Comparator.comparingLong(AssemblyAnalysisResponseDto.AllianceVoteShare::getVotes).reversed())
                .toList();

        resp.setLocalbodies(lbSummaries);
        resp.setOverallVoteShare(overall);

        // also include flattened wards (optional) for UI - we can add this
        List<AssemblyAnalysisResponseDto.WardRow> flatWards = wards.stream()
                .map(w -> {
                    AssemblyAnalysisResponseDto.WardRow wr = new AssemblyAnalysisResponseDto.WardRow();
                    wr.setWardId(w.getId());
                    wr.setWardNum(w.getWardNum());
                    wr.setWardName(w.getWardName());
                    wr.setLocalbodyId(Long.valueOf(w.getLocalbody() != null ? w.getLocalbody().getId().intValue() : null));
                    wr.setLocalbodyName(w.getLocalbody() != null ? w.getLocalbody().getName() : null);
                    // alliances + votes will be populated by separate query if needed
                    return wr;
                }).toList();

        resp.setWards(flatWards);

        return resp;
    }
}

