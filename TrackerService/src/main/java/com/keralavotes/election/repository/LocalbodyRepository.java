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

    @Query("""
        SELECT lb
        FROM Localbody lb
        WHERE UPPER(lb.district.name) = UPPER(:districtName)
          AND UPPER(lb.type) = UPPER(:type)
        ORDER BY lb.name
    """)
    List<Localbody> findByDistrictNameAndTypeIgnoreCase(String districtName, String type);

    Optional<Localbody> findByNameAndType(String localbodyName, String localbodyType);

    List<Localbody> findByDistrict_DistrictCodeAndTypeIgnoreCase(int district, String type);

    List<Localbody> findByDistrict_DistrictCode(int district);
}
