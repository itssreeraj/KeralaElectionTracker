package com.keralavotes.election.repository;

import com.keralavotes.election.entity.AssemblyConstituency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssemblyConstituencyRepository extends JpaRepository<AssemblyConstituency, Long> {
    Optional<AssemblyConstituency> findByAcCode(int acCode);
    AssemblyConstituency findByName(String name);
    List<AssemblyConstituency> findByDistrict_DistrictCode(Integer districtCode);
    List<AssemblyConstituency> findByLs_LsCode(String lsCode);
    Optional<AssemblyConstituency> findByAcCode(Integer acCode);
}
