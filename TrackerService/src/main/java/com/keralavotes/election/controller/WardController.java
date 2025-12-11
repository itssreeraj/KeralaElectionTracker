package com.keralavotes.election.controller;

import com.keralavotes.election.dto.WardAssemblyAssignRequest;
import com.keralavotes.election.entity.Ward;
import com.keralavotes.election.repository.WardRepository;
import com.keralavotes.election.service.WardAssemblyService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/wards")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WardController {

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
}
