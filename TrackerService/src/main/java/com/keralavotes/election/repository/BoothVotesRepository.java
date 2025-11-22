package com.keralavotes.election.repository;

import com.keralavotes.election.entity.BoothVotes;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoothVotesRepository extends JpaRepository<BoothVotes, Long> {
}
