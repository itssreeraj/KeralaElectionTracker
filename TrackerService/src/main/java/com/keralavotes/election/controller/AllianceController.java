package com.keralavotes.election.controller;

import com.keralavotes.election.dto.AllianceDto;
import com.keralavotes.election.entity.Alliance;
import com.keralavotes.election.repository.AllianceRepository;
import com.keralavotes.election.service.AllianceAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class AllianceController {

    private final AllianceAnalysisService allianceService;
    private final AllianceRepository allianceRepo;

//    @GetMapping("/alliances")
//    public List<AllianceDto> getAlliances() {
//        return allianceService.getAll();
//    }

    @GetMapping("/public/alliances")
    public List<Alliance> listAlliances() {
        return allianceRepo.findAll();
    }

    @PostMapping("/admin/alliances")
    public Alliance createAlliance(@RequestBody Alliance req) {
        Alliance a = Alliance.builder()
                .name(req.getName())
                .color(req.getColor())
                .build();
        return allianceRepo.save(a);
    }
}

