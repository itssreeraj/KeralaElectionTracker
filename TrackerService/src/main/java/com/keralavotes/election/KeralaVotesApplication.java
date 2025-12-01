package com.keralavotes.election;

import jakarta.annotation.PostConstruct;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.core.MongoTemplate;

@SpringBootApplication
public class KeralaVotesApplication {

    @Autowired
    Environment env;

    @Autowired
    MongoTemplate mongoTemplate;

    public static void main(String[] args) {
        SpringApplication.run(KeralaVotesApplication.class, args);
    }

    @PostConstruct
    public void printMongoConfig() {
        System.out.println("============ MONGO DEBUG ============");
        System.out.println("spring.data.mongodb.uri       = " + env.getProperty("spring.data.mongodb.uri"));
        System.out.println("spring.data.mongodb.host      = " + env.getProperty("spring.data.mongodb.host"));
        System.out.println("spring.data.mongodb.port      = " + env.getProperty("spring.data.mongodb.port"));
        System.out.println("spring.data.mongodb.database  = " + env.getProperty("spring.data.mongodb.database"));
        System.out.println("======================================");

        System.out.println(">>> Spring is querying DB: " + mongoTemplate.getDb().getName());


    }
}