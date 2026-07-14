package com.furkankozmac.takttwin.infrastructure.persistence.adapter;

import com.furkankozmac.takttwin.core.application.port.WorkElementPort;
import com.furkankozmac.takttwin.core.domain.model.WorkElement;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.StationEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.WorkElementEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.mapper.PersistenceMapper;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.StationJpaRepository;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.WorkElementJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class WorkElementAdapter implements WorkElementPort {

    private final WorkElementJpaRepository repository;
    private final StationJpaRepository stationRepository;

    public WorkElementAdapter(WorkElementJpaRepository repository, StationJpaRepository stationRepository) {
        this.repository = repository;
        this.stationRepository = stationRepository;
    }

    @Override
    public WorkElement save(WorkElement workElement) {
        System.out.println("[DEBUG - ADAPTER] Adapter'a Gelen Station ID: " + workElement.getStationId());

        StationEntity stationEntity = stationRepository.findById(workElement.getStationId())
                .orElseThrow(() -> new IllegalArgumentException("İstasyon bulunamadı ID: " + workElement.getStationId()));

        WorkElementEntity entity = PersistenceMapper.toEntity(workElement, stationEntity);
        WorkElementEntity savedEntity = repository.save(entity);
        return PersistenceMapper.toDomain(savedEntity);
    }

    @Override
    public List<WorkElement> findByStationId(Long stationId) {
        return repository.findByStationId(stationId).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }
}