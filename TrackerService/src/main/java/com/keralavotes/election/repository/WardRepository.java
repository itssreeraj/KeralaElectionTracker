package com.keralavotes.election.repository;

import com.keralavotes.election.dto.AssemblyMappedWardDto;
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

    List<Ward> findByLocalbodyId(Long id);

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

    Optional<Ward> findByWardDetailsId(String wardDetailsId);

    @Query("""
        select new com.keralavotes.election.dto.AssemblyMappedWardDto(
            w.id,
            w.wardNum,
            w.wardName,
            lb.id,
            lb.name,
            lb.type
        )
        from Ward w
        join w.localbody lb
        join w.ac ac
        where ac.acCode = :acCode
          and w.delimitationYear = :year
          and (:type is null or lb.type = :type)
        order by lb.type, lb.name, w.wardNum
    """)
    List<AssemblyMappedWardDto> findMappedWardsByAssembly(
            @Param("acCode") Integer acCode,
            @Param("year") Integer year,
            @Param("type") String type
    );
}
