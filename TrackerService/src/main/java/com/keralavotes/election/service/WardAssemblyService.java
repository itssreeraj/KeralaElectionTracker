package com.keralavotes.election.service;

import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.WardRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WardAssemblyService {

    private final WardRepository wardRepository;
    private final AssemblyConstituencyRepository assemblyRepository;

    @Transactional
    public void assignToAssembly(Integer acCode, List<Long> wardIds) {
        AssemblyConstituency ac = assemblyRepository.findByAcCode(acCode)
                .orElseThrow(() -> new RuntimeException("Invalid AC Code: " + acCode));

        wardRepository.assignAssemblyToWards(ac, wardIds);
    }
}
