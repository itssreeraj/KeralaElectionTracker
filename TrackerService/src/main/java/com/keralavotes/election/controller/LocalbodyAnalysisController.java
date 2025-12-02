package com.keralavotes.election.controller;

import com.keralavotes.election.dto.LocalbodyAnalysisResponse;
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
}
