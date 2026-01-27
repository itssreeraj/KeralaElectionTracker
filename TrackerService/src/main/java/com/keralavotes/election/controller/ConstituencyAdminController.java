package com.keralavotes.election.controller;

import com.keralavotes.election.dto.AssemblyMappingUpdateDto;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.District;
import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.DistrictRepository;
import com.keralavotes.election.repository.LoksabhaConstituencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ConstituencyAdminController {

    private final AssemblyConstituencyRepository acRepo;
    private final LoksabhaConstituencyRepository lsRepo;
    private final DistrictRepository districtRepo;

    // GET assemblies
    @GetMapping("/public/assemblies")
    public List<AssemblyConstituency> getAssemblies() {
        return acRepo.findAll();
    }

    // GET loksabha constituencies
    @GetMapping("/public/ls")
    public List<LoksabhaConstituency> getLoksabhaConstituencies() {
        return lsRepo.findAll();
    }

    // GET Districts
    @GetMapping("/public/districts")
    public List<District> getDistricts() {
        return districtRepo.findAll();
    }

    // UPDATE LS + District mapping
    @PutMapping("/admin/assemblies/{id}")
    public AssemblyConstituency updateAssemblyMapping(
            @PathVariable Long id,
            @RequestBody AssemblyMappingUpdateDto dto
    ) {
        AssemblyConstituency ac = acRepo.findById(id)
                .orElseThrow();

        if (dto.getLsCode() != null) {
            var ls = lsRepo.findByLsCode(dto.getLsCode()).orElse(null);
            ac.setLs(ls);
        }

        if (dto.getDistrictCode() != null) {
            var district = districtRepo.findByDistrictCode(dto.getDistrictCode()).orElse(null);
            ac.setDistrict(district);
        }

        return acRepo.save(ac);
    }
}
