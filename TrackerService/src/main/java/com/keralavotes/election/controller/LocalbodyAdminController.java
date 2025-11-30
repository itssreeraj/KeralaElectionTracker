package com.keralavotes.election.controller;

import com.keralavotes.election.dto.LocalbodyResponse;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.District;
import com.keralavotes.election.entity.Localbody;
import com.keralavotes.election.entity.PollingStation;
import com.keralavotes.election.dto.CreateLocalbodyRequest;
import com.keralavotes.election.dto.MapBoothsRequest;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.DistrictRepository;
import com.keralavotes.election.repository.LocalbodyRepository;
import com.keralavotes.election.repository.PollingStationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class LocalbodyAdminController {

    private final LocalbodyRepository localbodyRepo;
    private final PollingStationRepository boothRepo;
    private final AssemblyConstituencyRepository acRepo;
    private final DistrictRepository districtRepository;

    @GetMapping("/districts")
    public List<District> getDistricts() {
        return districtRepository.findAll();
    }

    @GetMapping("/assemblies")
    public List<AssemblyConstituency> listAssemblies() {
        return acRepo.findAll();
    }

    @GetMapping("/localbodies")
    public List<Localbody> listLocalbodies() {
        return localbodyRepo.findAll();
    }

    @GetMapping("/localbodies/by-ac")
    public List<Localbody> listLocalbodiesByAc(@RequestParam String acCode) {
        AssemblyConstituency ac = acRepo.findByAcCode(Integer.parseInt(acCode))
                .orElseThrow(() -> new IllegalArgumentException("Unknown AC: " + acCode));

        return localbodyRepo.findAllByDistrict(ac.getDistrict());
    }

    @GetMapping("/localbodies/by-district")
    public List<Localbody> getByDistrict(@RequestParam("name") String districtName) {
        return localbodyRepo.findByDistrictNameIgnoreCase(districtName);
    }



    @GetMapping("/booths")
    public List<PollingStation> getBooths(@RequestParam String acCode) {
        return boothRepo.findByAc_AcCodeOrderByPsNumberAsc(acCode);
    }

    @PostMapping("/localbody")
    public ResponseEntity<?> createOrFetchLocalbody(@RequestBody CreateLocalbodyRequest req) {

        // --- Validate Input ---
        if (req.getDistrictCode() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "districtCode is required"));
        }
        if (req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Localbody name is required"));
        }
        if (req.getType() == null || req.getType().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Localbody type is required"));
        }

        try {
            // Fetch district
            District dist = districtRepository.findByDistrictCode(req.getDistrictCode())
                    .orElseThrow(() -> new RuntimeException(
                            "District not found: " + req.getDistrictCode()));

            // Check existing localbody
            Optional<Localbody> existing = localbodyRepo
                    .findByNameIgnoreCaseAndTypeIgnoreCaseAndDistrict_DistrictCode(
                            req.getName(), req.getType(), req.getDistrictCode()
                    );

            if (existing.isPresent()) {
                Localbody lb = existing.get();

                log.debug("Localbody already exists → ID= {}, Name= {} Type= {}, District= {}",
                        lb.getId(), lb.getName(), lb.getType(), lb.getDistrict().getName());

                return ResponseEntity.ok(Map.of(
                        "status", "EXISTS",
                        "message", "Localbody already exists",
                        "localbody", lb
                ));
            }

            // Otherwise create new
            Localbody newLb = Localbody.builder()
                    .name(req.getName())
                    .type(req.getType())
                    .district(dist)
                    .build();

            newLb = localbodyRepo.save(newLb);

            log.debug("Created Localbody → ID= {}, Name= {}, Type= {} , District= {}",
                    newLb.getId(), newLb.getName(), newLb.getType(), newLb.getDistrict().getName());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "status", "CREATED",
                    "message", "Localbody created successfully",
                    "localbody", newLb
            ));

        } catch (RuntimeException e) {
            log.error("Localbody creation failed: {}" , e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));

        } catch (Exception e) {
            log.error("Unexpected error while creating localbody: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unexpected server error", "details", e.getMessage()));
        }
    }

    @PostMapping("/localbody/{id}/map-booths")
    @Transactional
    public ResponseEntity<?> mapBooths(
            @PathVariable Long id,
            @RequestBody MapBoothsRequest body) {

        // Validate request payload
        if (body.getBoothIds() == null || body.getBoothIds().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Booth ID list cannot be empty"));
        }

        // Fetch Localbody
        Localbody lb = localbodyRepo.findById(id)
                .orElse(null);

        if (lb == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Localbody not found: " + id));
        }

        // Fetch all booths
        List<PollingStation> booths = boothRepo.findAllById(body.getBoothIds());

        if (booths.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No polling stations found for given IDs"));
        }

        // Check partial fetch (some IDs invalid)
        List<Long> foundIds = booths.stream().map(PollingStation::getId).toList();
        List<Long> missingIds = body.getBoothIds().stream()
                .filter(idX -> !foundIds.contains(idX))
                .toList();

        // Update localbody mapping
        booths.forEach(b -> b.setLocalbody(lb));
        boothRepo.saveAll(booths);

        // Logging summary
        log.debug("Mapped {} booths to local body {} (ID: {})", booths.size(), lb.getName(), lb.getId());

        if (!missingIds.isEmpty()) {
            log.warn("WARNING: Missing booth IDs: {} ", missingIds);
        }

        // Build response
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("localbodyId", lb.getId());
        response.put("localbodyName", lb.getName());
        response.put("mappedCount", booths.size());
        response.put("mappedBoothIds", foundIds);
        response.put("missingBoothIds", missingIds);

        return ResponseEntity.ok(response);
    }

}

