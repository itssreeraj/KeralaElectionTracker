package com.keralavotes.election.controller;

import com.keralavotes.election.dto.AssemblyAnalysisResponseDto;
import com.keralavotes.election.dto.AssemblyOverviewResponseDto;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.service.AssemblyAnalysisService;
import com.keralavotes.election.service.AssemblyOverviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AssemblyAnalysisController {

    private final AssemblyAnalysisService assemblyAnalysisService;
    private final AssemblyConstituencyRepository assemblyRepository;
    private final AssemblyOverviewService assemblyOverviewService;

    // Admin helper to list ACs by district or LS
    @GetMapping("/admin/assemblies/by-district")
    public List<AssemblyConstituency> listByDistrict(@RequestParam Integer districtCode) {
        return assemblyRepository.findByDistrict_DistrictCode(districtCode);
    }

    @GetMapping("/admin/assemblies/by-ls")
    public List<AssemblyConstituency> listByLs(@RequestParam String lsCode) {
        return assemblyRepository.findByLs_LsCode(lsCode);
    }

    @GetMapping("/admin/assembly/by-ac-code")
    public AssemblyConstituency findByAcCode(@RequestParam int acCode) {
        return assemblyRepository.findByAcCode(acCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "acCode not found"));
    }


    /**
     * Analyze assembly by acCode for the included localbdy types of the assembly.
     * includeTypes - optional list of localbody types to include, e.g. "grama_panchayath,Municipality"
     */
    @GetMapping("/analysis/assembly-by-id")
    public AssemblyAnalysisResponseDto analyzeByAcCode(@RequestParam Integer acCode,
                                                       @RequestParam Integer year,
                                                       @RequestParam(required = false) String includeTypes) {
        log.info("analyzeByAcCode called with acCode={}, year={}, includeTypes={}", acCode, year, includeTypes);
        List<String> types = parseTypes(includeTypes);
        return assemblyAnalysisService.analyzeByAcCode(acCode, year, types);
    }

    @GetMapping("/analysis/assembly-overview")
    public AssemblyOverviewResponseDto assemblyOverview(
            @RequestParam int year,
            @RequestParam(required = false) Integer districtCode,
            @RequestParam(required = false) String includeTypes
    ) {
        List<String> types = parseTypes(includeTypes);

        if (districtCode != null) {
            return assemblyOverviewService.overviewByDistrict(
                    districtCode, year, types
            );
        }
        return assemblyOverviewService.overviewState(year, types);
    }

    @GetMapping("/analysis/state")
    public AssemblyAnalysisResponseDto analyzeState(
            @RequestParam int year,
            @RequestParam(required = false) String includeTypes
    ) {
        List<String> types = parseTypes(includeTypes);
        return assemblyAnalysisService.analyzeState(year, types);
    }

    @GetMapping("/analysis/district")
    public AssemblyAnalysisResponseDto analyzeDistrict(
            @RequestParam Integer districtCode,
            @RequestParam Integer year,
            @RequestParam(required = false) String includeTypes
    ) {
        List<String> types = parseTypes(includeTypes);
        return assemblyAnalysisService.analyzeByDistrict(districtCode, year, types);
    }

    private List<String> parseTypes(String includeTypes) {
        if (includeTypes == null || includeTypes.isBlank()) {
            log.info("No includeTypes provided, including all types");
            return null;
        }
        return Arrays.stream(includeTypes.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .toList();
    }
}
