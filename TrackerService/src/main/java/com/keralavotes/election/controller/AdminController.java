package com.keralavotes.election.controller;

import com.keralavotes.election.entity.LoksabhaConstituency;
import com.keralavotes.election.repository.LoksabhaConstituencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminController {

    private final LoksabhaConstituencyRepository lsRepo;

    @PostMapping("/ls")
    public ResponseEntity<String> addLsMapping(@RequestBody Map<String, Object> body) {
        String lsName = (String) body.get("lsName");
        Integer lsCode = (Integer) body.get("lsCode");

        if (lsName == null || lsCode == null) {
            return ResponseEntity.badRequest().body("Missing parameters");
        }

        LoksabhaConstituency ls = lsRepo.findByName(lsName)
                .orElseGet(LoksabhaConstituency::new);

        ls.setName(lsName);
        ls.setLsCode(lsCode);

        lsRepo.save(ls);

        return ResponseEntity.ok("Saved LS Mapping: " + lsName + " → " + lsCode);
    }

}
