package com.keralavotes.election.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "district")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class District {

    @Id
    @Column(name = "district_code")
    private Integer districtCode;

    @Column(nullable = false)
    private String name;
}
