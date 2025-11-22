package com.keralavotes.election.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "booth_votes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"ps_id", "candidate_id", "year"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BoothVotes {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ps_id", nullable = false)
    private PollingStation pollingStation;

    @ManyToOne @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @Column(nullable = false)
    private Integer votes;

    @Column(nullable = false)
    private Integer year;
}
