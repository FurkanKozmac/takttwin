package com.furkankozmac.takttwin.infrastructure.persistence.entity;

import com.furkankozmac.takttwin.core.domain.model.WorkType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "work_elements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkElementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double standardDuration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkType workType;

    @Column(nullable = false)
    private boolean isValueAdded;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private StationEntity station;

    @Column(name = "material_id")
    private Long materialId;

    @Column(name = "material_consumption_quantity")
    private Integer materialConsumptionQuantity;
}
