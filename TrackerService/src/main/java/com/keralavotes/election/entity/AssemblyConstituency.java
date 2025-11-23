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
    @Id
    @Column(name = "ac_code")
    private Integer acCode;

    @Column(nullable = false)
    private String name;

    // District relationship
    @ManyToOne(optional = true)
    @JoinColumn(name = "district_code")
    private District district;

    // LS is NULL until admin maps AC -> LS
    @ManyToOne()
    @JoinColumn(name = "ls_code")
    private LoksabhaConstituency ls;
}
