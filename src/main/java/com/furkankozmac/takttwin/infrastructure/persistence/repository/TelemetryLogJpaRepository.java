package com.furkankozmac.takttwin.infrastructure.persistence.repository;

import com.furkankozmac.takttwin.infrastructure.persistence.entity.TelemetryLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelemetryLogJpaRepository extends JpaRepository<TelemetryLogEntity, Long> {

    List<TelemetryLogEntity> findByCycleNumber(Long cycleNumber);

    @Query("SELECT AVG(t.actualDuration) FROM TelemetryLogEntity t WHERE t.workElementId = :elementId")
    Double getAverageDurationByElementId(@Param("elementId") Long elementId);
}
