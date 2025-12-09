package com.keralavotes.election.controller;

import com.keralavotes.election.dto.LocalbodyAnalysisResponse;
import com.keralavotes.election.dto.details.AllianceAnalysisResponse;
import com.keralavotes.election.dto.details.LocalbodyWardDetailsResponse;
import com.keralavotes.election.service.AllianceAnalysisService;
import com.keralavotes.election.service.LocalbodyElectionAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/localbody")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class LocalbodyAnalysisController {

    private final LocalbodyElectionAnalysisService analysisService;
    private final AllianceAnalysisService allianceAnalysisService;

    /**
     * Example:
     *   GET /api/localbody/123/analysis?years=2015,2020
     *   GET /api/localbody/123/analysis?years=2015,2020,2024
     *   GET /api/localbody/123/analysis          (all configured years)
     */
    @GetMapping("/{localbodyId}/analysis")
    public LocalbodyAnalysisResponse analyze(
            @PathVariable("localbodyId") Long localbodyId,
            @RequestParam(value = "years", required = false) List<Integer> years
    ) {
        return analysisService.analyzeLocalbody(localbodyId, years);
    }

    /**
     * Example:
     * GET /api/admin/analysis/alliance?district=KOTTAYAM&lbType=grama_panchayath&electionType=LOCALBODY&alliance=LDF&margin=10
     */
    @GetMapping("/analysis/alliance")
    public AllianceAnalysisResponse analyzeAlliance(
            @RequestParam int district,
            @RequestParam String type,
            @RequestParam String alliance,
            @RequestParam int year,
            @RequestParam(defaultValue = "10") int swing,
            @RequestParam(required = false) Long localbodyId
    ) {
        return allianceAnalysisService.analyze(district, type, alliance, year, swing, localbodyId);
    }

    @GetMapping("/analysis/{localbodyId}/ward-details")
    public LocalbodyWardDetailsResponse getWardDetails(
            @PathVariable Long localbodyId,
            @RequestParam int year,
            @RequestParam String alliance,
            @RequestParam(name = "swing", defaultValue = "10") int swingPercent
    ) {
        return allianceAnalysisService.getWardDetails(localbodyId, alliance, year, swingPercent);
    }
}
