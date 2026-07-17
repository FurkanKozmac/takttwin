package com.furkankozmac.takttwin.infrastructure.persistence.adapter;

import com.furkankozmac.takttwin.core.application.port.ProductionOrderPort;
import com.furkankozmac.takttwin.core.domain.model.ProductionOrder;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.ProductionOrderEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.mapper.ProductionOrderMapper;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.ProductionOrderJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class ProductionOrderAdapter implements ProductionOrderPort {

    private final ProductionOrderJpaRepository repository;

    public ProductionOrderAdapter(ProductionOrderJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public ProductionOrder save(ProductionOrder order) {
        ProductionOrderEntity entity = ProductionOrderMapper.toEntity(order);
        ProductionOrderEntity saved = repository.save(entity);
        return ProductionOrderMapper.toDomain(saved);
    }

    @Override
    public Optional<ProductionOrder> findById(Long id) {
        return repository.findById(id).map(ProductionOrderMapper::toDomain);
    }

    @Override
    public Optional<ProductionOrder> findActiveOrder() {
        return repository.findByStatus(com.furkankozmac.takttwin.core.domain.model.OrderStatus.ACTIVE)
                .map(ProductionOrderMapper::toDomain);
    }

    @Override
    public List<ProductionOrder> findAll() {
        return repository.findAll().stream()
                .map(ProductionOrderMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByOrderNumber(String orderNumber) {
        return repository.existsByOrderNumber(orderNumber);
    }
}
