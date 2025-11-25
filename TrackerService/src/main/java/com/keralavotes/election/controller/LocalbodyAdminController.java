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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
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
    public List<Localbody> getByDistrict(@RequestParam String district) {
        return localbodyRepo.findByDistrict_NameIgnoreCase(district);
    }



    @GetMapping("/booths")
    public List<PollingStation> getBooths(@RequestParam String acCode) {
        return boothRepo.findByAc_AcCodeOrderByPsNumberAsc(acCode);
    }

    @PostMapping("/localbody")
    public ResponseEntity<?> createOrFetchLocalbody(@RequestBody CreateLocalbodyRequest req) {
        try {
            District dist = districtRepository.findByDistrictCode(req.getDistrictCode())
                    .orElseThrow(() -> new RuntimeException("District not found: " + req.getDistrictCode()));

            Optional<Localbody> existing = localbodyRepo
                    .findByNameIgnoreCaseAndTypeIgnoreCaseAndDistrict_DistrictCode(
                            req.getName(), req.getType(), req.getDistrictCode()
                    );

            Localbody lb = existing.orElseGet(() ->
                    localbodyRepo.save(
                            Localbody.builder()
                                    .name(req.getName())
                                    .type(req.getType())
                                    .district(dist)
                                    .build()
                    )
            );
            return ResponseEntity.ok(lb);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }



    @PostMapping("/localbody/{id}/map-booths")
    @Transactional
    public void mapBooths(@PathVariable Long id, @RequestBody MapBoothsRequest body) {

        Localbody lb = localbodyRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Localbody not found"));

        List<PollingStation> booths = boothRepo.findAllById(body.getBoothIds());

        booths.forEach(b -> b.setLocalbody(lb));
        boothRepo.saveAll(booths);
    }
}

