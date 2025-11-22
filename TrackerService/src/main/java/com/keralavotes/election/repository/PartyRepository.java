package com.keralavotes.election.repository;

import com.keralavotes.election.entity.Party;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PartyRepository extends JpaRepository<Party, Long> {
    Optional<Party> findByName(String name);
}
