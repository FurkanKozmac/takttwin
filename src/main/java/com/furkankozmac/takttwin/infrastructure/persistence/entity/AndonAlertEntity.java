package com.furkankozmac.takttwin.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "andon_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AndonAlertEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long stationId;

    @Column(nullable = false)
    private Long cycleNumber;

    @Column(nullable = false)
    private Double totalCycleTime;

    @Column(nullable = false)
    private Double taktTime;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private boolean resolved;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime resolvedAt;

    @Column
    private String resolvedBy;

    @Column
    private String resolutionComment;
}
