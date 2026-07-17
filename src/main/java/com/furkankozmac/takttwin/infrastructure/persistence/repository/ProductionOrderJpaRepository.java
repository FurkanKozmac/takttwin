package com.furkankozmac.takttwin.infrastructure.persistence.repository;

import com.furkankozmac.takttwin.core.domain.model.OrderStatus;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.ProductionOrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductionOrderJpaRepository extends JpaRepository<ProductionOrderEntity, Long> {

    Optional<ProductionOrderEntity> findByStatus(OrderStatus status);

    boolean existsByOrderNumber(String orderNumber);
}
