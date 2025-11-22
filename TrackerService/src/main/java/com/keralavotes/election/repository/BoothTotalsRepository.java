package com.keralavotes.election.repository;

import com.keralavotes.election.entity.BoothTotals;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoothTotalsRepository extends JpaRepository<BoothTotals, Long> {
}
