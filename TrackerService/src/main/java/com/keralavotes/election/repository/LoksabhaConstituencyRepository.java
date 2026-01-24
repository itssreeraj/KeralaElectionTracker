package com.keralavotes.election.repository;

import com.keralavotes.election.entity.LoksabhaConstituency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoksabhaConstituencyRepository extends JpaRepository<LoksabhaConstituency, Long> {
    Optional<LoksabhaConstituency> findByLsCode(int lsCode);
    Optional<LoksabhaConstituency> findByName(String name);
}
