package com.keralavotes.election.repository;

import com.keralavotes.election.entity.AssemblyConstituency;
import com.keralavotes.election.entity.Ward;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WardRepository extends JpaRepository<Ward, Long> {
    List<Ward> findByLocalbody_Id(Long localbodyId);
    Optional<Ward> findByLocalbodyIdAndWardNum(Long localbodyId, Integer wardNum);

    List<Ward> findByLocalbodyId(Long id);
    List<Ward> findByAc_AcCode(Integer acCode);
    long countByAc_AcCode(Long acCode);

    List<Ward> findByLocalbody_IdAndDelimitationYear(Long localbodyId, Integer delimitationYear);

    @Modifying
    @Transactional
    @Query("UPDATE Ward w SET w.ac = :ac WHERE w.id IN :wardIds")
    void assignAssemblyToWards(@Param("ac") AssemblyConstituency ac,
                               @Param("wardIds") List<Long> wardIds);

    // Reverse lookup: wards mapped to an AC for a delimitation year
    List<Ward> findByAc_AcCodeAndDelimitationYear(Integer acCode, Integer delimitationYear);

    // Same but restrict by localbody type(s)
    List<Ward> findByAc_AcCodeAndDelimitationYearAndLocalbody_TypeIn(
            Integer acCode, Integer delimitationYear, List<String> types);

}
