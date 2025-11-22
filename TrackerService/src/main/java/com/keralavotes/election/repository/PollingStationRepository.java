package com.keralavotes.election.repository;

import com.keralavotes.election.entity.PollingStation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PollingStationRepository extends JpaRepository<PollingStation, Long> {
    PollingStation findByAc_AcCodeAndPsNumberAndPsSuffix(String acCode, Integer psNumber, String psSuffix);
}
