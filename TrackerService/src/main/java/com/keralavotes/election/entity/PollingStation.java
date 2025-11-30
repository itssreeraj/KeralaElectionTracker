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
@Table(
    name = "polling_station",
    uniqueConstraints = @UniqueConstraint(columnNames = {"ac_code", "ps_number", "ps_suffix"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PollingStation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ls_code", referencedColumnName = "ls_code")
    private LoksabhaConstituency ls;

    @ManyToOne
    @JoinColumn(name = "ac_code", referencedColumnName = "ac_code", nullable = false)
    private AssemblyConstituency ac;

    @Column(nullable = false)
    private Integer psNumber;

    private String psSuffix;

    private String psNumberRaw;

    @Column(columnDefinition = "text")
    private String name;

    @ManyToOne @JoinColumn(name = "localbody_id")
    private Localbody localbody;

    @ManyToOne @JoinColumn(name = "ward_id")
    private Ward ward;
}
