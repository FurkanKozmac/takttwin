package com.furkankozmac.takttwin.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long stationId;

    @Column(nullable = false)
    private Long workElementId;

    @Column(nullable = false)
    private Double actualDuration;

    @Column(nullable = false)
    private Long cycleNumber;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
