package com.keralavotes.election.controller;

import com.keralavotes.election.service.CsvImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ImportController {

    private final CsvImportService csvImportService;

    @PostMapping("/booths")
    public ResponseEntity<?> importBooths(
            @RequestParam("file") MultipartFile file,
            @RequestParam("lsCode") String lsCode) {
        try {
            csvImportService.importBoothsCsv(file, lsCode);
            return ResponseEntity.ok("Booths imported");
        } catch (Exception e) {
            e.printStackTrace();
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
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/form20-totals")
    public ResponseEntity<?> importForm20Totals(@RequestParam("file") MultipartFile file) {
        try {
            csvImportService.importForm20Totals(file);
            return ResponseEntity.ok("Form 20 booth totals imported");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
