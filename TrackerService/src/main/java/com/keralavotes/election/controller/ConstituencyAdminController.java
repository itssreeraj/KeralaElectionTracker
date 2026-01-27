package com.keralavotes.election.controller;

import com.keralavotes.election.dto.AssemblyMappingUpdateDto;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.District;
import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.DistrictRepository;
import com.keralavotes.election.repository.LoksabhaConstituencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class ConstituencyAdminController {

    private final AssemblyConstituencyRepository assemblyRepository;
    private final LoksabhaConstituencyRepository lsRepo;
    private final DistrictRepository districtRepo;

    // GET Districts
    @GetMapping("/public/districts")
    public List<District> getDistricts() {
        return districtRepo.findAll();
    }

    // GET assemblies
    @GetMapping("/public/assemblies")
    public List<AssemblyConstituency> getAssemblies() {
        return assemblyRepository.findAll();
    }

    // Admin helper to list ACs by district or LS
    @GetMapping("/public/assemblies/by-district")
    public List<AssemblyConstituency> listByDistrict(@RequestParam Integer districtCode) {
        return assemblyRepository.findByDistrict_DistrictCode(districtCode);
    }

    @GetMapping("/public/assemblies/by-ls")
    public List<AssemblyConstituency> listByLs(@RequestParam String lsCode) {
        return assemblyRepository.findByLs_LsCode(lsCode);
    }

    @GetMapping("/public/assembly/by-ac-code")
    public AssemblyConstituency findByAcCode(@RequestParam int acCode) {
        return assemblyRepository.findByAcCode(acCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "acCode not found"));
    }

    // GET loksabha constituencies
    @GetMapping("/public/ls")
    public List<LoksabhaConstituency> getLoksabhaConstituencies() {
        return lsRepo.findAll();
    }



    // UPDATE LS + District mapping
    @PutMapping("/admin/assemblies/{id}")
    public AssemblyConstituency updateAssemblyMapping(
            @PathVariable Long id,
            @RequestBody AssemblyMappingUpdateDto dto
    ) {
        AssemblyConstituency ac = assemblyRepository.findById(id)
                .orElseThrow();

        if (dto.getLsCode() != null) {
            var ls = lsRepo.findByLsCode(dto.getLsCode()).orElse(null);
            ac.setLs(ls);
        }

        if (dto.getDistrictCode() != null) {
            var district = districtRepo.findByDistrictCode(dto.getDistrictCode()).orElse(null);
            ac.setDistrict(district);
        }

        return assemblyRepository.save(ac);
    }
}
