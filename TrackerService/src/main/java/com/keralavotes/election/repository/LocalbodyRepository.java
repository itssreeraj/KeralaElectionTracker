package com.keralavotes.election.repository;

import com.keralavotes.election.entity.District;
import com.keralavotes.election.entity.Localbody;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LocalbodyRepository extends JpaRepository<Localbody, Long> {
    Optional<Localbody> findByNameIgnoreCaseAndTypeIgnoreCaseAndDistrict_NameIgnoreCase(
            String name,
            String type,
            String districtName
    );

    List<Localbody> findAllByDistrict(District district);
    List<Localbody> findByDistrict_NameIgnoreCase(String districtName);
}
