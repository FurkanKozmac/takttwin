package com.furkankozmac.takttwin.infrastructure.persistence.repository;

import com.furkankozmac.takttwin.infrastructure.persistence.entity.TelemetryLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelemetryLogJpaRepository extends JpaRepository<TelemetryLogEntity, Long> {

    List<TelemetryLogEntity> findByCycleNumber(Long cycleNumber);
}
