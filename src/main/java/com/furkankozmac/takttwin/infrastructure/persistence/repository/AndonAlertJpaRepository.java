package com.furkankozmac.takttwin.infrastructure.persistence.repository;

import com.furkankozmac.takttwin.infrastructure.persistence.entity.AndonAlertEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AndonAlertJpaRepository extends JpaRepository<AndonAlertEntity, Long> {
    List<AndonAlertEntity> findByResolvedFalse();

    List<AndonAlertEntity> findByResolvedTrue();

    List<AndonAlertEntity> findByStationIdAndCreatedAtAfter(Long stationId, LocalDateTime startTime);

    List<AndonAlertEntity> findByCreatedAtAfter(LocalDateTime startTime);

    @Query(value = "SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (resolved_at - created_at))), 0.0) " +
                   "FROM andon_alerts " +
                   "WHERE created_at >= :startTime AND resolved = true", nativeQuery = true)
    Double calculateTotalDowntimeSeconds(@Param("startTime") LocalDateTime startTime);
}
