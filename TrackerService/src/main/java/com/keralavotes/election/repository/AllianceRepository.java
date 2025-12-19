package com.keralavotes.election.repository;

import com.keralavotes.election.entity.Alliance;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AllianceRepository extends JpaRepository<Alliance, Long> {
    Optional<Alliance> findByName(String name);

    boolean existsByNameIgnoreCase(@NotBlank String name);
}
