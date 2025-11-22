package com.keralavotes.election.controller;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final EntityManager em;

    @GetMapping("/localbody/{localbodyId}/ls/{year}")
    public List<Object[]> getLocalbodyResults(
            @PathVariable Long localbodyId,
            @PathVariable Integer year) {

        String jpql = """
            SELECT c.name, p.shortName, a.name, SUM(bv.votes)
            FROM BoothVotes bv
            JOIN bv.pollingStation ps
            JOIN bv.candidate c
            LEFT JOIN c.party p
            LEFT JOIN p.alliance a
            WHERE ps.localbody.id = :lbId AND bv.year = :year
            GROUP BY c.name, p.shortName, a.name
            ORDER BY SUM(bv.votes) DESC
            """;

        return em.createQuery(jpql, Object[].class)
                .setParameter("lbId", localbodyId)
                .setParameter("year", year)
                .getResultList();
    }

    @GetMapping("/assembly/{acId}/{year}")
    public List<Object[]> getAssemblyResults(
            @PathVariable Long acId,
            @PathVariable Integer year) {

        String jpql = """
            SELECT c.name, p.shortName, a.name, SUM(bv.votes)
            FROM BoothVotes bv
            JOIN bv.pollingStation ps
            JOIN bv.candidate c
            LEFT JOIN c.party p
            LEFT JOIN p.alliance a
            WHERE ps.ac.id = :acId AND bv.year = :year
            GROUP BY c.name, p.shortName, a.name
            ORDER BY SUM(bv.votes) DESC
            """;

        return em.createQuery(jpql, Object[].class)
                .setParameter("acId", acId)
                .setParameter("year", year)
                .getResultList();
    }
}
