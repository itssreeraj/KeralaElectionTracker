package com.keralavotes.election.repository;

import com.keralavotes.election.entity.Localbody;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocalbodyRepository extends JpaRepository<Localbody, Long> {
    //List<Localbody> findByDistrict_Id(Long districtId);
}
