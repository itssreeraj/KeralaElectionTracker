package com.keralavotes.election.repository;

import com.keralavotes.election.dto.MongoWardData;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MongoWardDataRepository extends MongoRepository<MongoWardData, String> {
}
