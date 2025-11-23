package com.keralavotes.election.repository;

import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.PollingStation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssemblyConstituencyRepository extends JpaRepository<AssemblyConstituency, Long> {
    Optional<AssemblyConstituency> findByAcCode(int acCode);
}
