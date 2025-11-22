package com.keralavotes.election.repository;

import com.keralavotes.election.entity.Alliance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AllianceRepository extends JpaRepository<Alliance, Long> {
    Optional<Alliance> findByName(String name);
}
