package com.keralavotes.election.repository;

import com.keralavotes.election.dto.MongoLocalbodyResult;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MongoLocalbodyResultRepository extends MongoRepository<MongoLocalbodyResult, String> {
}
