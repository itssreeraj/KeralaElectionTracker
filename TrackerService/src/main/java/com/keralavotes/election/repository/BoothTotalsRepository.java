package com.keralavotes.election.repository;

import com.keralavotes.election.entity.BoothTotals;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Set;

public interface BoothTotalsRepository extends JpaRepository<BoothTotals, Long> {
    @Query("select t.pollingStation.psNumber from BoothTotals t where t.pollingStation.ac.acCode = :acCode and t.year = :year")
    Set<Integer> findExistingTotals(int acCode, int year);
}
