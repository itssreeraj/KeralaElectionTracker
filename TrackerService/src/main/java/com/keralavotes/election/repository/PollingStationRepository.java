package com.keralavotes.election.repository;

import com.keralavotes.election.entity.PollingStation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PollingStationRepository extends JpaRepository<PollingStation, Long> {
    Optional<PollingStation> findByAc_AcCodeAndPsNumberAndPsSuffix(
            Integer acCode, Integer psNumber, String psSuffix
    );
}
