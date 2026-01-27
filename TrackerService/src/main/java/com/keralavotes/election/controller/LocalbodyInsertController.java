package com.keralavotes.election.controller;

import com.keralavotes.election.dto.BatchImportRequest;
import com.keralavotes.election.model.WardInsertRequest;
import com.keralavotes.election.model.WardResultInsertRequest;
import com.keralavotes.election.entity.Ward;
import com.keralavotes.election.service.LocalbodyInsertService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/localbody")
@RequiredArgsConstructor
public class LocalbodyInsertController {
    private final LocalbodyInsertService service;

    @PostMapping("/ward")
    public Map<String, Object> insertWard(@RequestBody WardInsertRequest req) {
        Ward w = service.insertWard(req);
        return Map.of(
                "wardId", w.getId(),
                "wardDetailsId", w.getWardDetailsId()
        );
    }

    @PostMapping("/result")
    public Map<String, Object> insertResult(@RequestBody WardResultInsertRequest req) {
        service.insertWardResult(req);
        return Map.of("status", "OK");
    }

    @PostMapping("/batch-import")
    public Map<String, Object> batchImport(@RequestBody BatchImportRequest req) {
        long inserted = service.batchImport(req);
        return Map.of(
                "status", "OK",
                "inserted", inserted
        );
    }
}
