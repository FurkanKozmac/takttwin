package com.furkankozmac.takttwin.infrastructure.persistence.adapter;

import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
import com.furkankozmac.takttwin.core.domain.model.AndonAlert;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.AndonAlertEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.mapper.PersistenceMapper;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.AndonAlertJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class AndonAlertAdapter implements AndonAlertPort {

    private final AndonAlertJpaRepository repository;

    public AndonAlertAdapter(AndonAlertJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public AndonAlert save(AndonAlert alert) {
        AndonAlertEntity entity = PersistenceMapper.toEntity(alert);
        AndonAlertEntity savedEntity = repository.save(entity);
        return PersistenceMapper.toDomain(savedEntity);
    }

    @Override
    public List<AndonAlert> findActiveAlerts() {
        return repository.findByResolvedFalse().stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }
}