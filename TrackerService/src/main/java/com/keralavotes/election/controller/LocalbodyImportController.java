package com.keralavotes.election.controller;

import com.keralavotes.election.dto.LocalbodyFixReport;
import com.keralavotes.election.dto.LocalbodyImportAudit;
import com.keralavotes.election.service.CsvImportService;
import com.keralavotes.election.service.LocalbodyImportAuditService;
import com.keralavotes.election.service.LocalbodyImportFixService;
import com.keralavotes.election.service.LocalbodyMongoImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/v1/admin/import")
public class LocalbodyImportController {


    private final LocalbodyImportFixService fixService;
    private final LocalbodyMongoImportService importService;
    private final LocalbodyImportAuditService auditService;

    public LocalbodyImportController(LocalbodyImportFixService fixService,
                                     LocalbodyMongoImportService importService,
                                     LocalbodyImportAuditService auditService) {
        this.fixService = fixService;
        this.importService = importService;
        this.auditService = auditService;
    }

    @PostMapping("/localbody")
    public String importLocalbodyData() {
        importService.importAll();
        return "Localbody data import finished.";
    }

    @GetMapping("/localbody/audit")
    public ResponseEntity<LocalbodyImportAudit> auditMissing() {
        return ResponseEntity.ok(auditService.audit());
    }

    @GetMapping("/localbody/fix/missing-wards")
    public ResponseEntity<LocalbodyFixReport> fixWards() {
        return ResponseEntity.ok(fixService.fixMissingWards());
    }

    @GetMapping("/localbody/fix/missing-candidates")
    public ResponseEntity<LocalbodyFixReport> fixCandidates() {
        return ResponseEntity.ok(fixService.fixMissingCandidates());
    }

    @GetMapping("/localbody/fix/missing-results")
    public ResponseEntity<LocalbodyFixReport> fixResults() {
        return ResponseEntity.ok(fixService.fixMissingResults());
    }

}