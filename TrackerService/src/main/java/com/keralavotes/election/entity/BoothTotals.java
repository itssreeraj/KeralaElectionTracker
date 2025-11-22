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
@Table(name = "booth_totals",
       uniqueConstraints = @UniqueConstraint(columnNames = {"ps_id", "year"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BoothTotals {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ps_id", nullable = false)
    private PollingStation pollingStation;

    @Column(nullable = false)
    private Integer totalValid;

    @Column(nullable = false)
    private Integer rejected;

    @Column(nullable = false)
    private Integer nota;

    @Column(nullable = false)
    private Integer year;
}
