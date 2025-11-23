package com.keralavotes.election.repository;

import com.keralavotes.election.entity.District;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DistrictRepository extends JpaRepository<District, Long> {
    Optional<District> findByDistrictCode(String code);
}
