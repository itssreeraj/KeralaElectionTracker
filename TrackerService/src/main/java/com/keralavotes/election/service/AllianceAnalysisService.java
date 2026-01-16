package com.keralavotes.election.service;

import com.keralavotes.election.dto.AllianceDto;
import com.keralavotes.election.dto.details.AllianceAnalysisResponse;
import com.keralavotes.election.dto.details.LocalbodyWardDetailsResponse;
import com.keralavotes.election.entity.*;
import com.keralavotes.election.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.summingInt;
import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AllianceAnalysisService {

    private final LocalbodyRepository localbodyRepo;
    private final WardRepository wardRepo;
    private final PartyRepository partyRepo;
    private final LbCandidateRepository candidateRepo;
    private final LbWardResultRepository wardResultRepo;
    private final AllianceRepository allianceRepository;

    private final EntityManager em;

    public AllianceAnalysisResponse analyze(int district, String type, String alliance, int year, int swingPercent, Long localbodyId) {

        // ======== Load Localbodies ========
        List<Localbody> lbs;

        if (localbodyId != null) {
            // Single localbody selected
            Localbody lb = localbodyRepo.findById(localbodyId)
                    .orElseThrow(() -> new RuntimeException("Localbody not found: " + localbodyId));
            lbs = List.of(lb);
        } else {
            // All localbodies of district & type
            if (type == null || type.isBlank()) {
                // All types
                lbs = localbodyRepo.findByDistrict_DistrictCode(district);
            } else {
                lbs = localbodyRepo.findByDistrict_DistrictCodeAndTypeIgnoreCase(district, type);
            }
        }


        // ======== Response Object Setup ========
        AllianceAnalysisResponse resp = new AllianceAnalysisResponse();
        resp.setDistrict(String.valueOf(district));
        resp.setType(type);
        resp.setAlliance(alliance);
        resp.setLocalbodyCount(lbs.size());
        resp.setYear(year);
        resp.setSwingPercent(swingPercent);

        List<AllianceAnalysisResponse.LocalbodyBreakdown> breakdownList = new ArrayList<>();

        int totalWardsWon = 0, totalWardsWinnable = 0;
        int totalBoothsWon = 0, totalBoothsWinnable = 0;

        boolean isGE = (year == 2024 || year == 2019 || year == 2014); // adjust as needed


        // ======== Run Localbody Loop ========
        for (Localbody lb : lbs) {
            var breakdown = analyzeSingleLocalbody(lb, alliance, year, swingPercent, isGE);

            totalWardsWon += breakdown.getWardsWon();
            totalWardsWinnable += breakdown.getWardsWinnable();

            if (isGE) {
                totalBoothsWon += breakdown.getBoothsWon();
                totalBoothsWinnable += breakdown.getBoothsWinnable();
            }

            breakdownList.add(breakdown);
        }

        resp.setBreakdown(breakdownList);
        resp.setWardsWon(totalWardsWon);
        resp.setWardsWinnable(totalWardsWinnable);

        if (isGE) {
            resp.setBoothsWon(totalBoothsWon);
            resp.setBoothsWinnable(totalBoothsWinnable);
        }

        return resp;
    }

    private AllianceAnalysisResponse.LocalbodyBreakdown analyzeSingleLocalbody(
            Localbody lb,
            String alliance,
            int year,
            int swingPercent,
            boolean isGE
    ) {
        AllianceAnalysisResponse.LocalbodyBreakdown out = new AllianceAnalysisResponse.LocalbodyBreakdown();
        out.setLocalbodyId(lb.getId());
        out.setLocalbodyName(lb.getName());

        // ======== LB ELECTION (WARD BASED) ========
        List<LbCandidate> candidates = candidateRepo.findByLocalbodyIdAndElectionYear(lb.getId(), year);
        if (!candidates.isEmpty()) {

            // Map candidateId -> alliance
            Map<Integer, String> allianceMap = new HashMap<>();
            for (LbCandidate c : candidates) {
                Party p = c.getPartyId() == null ? null : partyRepo.findById(c.getPartyId()).orElse(null);
                String a = (p == null || p.getAlliance() == null) ? "OTH" : p.getAlliance().getName();
                allianceMap.put(c.getId(), a.toUpperCase());
            }

            // Ward results by ward
            // Fetch wards belonging to this localbody
            List<Ward> wards = wardRepo.findByLocalbodyId(lb.getId());
            Set<Long> wardIds = wards.stream().map(Ward::getId).collect(Collectors.toSet());

            // Fetch ward results for these wards
            List<LbWardResult> results =
                    wardResultRepo.findByElectionYearAndWardIdIn(year, wardIds);

            Map<Integer, List<LbWardResult>> wardGroups = results.stream()
                    .collect(groupingBy(LbWardResult::getWardId));

            int win = 0, winnable = 0;

            for (var entry : wardGroups.entrySet()) {
                List<LbWardResult> wardVotes = entry.getValue();

                // Sort by votes desc
                wardVotes.sort((a, b) -> Integer.compare(b.getVotes(), a.getVotes()));

                LbWardResult winner = wardVotes.get(0);
                String winnerAlliance = allianceMap.get(winner.getCandidateId());

                if (winnerAlliance != null && winnerAlliance.equalsIgnoreCase(alliance)) {
                    win++;
                    continue;
                }

                // Find candidate of target alliance
                Optional<LbWardResult> oursOpt = wardVotes.stream()
                        .filter(r -> alliance.equalsIgnoreCase(allianceMap.get(r.getCandidateId())))
                        .findFirst();

                if (oursOpt.isPresent()) {
                    LbWardResult ours = oursOpt.get();
                    int gap = winner.getVotes() - ours.getVotes();
                    double pctGap = (gap * 100.0) / winner.getVotes();

                    if (pctGap <= swingPercent) {
                        winnable++;
                    }
                }
            }

            out.setWardsWon(win);
            out.setWardsWinnable(winnable);

            // NEW: total wards & majority
            int totalWards = wardGroups.size();
            int majority = (totalWards / 2) + 1;
            out.setTotalWards(totalWards);
            out.setMajorityNeeded(majority);

            // NEW: verdict at LB level
            String verdict;
            if (win >= majority) {
                verdict = "MAJORITY";
            } else if (win + winnable >= majority) {
                verdict = "POSSIBLE_WITH_SWING";
            } else {
                verdict = "HARD";
            }
            out.setVerdict(verdict);
        }

        // ======== GE ANALYSIS (BOOTH BASED) ========
        if (isGE) {
            List<Object[]> boothRows = em.createQuery("""
                SELECT ps.id, c.id, SUM(bv.votes)
                FROM BoothVotes bv
                JOIN bv.pollingStation ps
                JOIN bv.candidate c
                WHERE ps.localbody.id = :lbId AND bv.year = :year
                GROUP BY ps.id, c.id
                """, Object[].class)
                    .setParameter("lbId", lb.getId())
                    .setParameter("year", year)
                    .getResultList();

            if (!boothRows.isEmpty()) {

                Map<Long, Map<Integer, Integer>> boothMap = new HashMap<>();
                boothRows.forEach(row -> {
                    Long psId = ((Number) row[0]).longValue();
                    Integer candId = ((Number) row[1]).intValue();
                    Integer votes = ((Number) row[2]).intValue();

                    boothMap.computeIfAbsent(psId, k -> new HashMap<>())
                            .merge(candId, votes, Integer::sum);
                });

                // Build candidate alliance map
                Map<Integer, String> candAlliance = new HashMap<>();
                List<LbCandidate> candList = candidateRepo.findByElectionYear(year);
                for (LbCandidate c : candList) {
                    Party p = c.getPartyId() == null ? null : partyRepo.findById(c.getPartyId()).orElse(null);
                    String a = (p == null || p.getAlliance() == null) ? "OTH" : p.getAlliance().getName();
                    candAlliance.put(c.getId(), a.toUpperCase());
                }

                int boothsWon = 0, boothsWinnable = 0;

                for (var entry : boothMap.entrySet()) {
                    var votes = entry.getValue()
                            .entrySet()
                            .stream()
                            .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                            .toList();

                    var top = votes.get(0);
                    String winnerAlliance = candAlliance.get(top.getKey());

                    if (winnerAlliance != null && winnerAlliance.equalsIgnoreCase(alliance)) {
                        boothsWon++;
                        continue;
                    }

                    // Find our candidate in booth
                    Optional<Map.Entry<Integer, Integer>> oursOpt = votes.stream()
                            .filter(e -> alliance.equalsIgnoreCase(candAlliance.get(e.getKey())))
                            .findFirst();

                    if (oursOpt.isPresent()) {
                        int gap = top.getValue() - oursOpt.get().getValue();
                        double pctGap = (gap * 100.0) / top.getValue();
                        if (pctGap <= swingPercent) {
                            boothsWinnable++;
                        }
                    }
                }

                out.setBoothsWon(boothsWon);
                out.setBoothsWinnable(boothsWinnable);
            }
        }

        return out;
    }

    public List<AllianceDto> getAll() {
        return allianceRepository.findAll()
                .stream()
                .map(a -> new AllianceDto(
                        a.getId(),  // allianceID
                        a.getName(),  // display name
                        a.getColor()  // color
                ))
                .toList();
    }

    /**
     * Get ward-level details for a localbody with swing analysis.
     * @param localbodyId Localbody ID
     * @param alliance Target alliance
     * @param year Election year
     * @param swingPercent Swing percentage
     * @return LocalbodyWardDetailsResponse
     */
    public LocalbodyWardDetailsResponse getWardDetails(Long localbodyId, String alliance, int year, int swingPercent) {
        Localbody lb = localbodyRepo.findById(localbodyId)
                .orElseThrow(() -> new IllegalArgumentException("Localbody not found: " + localbodyId));

        // candidates & their alliances
        List<LbCandidate> candidates =
                candidateRepo.findByLocalbodyIdAndElectionYear(lb.getId(), year);

        Map<Integer, String> candidateAlliance = new HashMap<>();
        for (LbCandidate c : candidates) {
            Party p = c.getPartyId() == null
                    ? null
                    : partyRepo.findById(c.getPartyId()).orElse(null);
            String a = (p == null || p.getAlliance() == null)
                    ? "OTH"
                    : p.getAlliance().getName();
            candidateAlliance.put(c.getId(), a.toUpperCase());
        }

        // wards for this localbody
        List<Ward> wards = wardRepo.findByLocalbodyId(lb.getId());
        Map<Long, Ward> wardById = wards.stream()
                .collect(toMap(Ward::getId, w -> w));

        Set<Long> wardIds = wardById.keySet();

        if (wardIds.isEmpty()) {
            return LocalbodyWardDetailsResponse.builder()
                    .localbodyId(lb.getId())
                    .localbodyName(lb.getName())
                    .year(year)
                    .totalWards(0)
                    .majorityNeeded(0)
                    .wards(Collections.emptyList())
                    .build();
        }

        // ward results
        List<LbWardResult> results =
                wardResultRepo.findByElectionYearAndWardIdIn(year, wardIds);

        Map<Long, List<LbWardResult>> wardGroups = results.stream()
                .collect(groupingBy(r -> r.getWardId().longValue()));

        List<LocalbodyWardDetailsResponse.WardRow> wardRows = new ArrayList<>();

        for (Map.Entry<Long, List<LbWardResult>> entry : wardGroups.entrySet()) {
            Long wardId = entry.getKey();
            List<LbWardResult> wardVotes = entry.getValue();

            Ward ward = wardById.get(wardId);
            if (ward == null) {
                continue;
            }

            // sort descending by votes
            wardVotes.sort((a, b) -> Integer.compare(b.getVotes(), a.getVotes()));

            int totalVotes = wardVotes.stream()
                    .mapToInt(LbWardResult::getVotes)
                    .sum();

            LbWardResult winnerRes = wardVotes.get(0);
            String winnerAlliance = candidateAlliance.get(winnerRes.getCandidateId());
            if (winnerAlliance == null) winnerAlliance = "OTH";

            // build alliance votes list
            List<LocalbodyWardDetailsResponse.AllianceVotes> allianceVotesList =
                    wardVotes.stream()
                            .collect(groupingBy(
                                    r -> candidateAlliance.getOrDefault(r.getCandidateId(), "OTH"),
                                    summingInt(LbWardResult::getVotes)
                            ))
                            .entrySet()
                            .stream()
                            .map(e -> {
                                String a = e.getKey();
                                int v = e.getValue();
                                double pct = totalVotes == 0 ? 0.0 : (v * 100.0) / totalVotes;
                                return LocalbodyWardDetailsResponse.AllianceVotes.builder()
                                        .alliance(a)
                                        .votes(v)
                                        .percentage(pct)
                                        .build();
                            })
                            .sorted((a, b) -> Integer.compare(b.getVotes(), a.getVotes()))
                            .collect(toList());

            // find target alliance result
            Optional<LocalbodyWardDetailsResponse.AllianceVotes> oursOpt =
                    allianceVotesList.stream()
                            .filter(av -> av.getAlliance().equalsIgnoreCase(alliance))
                            .findFirst();

            boolean winnable = false;
            Double gapPct = null;
            Integer marginVotes = null;

            if (winnerAlliance.equalsIgnoreCase(alliance)) {
                // already won
                marginVotes = null; // you can compute if you want vs #2
                winnable = true;   // or true but you already count it as win
            } else if (oursOpt.isPresent()) {
                LocalbodyWardDetailsResponse.AllianceVotes ours = oursOpt.get();
                int winnerVotes = allianceVotesList.get(0).getVotes();
                int gap = winnerVotes - ours.getVotes();
                marginVotes = gap;
                gapPct = winnerVotes == 0 ? 0.0 : (gap * 100.0) / winnerVotes;
                if (gapPct <= swingPercent) {
                    winnable = true;
                }
            }

            LocalbodyWardDetailsResponse.WardRow row =
                    LocalbodyWardDetailsResponse.WardRow.builder()
                            .wardNum(ward.getWardNum()) // adjust getter as per your entity
                            .wardName(ward.getWardName())
                            .alliances(allianceVotesList)
                            .totalVotes(totalVotes)
                            .winnerAlliance(winnerAlliance)
                            .marginVotes(marginVotes)
                            .winnable(winnable)
                            .gapPercent(gapPct)
                            .build();

            wardRows.add(row);
        }

        int totalWards = wards.size();
        int majority = (totalWards / 2) + 1;

        return LocalbodyWardDetailsResponse.builder()
                .localbodyId(lb.getId())
                .localbodyName(lb.getName())
                .year(year)
                .totalWards(totalWards)
                .majorityNeeded(majority)
                .wards(wardRows.stream()
                        .sorted(Comparator.comparingInt(LocalbodyWardDetailsResponse.WardRow::getWardNum))
                        .collect(toList()))
                .build();
    }
}

