package com.keralavotes.election.service;

import com.keralavotes.election.dto.*;
import com.keralavotes.election.dto.details.AllianceAnalysisResponse;
import com.keralavotes.election.dto.details.AllianceLocalbodySummaryDto;
import com.keralavotes.election.dto.details.AllianceVoteDetailDto;
import com.keralavotes.election.dto.details.BoothDetailRowDto;
import com.keralavotes.election.dto.details.LocalbodyDetailYearDataDto;
import com.keralavotes.election.dto.details.WardDetailRowDto;
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
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocalbodyElectionAnalysisService {

    private final LocalbodyRepository localbodyRepo;
    private final LbCandidateRepository candidateRepo;
    private final LbWardResultRepository wardResultRepo;
    private final WardRepository wardRepo;
    private final PartyRepository partyRepo;
    private final EntityManager em;

    // If you already have a booth-based analysis service for 2024 GE & future elections,
    // inject it here and delegate from buildBoothBasedAnalysis(...)
    // private final BoothAnalysisService boothAnalysisService;

    // --- election type registry (future proof) ---

    private static final Map<Integer, ElectionType> ELECTION_TYPES;
    private static final Map<Integer, String> ELECTION_LABELS;

    static {
        Map<Integer, ElectionType> types = new LinkedHashMap<>();
        types.put(2015, ElectionType.LOCALBODY);
        types.put(2020, ElectionType.LOCALBODY);
        types.put(2024, ElectionType.GE);
        types.put(2019, ElectionType.GE);
        types.put(2025, ElectionType.LOCALBODY);
        types.put(2026, ElectionType.ASSEMBLY);
        ELECTION_TYPES = Collections.unmodifiableMap(types);

        Map<Integer, String> labels = new LinkedHashMap<>();
        labels.put(2015, "2015 Localbody Election");
        labels.put(2020, "2020 Localbody Election");
        labels.put(2024, "2024 General Election");
        labels.put(2019, "2019 General Election");
        labels.put(2025, "2025 Localbody Election");
        labels.put(2026, "2026 Assembly Election");
        ELECTION_LABELS = Collections.unmodifiableMap(labels);
    }

    // --- Alliance helper: null/empty -> "OTH" ---

    private String resolveAlliance(Party party) {
        if (party == null) return "OTH";

        if (party.getAlliance() == null || party.getAlliance().getName() == null) {
            return "OTH";
        }

        String name = party.getAlliance().getName().trim();
        if (name.isEmpty()) return "OTH";

        return name.toUpperCase();  // LDF, UDF, NDA, etc.
    }

    // === PUBLIC ENTRY POINT ==================================================

    public LocalbodyAnalysisResponse analyzeLocalbody(Long localbodyId, List<Integer> requestedYears) {

        Localbody lb = localbodyRepo.findById(localbodyId)
                .orElseThrow(() -> new IllegalArgumentException("Localbody not found: " + localbodyId));

        // Build base response
        LocalbodyAnalysisResponse resp = new LocalbodyAnalysisResponse();
        LocalbodyAnalysisResponse.LocalbodyInfo info = new LocalbodyAnalysisResponse.LocalbodyInfo();
        info.setId(lb.getId());
        info.setName(lb.getName());
        info.setType(lb.getType());
        info.setDistrictName(lb.getDistrict() != null ? lb.getDistrict().getName() : null);
        resp.setLocalbody(info);

        // Decide which years to include
        List<Integer> yearsToProcess;
        if (requestedYears == null || requestedYears.isEmpty()) {
            yearsToProcess = new ArrayList<>(ELECTION_TYPES.keySet());
        } else {
            yearsToProcess = requestedYears.stream()
                    .filter(ELECTION_TYPES::containsKey)  // ignore unknown years
                    .distinct()
                    .sorted()
                    .toList();
        }

        Map<String, SingleElectionAnalysisDto> electionMap = new LinkedHashMap<>();

        for (Integer year : yearsToProcess) {
            ElectionType type = ELECTION_TYPES.get(year);
            if (type == null) {
                log.warn("Year {} not configured in ELECTION_TYPES, skipping", year);
                continue;
            }

            SingleElectionAnalysisDto dto;

            switch (type) {
                case LOCALBODY -> dto = buildLocalbodyAnalysis(lb, year);
                case GE, ASSEMBLY -> dto = buildBoothBasedAnalysis(lb, year, type);
                default -> {
                    log.warn("Unsupported election type {} for year {}", type, year);
                    continue;
                }
            }

            electionMap.put(String.valueOf(year), dto);
        }

        resp.setElections(electionMap);
        return resp;
    }

    // === LOCALBODY (WARD-BASED) ANALYSIS =====================================

    private SingleElectionAnalysisDto buildLocalbodyAnalysis(Localbody lb, int year) {

        log.debug("Building LOCALBODY analysis for LB={} year={}", lb.getId(), year);

        // 1) load all candidates for this localbody & year
        List<LbCandidate> candidates =
                candidateRepo.findByLocalbodyIdAndElectionYear(lb.getId(), year);

        if (candidates.isEmpty()) {
            log.info("No localbody candidates for LB={} year={}", lb.getId(), year);
        }

        Map<Integer, LbCandidate> candById = candidates.stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(
                        LbCandidate::getId,
                        Function.identity()
                ));

        Set<Integer> candIds = candById.keySet();

        if (candIds.isEmpty()) {
            return emptyLocalbodyElectionDto(lb, year);
        }

        // 2) load all ward results for these candidates & year
        List<LbWardResult> results =
                wardResultRepo.findByElectionYearAndCandidateIdIn(year, candIds);

        // 3) load party map
        Map<Long, Party> partyById = partyRepo.findAll().stream()
                .filter(p -> p.getId() != null)
                .collect(Collectors.toMap(Party::getId, Function.identity()));

        // 4) build alliance vote totals
        Map<String, Long> votesByAlliance = new HashMap<>();
        long totalVotes = 0L;

        // also group by ward for performance ranking
        Map<Integer, List<LbWardResult>> resultsByWard =
                results.stream().collect(Collectors.groupingBy(LbWardResult::getWardId));

        for (LbWardResult r : results) {
            LbCandidate c = candById.get(r.getCandidateId());
            if (c == null) continue;

            Party party = (c.getPartyId() != null) ? partyById.get(c.getPartyId()) : null;
            String alliance = resolveAlliance(party);

            long v = r.getVotes();
            totalVotes += v;
            votesByAlliance.merge(alliance, v, Long::sum);
        }

        // 5) convert vote share to DTO list
        long finalTotalVotes = totalVotes;
        List<VoteShareRowDto> voteShare = votesByAlliance.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue())) // desc by votes
                .map(e -> new VoteShareRowDto(
                        e.getKey(),
                        e.getValue(),
                        finalTotalVotes == 0 ? 0.0 : (e.getValue() * 100.0 / finalTotalVotes)
                ))
                .toList();

        // 6) ward performance
        Map<String, PerformanceRowDto> perfByAlliance = new HashMap<>();

        // ensure row exists for an alliance before incrementing
        java.util.function.Function<String, PerformanceRowDto> perfRow =
                a -> perfByAlliance.computeIfAbsent(a, k -> new PerformanceRowDto(k, 0, 0, 0));

        for (Map.Entry<Integer, List<LbWardResult>> e : resultsByWard.entrySet()) {
            List<LbWardResult> wardResults = e.getValue().stream()
                    .sorted((r1, r2) -> Integer.compare(r2.getVotes(), r1.getVotes())) // desc votes
                    .toList();

            for (int pos = 0; pos < wardResults.size() && pos < 3; pos++) {
                LbWardResult r = wardResults.get(pos);
                LbCandidate c = candById.get(r.getCandidateId());
                if (c == null) continue;
                Party p = (c.getPartyId() != null) ? partyById.get(c.getPartyId()) : null;
                String alliance = resolveAlliance(p);

                PerformanceRowDto row = perfRow.apply(alliance);
                if (pos == 0) row.setWinner(row.getWinner() + 1);
                else if (pos == 1) row.setRunnerUp(row.getRunnerUp() + 1);
                else if (pos == 2) row.setThird(row.getThird() + 1);
            }
        }

        List<PerformanceRowDto> wardPerf = perfByAlliance.values().stream()
                .sorted(Comparator.comparing(PerformanceRowDto::getAlliance))
                .toList();

        // 7) build DTO
        SingleElectionAnalysisDto dto = new SingleElectionAnalysisDto();
        dto.setYear(year);
        dto.setType(ElectionType.LOCALBODY);
        dto.setLabel(ELECTION_LABELS.getOrDefault(year, year + " Localbody Election"));
        dto.setVoteShare(voteShare);
        dto.setWardPerformance(wardPerf);

        // booth fields remain null for localbody elections
        dto.setBoothVoteShare(null);
        dto.setBoothPerformance(null);

        return dto;
    }

    private SingleElectionAnalysisDto emptyLocalbodyElectionDto(Localbody lb, int year) {
        SingleElectionAnalysisDto dto = new SingleElectionAnalysisDto();
        dto.setYear(year);
        dto.setType(ElectionType.LOCALBODY);
        dto.setLabel(ELECTION_LABELS.getOrDefault(year, year + " Localbody Election"));
        dto.setVoteShare(Collections.emptyList());
        dto.setWardPerformance(Collections.emptyList());
        dto.setBoothVoteShare(null);
        dto.setBoothPerformance(null);
        return dto;
    }

    // === GE / ASSEMBLY (BOOTH-BASED) ANALYSIS =================================
    //
    // Plug your existing 2024 GE localbody/booth analysis here.
    // For now I provide a stub that returns an empty object, so it won’t break
    // compilation. Replace the body with calls to your existing service.

    private SingleElectionAnalysisDto buildBoothBasedAnalysis(Localbody lb, int year, ElectionType type) {

        log.debug("Building {} booth-based analysis for LB={} year={}", type, lb.getId(), year);

        // --- QUERY 1: party-wise booth votes ---
        List<Object[]> partyRows = em.createQuery("""
            SELECT p.shortName, a.name, SUM(bv.votes)
            FROM BoothVotes bv
            JOIN bv.pollingStation ps
            JOIN bv.candidate c
            LEFT JOIN c.party p
            LEFT JOIN p.alliance a
            WHERE ps.localbody.id = :lbId AND bv.year = :year
            GROUP BY p.shortName, a.name
            ORDER BY SUM(bv.votes) DESC
        """, Object[].class)
                .setParameter("lbId", lb.getId())
                .setParameter("year", year)
                .getResultList();

        // Convert to vote-share DTO
        long totalVotes = partyRows.stream()
                .mapToLong(r -> ((Number) r[2]).longValue())
                .sum();

        List<VoteShareRowDto> boothVoteShare = partyRows.stream()
                .map(r -> {
                    String alliance = r[1] != null ? r[1].toString() : "OTH";
                    long votes = ((Number) r[2]).longValue();
                    double pct = totalVotes == 0 ? 0 : (votes * 100.0 / totalVotes);
                    return new VoteShareRowDto(alliance, votes, pct);
                })
                .toList();

        // --- QUERY 2: Booth results grouped by booth -> used for ranking summary ---
        List<Object[]> boothRows = em.createQuery("""
        SELECT 
            ps.id,
            COALESCE(a.name, 'OTH'),
            SUM(bv.votes)
        FROM BoothVotes bv
            JOIN bv.pollingStation ps
            JOIN bv.candidate c
            LEFT JOIN c.party p
            LEFT JOIN p.alliance a
        WHERE ps.localbody.id = :lbId
          AND bv.year = :year
        GROUP BY ps.id, a.name
    """, Object[].class)
                .setParameter("lbId", lb.getId())
                .setParameter("year", year)
                .getResultList();

        // Build booth performance
        Map<Long, Map<String, Long>> boothMap = new HashMap<>();

        for (Object[] row : boothRows) {
            Long boothId = ((Number) row[0]).longValue();
            String alliance = row[1] != null ? row[1].toString() : "OTH";
            long votes = ((Number) row[2]).longValue();

            boothMap.computeIfAbsent(boothId, k -> new HashMap<>())
                    .merge(alliance, votes, Long::sum);
        }

        // Ranking table
        Map<String, PerformanceRowDto> perf = new HashMap<>();
        Function<String, PerformanceRowDto> perfRow =
                a -> perf.computeIfAbsent(a, k -> new PerformanceRowDto(k, 0, 0, 0));

        for (var entry : boothMap.entrySet()) {
            var alliances = entry.getValue().entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .toList();

            for (int pos = 0; pos < alliances.size() && pos < 3; pos++) {
                String a = alliances.get(pos).getKey();
                PerformanceRowDto row = perfRow.apply(a);
                if (pos == 0) row.setWinner(row.getWinner() + 1);
                else if (pos == 1) row.setRunnerUp(row.getRunnerUp() + 1);
                else if (pos == 2) row.setThird(row.getThird() + 1);
            }
        }

        // DTO
        SingleElectionAnalysisDto dto = new SingleElectionAnalysisDto();
        dto.setYear(year);
        dto.setType(type);
        dto.setLabel(ELECTION_LABELS.get(year));
        dto.setBoothVoteShare(boothVoteShare);
        dto.setBoothPerformance(perf.values().stream().toList());

        dto.setVoteShare(null);
        dto.setWardPerformance(null);

        return dto;
    }

    // ========================================================================
    // NEW: DETAILED ANALYSIS (WARD / BOOTH TABLES)
    // ========================================================================

    /**
     * Detailed analysis per year:
     *  - LOCALBODY: ward-wise tables
     *  - GE / ASSEMBLY: booth-wise tables
     *
     * JSON shape:
     *  {
     *    "2015": { "year": 2015, "type": "LOCALBODY", "wards": [...], "booths": null },
     *    "2024": { "year": 2024, "type": "GE", "wards": null, "booths": [...] }
     *  }
     */
    public Map<Integer, LocalbodyDetailYearDataDto> analyzeLocalbodyDetails(
            Long localbodyId,
            List<Integer> requestedYears
    ) {
        Localbody lb = localbodyRepo.findById(localbodyId)
                .orElseThrow(() -> new IllegalArgumentException("Localbody not found: " + localbodyId));

        List<Integer> yearsToProcess;
        if (requestedYears == null || requestedYears.isEmpty()) {
            yearsToProcess = new ArrayList<>(ELECTION_TYPES.keySet());
        } else {
            yearsToProcess = requestedYears.stream()
                    .filter(ELECTION_TYPES::containsKey)
                    .distinct()
                    .sorted()
                    .toList();
        }

        Map<Integer, LocalbodyDetailYearDataDto> result = new LinkedHashMap<>();

        for (Integer year : yearsToProcess) {
            ElectionType type = ELECTION_TYPES.get(year);
            if (type == null) {
                log.warn("Year {} not configured in ELECTION_TYPES, skipping details", year);
                continue;
            }

            LocalbodyDetailYearDataDto dto = new LocalbodyDetailYearDataDto();
            dto.setYear(year);
            dto.setType(type);

            if (type == ElectionType.LOCALBODY) {
                dto.setWards(buildWardDetailRows(lb, year));
                dto.setBooths(null);
            } else if (type == ElectionType.GE || type == ElectionType.ASSEMBLY) {
                dto.setWards(null);
                dto.setBooths(buildBoothDetailRows(lb, year));
            } else {
                dto.setWards(null);
                dto.setBooths(null);
            }

            result.put(year, dto);
        }

        return result;
    }

    // ------------------------------------------------------------------------
    // LOCALBODY: WARD DETAIL TABLE
    // ------------------------------------------------------------------------
    private List<WardDetailRowDto> buildWardDetailRows(Localbody lb, int year) {

        log.debug("Building ward detail rows for LB={} year={}", lb.getId(), year);

        // 1) Candidates for this localbody/year
        List<LbCandidate> candidates =
                candidateRepo.findByLocalbodyIdAndElectionYear(lb.getId(), year);

        if (candidates.isEmpty()) {
            log.info("No localbody candidates for LB={} year={} (ward details)", lb.getId(), year);
            return Collections.emptyList();
        }

        Map<Integer, LbCandidate> candById = candidates.stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(LbCandidate::getId, Function.identity()));

        Set<Integer> candIds = candById.keySet();
        if (candIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 2) Ward-level results
        List<LbWardResult> results =
                wardResultRepo.findByElectionYearAndCandidateIdIn(year, candIds);

        if (results.isEmpty()) {
            return Collections.emptyList();
        }

        // 3) Ward map
        Set<Long> wardIds = results.stream()
                .map(r -> (long) r.getWardId())
                .collect(Collectors.toSet());

        Map<Long, Ward> wardById = wardRepo.findAllById(wardIds).stream()
                .collect(Collectors.toMap(Ward::getId, Function.identity()));

        // 4) Party map
        Map<Long, Party> partyById = partyRepo.findAll().stream()
                .filter(p -> p.getId() != null)
                .collect(Collectors.toMap(Party::getId, Function.identity()));

        // 5) Group results by ward
        Map<Integer, List<LbWardResult>> resultsByWard =
                results.stream().collect(Collectors.groupingBy(LbWardResult::getWardId));

        List<WardDetailRowDto> rows = new ArrayList<>();

        for (Map.Entry<Integer, List<LbWardResult>> entry : resultsByWard.entrySet()) {
            Integer wardIdInt = entry.getKey();
            Long wardId = wardIdInt.longValue();

            Ward ward = wardById.get(wardId);
            String wardName = ward != null ? ward.getWardName() : ("Ward " + wardIdInt);
            Integer wardNum = ward != null ? (int) ward.getWardNum() : wardIdInt;

            List<LbWardResult> wardResults = entry.getValue();

            // 5a) sum votes per alliance
            Map<String, Long> votesByAlliance = new HashMap<>();
            long totalVotes = 0L;

            for (LbWardResult r : wardResults) {
                LbCandidate c = candById.get(r.getCandidateId());
                if (c == null) continue;

                Party party = (c.getPartyId() != null) ? partyById.get(c.getPartyId()) : null;
                String alliance = resolveAlliance(party);

                long v = r.getVotes();
                totalVotes += v;
                votesByAlliance.merge(alliance, v, Long::sum);
            }

            if (votesByAlliance.isEmpty()) {
                continue;
            }

            // 5b) alliance list sorted by votes desc
            List<Map.Entry<String, Long>> sortedAlliances = votesByAlliance.entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .toList();

            String winnerAlliance = sortedAlliances.get(0).getKey();
            long winnerVotes = sortedAlliances.get(0).getValue();
            long secondVotes = sortedAlliances.size() > 1 ? sortedAlliances.get(1).getValue() : 0L;
            long margin = winnerVotes - secondVotes;

            // 5c) build AllianceBreakup list
            long finalTotalVotes = totalVotes;
            List<AllianceVoteDetailDto> allianceDtos = sortedAlliances.stream()
                    .map(e -> new AllianceVoteDetailDto(
                            e.getKey(),
                            e.getValue(),
                            finalTotalVotes == 0 ? 0.0 : (e.getValue() * 100.0 / finalTotalVotes)
                    ))
                    .toList();

            WardDetailRowDto row = new WardDetailRowDto();
            row.setWardNum(wardNum);
            row.setWardName(wardName);
            row.setAlliances(allianceDtos);
            row.setTotal(totalVotes);
            row.setWinner(winnerAlliance);
            row.setMargin(margin);

            rows.add(row);
        }

        // Sort rows by wardNum ascending
        rows.sort(Comparator.comparing(
                r -> r.getWardNum() != null ? r.getWardNum() : Integer.MAX_VALUE
        ));

        return rows;
    }

    // ------------------------------------------------------------------------
    // GE / ASSEMBLY: BOOTH DETAIL TABLE
    // ------------------------------------------------------------------------
    private List<BoothDetailRowDto> buildBoothDetailRows(Localbody lb, int year) {

        log.debug("Building booth detail rows for LB={} year={}", lb.getId(), year);

        // Query returns: ps.id, ps.psNumber, ps.name, allianceName, SUM(votes)
        List<Object[]> rows = em.createQuery("""
            SELECT 
                ps.id,
                ps.psNumber,
                ps.name,
                COALESCE(a.name, 'OTH'),
                SUM(bv.votes)
            FROM BoothVotes bv
                JOIN bv.pollingStation ps
                JOIN bv.candidate c
                LEFT JOIN c.party p
                LEFT JOIN p.alliance a
            WHERE ps.localbody.id = :lbId
              AND bv.year = :year
            GROUP BY ps.id, ps.psNumber, ps.name, a.name
        """, Object[].class)
                .setParameter("lbId", lb.getId())
                .setParameter("year", year)
                .getResultList();

        if (rows.isEmpty()) {
            return Collections.emptyList();
        }

        // Group by booth id
        record BoothKey(Long id, Integer num, String name) {}

        Map<BoothKey, Map<String, Long>> boothMap = new HashMap<>();

        for (Object[] r : rows) {
            Long boothId = ((Number) r[0]).longValue();
            Integer boothNum = r[1] != null ? ((Number) r[1]).intValue() : null;
            String boothName = r[2] != null ? r[2].toString() : "";
            String alliance = r[3] != null ? r[3].toString() : "OTH";
            long votes = ((Number) r[4]).longValue();

            BoothKey key = new BoothKey(boothId, boothNum, boothName);

            boothMap.computeIfAbsent(key, k -> new HashMap<>())
                    .merge(alliance, votes, Long::sum);
        }

        List<BoothDetailRowDto> result = new ArrayList<>();

        for (var entry : boothMap.entrySet()) {
            BoothKey key = entry.getKey();
            Map<String, Long> votesByAlliance = entry.getValue();

            long totalVotes = votesByAlliance.values().stream()
                    .mapToLong(Long::longValue)
                    .sum();

            if (totalVotes == 0) continue;

            List<Map.Entry<String, Long>> sortedAlliances = votesByAlliance.entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .toList();

            String winnerAlliance = sortedAlliances.get(0).getKey();
            long winnerVotes = sortedAlliances.get(0).getValue();
            long secondVotes = sortedAlliances.size() > 1 ? sortedAlliances.get(1).getValue() : 0L;
            long margin = winnerVotes - secondVotes;

            List<AllianceVoteDetailDto> allianceDtos = sortedAlliances.stream()
                    .map(e -> new AllianceVoteDetailDto(
                            e.getKey(),
                            e.getValue(),
                            totalVotes == 0 ? 0.0 : (e.getValue() * 100.0 / totalVotes)
                    ))
                    .toList();

            BoothDetailRowDto dto = new BoothDetailRowDto();
            dto.setBoothNum(key.num());
            dto.setBoothName(key.name());
            dto.setAlliances(allianceDtos);
            dto.setTotal(totalVotes);
            dto.setWinner(winnerAlliance);
            dto.setMargin(margin);

            result.add(dto);
        }

        // sort by booth number (nulls at end)
        result.sort(Comparator.comparing(
                r -> r.getBoothNum() != null ? r.getBoothNum() : Integer.MAX_VALUE
        ));

        return result;
    }

}
