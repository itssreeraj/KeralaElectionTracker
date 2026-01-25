package com.keralavotes.election.controller;

import com.keralavotes.election.dto.PollingStationResultInsertRequest;
import com.keralavotes.election.dto.details.BoothVoteDetailsRowDto;
import com.keralavotes.election.entity.PollingStation;
import com.keralavotes.election.service.BoothResultService;
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

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PollingStationResultAdminController {

    private final BoothResultService boothResultService;

    @GetMapping("/public/boothvotes")
    public List<BoothVoteDetailsRowDto> getBoothVotes(@RequestParam Integer acCode, @RequestParam Integer year) {
        return boothResultService.getBoothResultsData(acCode, year);
    }

    @PostMapping("/admin/bulk-result")
    public ResponseEntity<String> bulkResultInsert(@RequestBody PollingStationResultInsertRequest resultInsertRequest) {
        String status = boothResultService.insertPollingStationResult(resultInsertRequest);
        return ResponseEntity.ok(status);
    }
}
