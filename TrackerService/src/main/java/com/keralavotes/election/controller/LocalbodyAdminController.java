package com.keralavotes.election.controller;

import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.District;
import com.keralavotes.election.entity.Localbody;
import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.entity.PollingStation;
import com.keralavotes.election.model.CreateLocalbodyRequest;
import com.keralavotes.election.model.MapBoothsRequest;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.DistrictRepository;
import com.keralavotes.election.repository.LocalbodyRepository;
import com.keralavotes.election.repository.LoksabhaConstituencyRepository;
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
import java.util.Map;

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

    @GetMapping("/booths")
    public List<PollingStation> getBooths(@RequestParam String acCode) {
        return boothRepo.findByAc_AcCodeOrderByPsNumberAsc(acCode);
    }

    @PostMapping("/localbody")
    public Localbody createLocalbody(@RequestBody CreateLocalbodyRequest req) {
        District district = districtRepository.findByName(req.getDistrictName())
                .orElseThrow(() -> new RuntimeException("District not found"));

        Localbody lb = Localbody.builder()
                .district(district)
                .name(req.getName())
                .type(req.getType())
                .build();
        return localbodyRepo.save(lb);
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

