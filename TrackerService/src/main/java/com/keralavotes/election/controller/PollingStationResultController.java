package com.keralavotes.election.controller;

import com.keralavotes.election.dto.PollingStationResultInsertRequest;
import com.keralavotes.election.service.BoothResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PollingStationResultController {

    private final BoothResultService boothResultService;

    @PostMapping("/bulk-result")
    public ResponseEntity<String> bulkResultInsert(@RequestBody PollingStationResultInsertRequest resultInsertRequest) {
        String status = boothResultService.insertPollingStationResult(resultInsertRequest);
        return ResponseEntity.ok(status);
    }
}
