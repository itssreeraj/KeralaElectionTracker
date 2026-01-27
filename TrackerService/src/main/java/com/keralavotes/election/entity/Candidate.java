package com.keralavotes.election.entity;

import com.keralavotes.election.dto.ElectionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "candidate",
        uniqueConstraints = @UniqueConstraint(columnNames = {"name", "ls_code", "ac_code", "election_year", "election_type"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "party_id", referencedColumnName = "id")
    private Party party;

    @ManyToOne @JoinColumn(name = "ls_code", referencedColumnName = "ls_code")
    private LoksabhaConstituency ls;

    @ManyToOne @JoinColumn(name = "ac_code", referencedColumnName = "ac_code")
    private AssemblyConstituency ac;

    @Column(name = "election_year", nullable = false)
    private Integer electionYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ElectionType electionType;

    @ManyToOne
    @JoinColumn(name = "alliance_id")
    private Alliance alliance;
}
