package com.keralavotes.election.controller;

import com.keralavotes.election.service.CsvImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/v1/admin/import")
@RequiredArgsConstructor
public class ImportController {

    private final CsvImportService csvImportService;

    @PostMapping("/booths")
    public ResponseEntity<?> importBooths(
            @RequestParam("file") MultipartFile file) {
        try {
            csvImportService.importBoothsCsv(file);
            return ResponseEntity.ok("Booths imported");
        } catch (Exception e) {
            log.error("ImportController::importBooths -> Exception in import booths, {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/form20")
    public ResponseEntity<?> importForm20(
            @RequestParam("file") MultipartFile file) {
        try {
            csvImportService.importForm20Votes(file);
            return ResponseEntity.ok("Form20 votes imported");
        } catch (Exception e) {
            log.error("ImportController::importForm20 -> Exception in import form20, {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/form20-totals")
    public ResponseEntity<?> importForm20Totals(@RequestParam("file") MultipartFile file) {
        try {
            csvImportService.importForm20Totals(file);
            return ResponseEntity.ok("Form 20 booth totals imported");
        } catch (Exception ex) {
            log.error("ImportController::importForm20Totals -> Exception in import form20 totals, {}", ex.getMessage());
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/candidates")
    public ResponseEntity<String> importCandidates(@RequestParam("file") MultipartFile file) {

        try {
            String summary = csvImportService.importCandidatesCsv(file);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("ImportController::importCandidates -> Exception in import candidates, {}", e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
