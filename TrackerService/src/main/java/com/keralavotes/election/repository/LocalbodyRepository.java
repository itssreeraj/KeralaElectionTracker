package com.keralavotes.election.repository;

import com.keralavotes.election.entity.District;
import com.keralavotes.election.entity.Localbody;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LocalbodyRepository extends JpaRepository<Localbody, Long> {
    Optional<Localbody> findByNameIgnoreCaseAndTypeIgnoreCaseAndDistrict_DistrictCode(
            String name,
            String type,
            int districtCode
    );


    List<Localbody> findAllByDistrict(District district);
    List<Localbody> findByDistrict_NameIgnoreCase(String districtName);

    @Query("""
        select lb
        from Localbody lb
        where lower(lb.district.name) = lower(:districtName)
    """)
    List<Localbody> findByDistrictNameIgnoreCase(@Param("districtName") String districtName);
}
