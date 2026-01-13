package com.keralavotes.election.controller;

import com.keralavotes.election.dto.BulkReassignRequest;
import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.District;
import com.keralavotes.election.entity.Localbody;
import com.keralavotes.election.entity.PollingStation;
import com.keralavotes.election.dto.BoothSummary;
import com.keralavotes.election.dto.CreateBoothRequest;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.DistrictRepository;
import com.keralavotes.election.repository.LocalbodyRepository;
import com.keralavotes.election.repository.PollingStationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminBoothController {

    private final PollingStationRepository psRepo;
    private final DistrictRepository districtRepo;
    private final AssemblyConstituencyRepository acRepo;
    private final LocalbodyRepository localbodyRepo;


    @PostMapping("/booth/create")
    public PollingStation createBooth(@RequestBody CreateBoothRequest req) {
        District district = districtRepo.findByName(req.getDistrict())
                .orElseThrow(() -> new RuntimeException("District not found"));

        AssemblyConstituency ac = acRepo.findByAcCode(Integer.parseInt(req.getAc()))
                .orElseThrow(() -> new RuntimeException("AC not found"));

        Localbody lb = localbodyRepo.findById(req.getLocalbody())
                .orElse(null);

        PollingStation ps = PollingStation.builder()
                .ac(ac)
                .ls(null)
                .localbody(lb)
                .psNumber(req.getPsNumber())
                .psSuffix(req.getPsSuffix())
                .psNumberRaw(req.getPsNumber()+ (req.getPsSuffix() !=null ? req.getPsSuffix() :""))
                .name(req.getName())
                .electionYear(req.getElectionYear())
                .build();

        return psRepo.save(ps);
    }

    @GetMapping("/booth/all")
    public List<PollingStation> listAll() {
        return psRepo.findAll();
    }

    @GetMapping("/booths/by-ac")
    public List<BoothSummary> boothsByAc(@RequestParam String ac) {
        return psRepo.findByAc_AcCodeOrderByPsNumberAsc(ac)
                .stream()
                .map(b -> new BoothSummary(
                        b.getId(),
                        b.getPsNumber(),
                        b.getPsSuffix(),
                        b.getName(),
                        b.getLocalbody() != null ? b.getLocalbody().getName() : null
                ))
                .toList();
    }

    @GetMapping("/booths")
    public List<PollingStation> getBooths(@RequestParam Integer acCode, @RequestParam Integer year) {
        return psRepo.findByAc_AcCodeAndElectionYearOrderByPsNumberAsc(acCode, year);
    }

    @PostMapping("/booth/{boothId}/reassign")
    public String reassignBooth(
            @PathVariable Long boothId,
            @RequestParam Long localbodyId,
            @RequestParam(required = false) Long wardId) {

        PollingStation ps = psRepo.findById(boothId)
                .orElseThrow(() -> new RuntimeException("Booth not found"));

        Localbody lb = localbodyRepo.findById(localbodyId)
                .orElseThrow(() -> new RuntimeException("Localbody not found"));

        ps.setLocalbody(lb);

        psRepo.save(ps);
        return "Reassigned";
    }

    @PostMapping("/booths/reassign")
    public String bulkReassign(@RequestBody BulkReassignRequest req) {

        Localbody lb = localbodyRepo.findById(req.getLocalbodyId())
                .orElseThrow(() -> new RuntimeException("Localbody not found"));

        for (Long boothId : req.getBoothIds()) {
            PollingStation ps = psRepo.findById(boothId)
                    .orElseThrow(() -> new RuntimeException("Booth not found: " + boothId));

            ps.setLocalbody(lb);
            psRepo.save(ps);
        }

        return "Bulk booth reassign complete";
    }

}
