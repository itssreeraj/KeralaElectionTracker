package com.keralavotes.election.controller;

import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.model.PartyAllianceAdminRow;
import com.keralavotes.election.service.PartyAllianceAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PartyAllianceAdminController {

    private final PartyAllianceAdminService service;

    @GetMapping("/public/party-alliance")
    public List<PartyAllianceAdminRow> getMappings(
            @RequestParam int year,
            @RequestParam ElectionType type
    ) {
        return service.getAllMappings(year, type);
    }

    @PostMapping("/admin/party-alliance")
    public void saveMapping(
            @RequestParam Long partyId,
            @RequestParam Long allianceId,
            @RequestParam int year,
            @RequestParam ElectionType type
    ) {
        service.upsertMapping(partyId, allianceId, year, type);
    }
}