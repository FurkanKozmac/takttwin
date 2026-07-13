package com.furkankozmac.takttwin.infrastructure.persistence.repository;

import com.furkankozmac.takttwin.infrastructure.persistence.entity.WorkElementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkElementJpaRepository extends JpaRepository<WorkElementEntity, Long> {

    List<WorkElementEntity> findByStationId(Long stationId);
}
