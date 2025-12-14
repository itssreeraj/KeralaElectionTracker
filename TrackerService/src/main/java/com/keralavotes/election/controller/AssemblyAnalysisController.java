package com.keralavotes.election.controller;

import com.keralavotes.election.dto.AssemblyAnalysisResponseDto;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.service.AssemblyAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AssemblyAnalysisController {

    private final AssemblyAnalysisService assemblyAnalysisService;
    private final AssemblyConstituencyRepository assemblyRepository;

    /**
     * Preferred: call by DB id
     */
    @GetMapping("/analysis/assembly-by-id")
    public AssemblyAnalysisResponseDto analyzeById(
            @RequestParam Integer acCode,
            @RequestParam int year
    ) {
        return assemblyAnalysisService.analyzeByAcCode(acCode, year);
    }

    /**
     * Flexible resolver (UI can pass acCode or lsCode or districtCode). This attempts to resolve and
     * returns the assembly analysis if acCode resolves to an AC. If multiple ACs exist for lsCode
     * or district, the UI must pick one and call by-id.
     */
    @GetMapping("/analysis/assembly")
    public AssemblyAnalysisResponseDto analyzeFlexible(
            @RequestParam(required = false) String acName,
            @RequestParam(required = false) String lsCode,
            @RequestParam(required = false) Integer districtCode,
            @RequestParam(required = true) Integer year
    ) {
        if (acName != null && !acName.isBlank()) {
            AssemblyConstituency ac = assemblyRepository.findByName(acName);
            if (ac == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "acCode not found");
            return assemblyAnalysisService.analyzeByAcCode(ac.getAcCode(), year);
        }

        // If lsCode or districtCode given, return error instructing UI to select exact AC (or optionally return aggregated)
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Please pass acCode or call the /admin endpoints to select an assembly id and call /analysis/assembly-by-id");
    }

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
     * Analyze assembly by acCode.
     * includeTypes - optional CSV list of localbody types to include, e.g. "grama_panchayath,Municipality"
     */
    @GetMapping("/assembly-by-id")
    public AssemblyAnalysisResponseDto analyzeByAcCode(
            @RequestParam Integer acCode,
            @RequestParam Integer year,
            @RequestParam(required = false) String includeTypes
    ) {
        List<String> types = null;
        if (includeTypes != null && !includeTypes.isBlank()) {
            types = Arrays.stream(includeTypes.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return assemblyAnalysisService.analyzeByAcCode(acCode, year, types);
    }

    @GetMapping("/analysis/state")
    public AssemblyAnalysisResponseDto analyzeState(
            @RequestParam int year,
            @RequestParam(required = false) String includeTypes
    ) {
        List<String> types = null;
        if (includeTypes != null && !includeTypes.isBlank()) {
            types = Arrays.stream(includeTypes.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return assemblyAnalysisService.analyzeState(year, types);
    }
}
