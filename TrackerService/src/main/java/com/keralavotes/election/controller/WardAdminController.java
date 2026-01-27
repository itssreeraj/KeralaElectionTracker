package com.keralavotes.election.controller;

import com.keralavotes.election.model.WardAssemblyAssignRequest;
import com.keralavotes.election.dto.WardDto;
import com.keralavotes.election.entity.Ward;
import com.keralavotes.election.repository.WardRepository;
import com.keralavotes.election.service.WardAssemblyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/wards")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WardAdminController {

    private final WardAssemblyService wardAssemblyService;
    private final WardRepository wardRepository;

    @GetMapping("/by-localbody")
    public List<Ward> listByLocalbody(
            @RequestParam Long localbodyId,
            @RequestParam Integer delimitationYear
    ) {
        return wardRepository.findByLocalbody_IdAndDelimitationYear(localbodyId, delimitationYear);
    }

    @PostMapping("/assign-assembly")
    public ResponseEntity<?> assignAssembly(@RequestBody WardAssemblyAssignRequest req) {
        if (req.getWardIds() == null || req.getWardIds().isEmpty()) {
            return ResponseEntity.badRequest().body("Ward IDs required");
        }
        if (req.getAcCode() == null) {
            return ResponseEntity.badRequest().body("AC Code required");
        }

        wardAssemblyService.assignToAssembly(req.getAcCode(), req.getWardIds());
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    /**
     * Reverse lookup: wards that are assigned to a given assembly (acCode), for a delimitation year.
     * Optional query param types=grama_panchayath,Municipality etc to limit to certain localbody types.
     */
    @GetMapping("/by-assembly")
    public List<WardDto> wardsByAssembly(
            @RequestParam Integer acCode,
            @RequestParam Integer delimitationYear,
            @RequestParam(required = false) String types
    ) {
        List<Ward> wards;
        if (types == null || types.isBlank()) {
            wards = wardRepository.findByAc_AcCodeAndDelimitationYear(acCode, delimitationYear);
        } else {
            List<String> typeList = Arrays.stream(types.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(String::toLowerCase)
                    .toList();
            wards = wardRepository.findByAc_AcCodeAndDelimitationYearAndLocalbody_TypeIn(
                    acCode, delimitationYear, typeList);
        }

        // convert to DTO to avoid lazy load issues or circular refs in JSON
        return wards.stream()
                .map(w -> new WardDto(
                        w.getId(),
                        w.getWardNum(),
                        w.getWardName(),
                        w.getLocalbody() != null ? w.getLocalbody().getId() : null,
                        w.getLocalbody() != null ? w.getLocalbody().getName() : null,
                        w.getLocalbody() != null ? w.getLocalbody().getType() : null,
                        w.getDelimitationYear(),
                        w.getAc() != null ? w.getAc().getAcCode() : null
                ))
                .toList();
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
