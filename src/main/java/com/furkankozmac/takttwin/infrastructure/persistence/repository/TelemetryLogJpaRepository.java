package com.furkankozmac.takttwin.infrastructure.persistence.repository;

import com.furkankozmac.takttwin.infrastructure.persistence.entity.TelemetryLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TelemetryLogJpaRepository extends JpaRepository<TelemetryLogEntity, Long> {

    List<TelemetryLogEntity> findByCycleNumber(Long cycleNumber);

    @Query("SELECT AVG(t.actualDuration) FROM TelemetryLogEntity t WHERE t.workElementId = :elementId")
    Double getAverageDurationByElementId(@Param("elementId") Long elementId);

    @Query("SELECT COALESCE(SUM(t.actualDuration), 0.0), COALESCE(SUM(w.standardDuration), 0.0) " +
           "FROM TelemetryLogEntity t, WorkElementEntity w " +
           "WHERE t.workElementId = w.id " +
           "AND t.stationId = :stationId " +
           "AND t.createdAt >= :startTime")
    List<Object[]> getDurationSumsByStationIdAndStartTime(@Param("stationId") Long stationId, @Param("startTime") LocalDateTime startTime);


}
