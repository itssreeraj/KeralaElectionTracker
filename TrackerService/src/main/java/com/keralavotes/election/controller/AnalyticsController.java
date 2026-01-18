package com.keralavotes.election.controller;

import com.keralavotes.election.dto.LocalbodyAllianceVotesDto;
import com.keralavotes.election.dto.LocalbodyAnalysisResponse;
import com.keralavotes.election.dto.LocalbodyPartyVotesDto;
import com.keralavotes.election.dto.details.LocalbodyDetailYearDataDto;
import com.keralavotes.election.repository.BoothVotesRepository;
import com.keralavotes.election.service.AnalysisDetailService;
import com.keralavotes.election.service.LocalbodyElectionAnalysisService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/analysis")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final BoothVotesRepository boothVotesRepo;
    private final EntityManager em;
    private final LocalbodyElectionAnalysisService analysisService;
    private final AnalysisDetailService detailService;

    /* =====================================================
            UI EXPECTED ENDPOINTS — FIXED
       ===================================================== */

    /**
     * PARTY-WISE VOTES FOR A LOCALBODY
     * UI calls:
     *   /api/admin/analysis/localbody/party?localbodyId=1&year=2024
     */
    @GetMapping("/localbody/party")
    public List<LocalbodyPartyVotesDto> partyVotesForLocalbody(
            @RequestParam("localbodyId") Long localbodyId,
            @RequestParam(defaultValue = "2024") int year
    ) {
        return boothVotesRepo.sumVotesByPartyForLocalbody(localbodyId, year);
    }


    /**
     * ALLIANCE-WISE VOTES FOR A LOCALBODY
     * UI calls:
     *  /api/admin/analysis/localbody/alliance?localbodyId=1&year=2024
     */
    @GetMapping("/localbody/alliance")
    public List<LocalbodyAllianceVotesDto> allianceVotesForLocalbody(
            @RequestParam("localbodyId") Long localbodyId,
            @RequestParam(defaultValue = "2024") int year
    ) {
        return boothVotesRepo.sumVotesByAllianceForLocalbody(localbodyId, year);
    }


    /* =====================================================
            EXISTING DETAILED RESULT ENDPOINTS
       ===================================================== */

    @GetMapping("/localbody/{localbodyId}/ls/{year}")
    public List<Object[]> getLocalbodyResults(
            @PathVariable Long localbodyId,
            @PathVariable Integer year
    ) {
        String jpql = """
            SELECT c.name, p.shortName, a.name, SUM(bv.votes)
            FROM BoothVotes bv
            JOIN bv.pollingStation ps
            JOIN bv.candidate c
            LEFT JOIN c.party p
            LEFT JOIN p.alliance a
            WHERE ps.localbody.id = :lbId AND bv.year = :year
            GROUP BY c.name, p.shortName, a.name
            ORDER BY SUM(bv.votes) DESC
            """;

        return em.createQuery(jpql, Object[].class)
                .setParameter("lbId", localbodyId)
                .setParameter("year", year)
                .getResultList();
    }

    @GetMapping("/assembly/{acId}/{year}")
    public List<Object[]> getAssemblyResults(
            @PathVariable Long acId,
            @PathVariable Integer year
    ) {
        String jpql = """
            SELECT c.name, p.shortName, a.name, SUM(bv.votes)
            FROM BoothVotes bv
            JOIN bv.pollingStation ps
            JOIN bv.candidate c
            LEFT JOIN c.party p
            LEFT JOIN p.alliance a
            WHERE ps.ac.id = :acId AND bv.year = :year
            GROUP BY c.name, p.shortName, a.name
            ORDER BY SUM(bv.votes) DESC
            """;

        return em.createQuery(jpql, Object[].class)
                .setParameter("acId", acId)
                .setParameter("year", year)
                .getResultList();
    }

    @GetMapping("/localbody/{id}/booths")
    public List<Object[]> getBoothLevelVotes(
            @PathVariable("id") Long localbodyId,
            @RequestParam(defaultValue = "2024") int year) {

        String jpql = """
        SELECT 
            ps.id,
            ps.psNumber,
            ps.psSuffix,
            ps.name,
            COALESCE(a.name, 'OTH') as allianceName,
            SUM(bv.votes)
        FROM BoothVotes bv
            JOIN bv.pollingStation ps
            JOIN bv.candidate c
            LEFT JOIN c.party p
            LEFT JOIN p.alliance a
        WHERE ps.localbody.id = :lbId
          AND bv.year = :year
        GROUP BY ps.id, ps.psNumber, ps.psSuffix, ps.name, a.name
        ORDER BY ps.psNumber ASC
        """;

        return em.createQuery(jpql, Object[].class)
                .setParameter("lbId", localbodyId)
                .setParameter("year", year)
                .getResultList();
    }

    /**
     * Unified endpoint:
     * GET /api/admin/analysis/localbody/{id}?years=2015,2020,2024
     */
    @GetMapping("/localbody/{id}")
    public LocalbodyAnalysisResponse analyzeLocalbody(@PathVariable("id") Long localbodyId,
                                                      @RequestParam(value = "years", required = false) String years) {
        log.info("Unified Localbody Analysis: id={} years={}", localbodyId, years);

        List<Integer> yearList = null;

        if (years != null && !years.isBlank()) {
            yearList = Arrays.stream(years.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Integer::valueOf)
                    .toList();
        } else {
            yearList = List.of(2015, 2020, 2025); // default years
        }

        return analysisService.analyzeLocalbody(localbodyId, yearList);
    }

    @GetMapping("/localbody/{lbId}/details")
    public Map<Integer, LocalbodyDetailYearDataDto> getDetailedResults(@PathVariable Long lbId,
                                                                       @RequestParam("years") String yearsList) {
        log.info("AnalyticsController::getDetailedResults -> " +
                "Fetching detailed results for Localbody ID: {} for years: {}", lbId, yearsList);
        List<Integer> years =
                Arrays.stream(yearsList.split(","))
                        .map(Integer::parseInt)
                        .toList();

        return analysisService.analyzeLocalbodyDetails(lbId, years);
    }
}
