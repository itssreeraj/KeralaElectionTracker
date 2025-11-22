package com.keralavotes.election.repository;

import com.keralavotes.election.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WardRepository extends JpaRepository<Ward, Long> {
    List<Ward> findByLocalbody_Id(Long localbodyId);
}
