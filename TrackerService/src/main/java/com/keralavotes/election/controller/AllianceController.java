package com.keralavotes.election.controller;

import com.keralavotes.election.dto.AllianceDto;
import com.keralavotes.election.service.AllianceAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AllianceController {

    private final AllianceAnalysisService allianceService;

    @GetMapping("/alliances")
    public List<AllianceDto> getAlliances() {
        return allianceService.getAll();
    }
}

