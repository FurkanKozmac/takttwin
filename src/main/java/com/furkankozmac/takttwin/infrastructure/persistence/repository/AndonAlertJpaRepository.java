package com.furkankozmac.takttwin.infrastructure.persistence.repository;

import com.furkankozmac.takttwin.infrastructure.persistence.entity.AndonAlertEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AndonAlertJpaRepository extends JpaRepository<AndonAlertEntity, Long> {
    List<AndonAlertEntity> findByResolvedFalse();
}
