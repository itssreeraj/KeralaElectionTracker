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
@Table(name = "ward")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ward {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "localbody_id", nullable = false)
    private Localbody localbody;

    @Column(nullable = false)
    private Integer wardNum;

    private String wardName;

    @Column(name = "ward_details_id", unique = true)
    private String wardDetailsId;

    @Column(name = "delimitation_year")
    private Integer delimitationYear;

    @ManyToOne(optional = true)
    @JoinColumn(name = "ac_code", referencedColumnName = "ac_code")
    private AssemblyConstituency ac;
}
