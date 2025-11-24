package com.keralavotes.election.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "loksabha_constituency")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoksabhaConstituency {
    @Id
    @Column(name = "ls_code")
    private Integer lsCode;

    @Column(nullable = false)
    private String name;

    private String state;
}
