package com.keralavotes.election.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "assembly_constituency")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AssemblyConstituency {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String acCode;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "ls_id", nullable = false)
    private LoksabhaConstituency ls;
}
