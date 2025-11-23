package com.keralavotes.election.repository;

import com.keralavotes.election.entity.PollingStation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PollingStationRepository extends JpaRepository<PollingStation, Long> {
    PollingStation findByAc_AcCodeAndPsNumberAndPsSuffix(String acCode, Integer psNumber, String psSuffix);
    Optional<PollingStation> findByAcIdAndPsNumberAndPsSuffix(
            Long acId, Integer psNumber, String psSuffix
    );
}
