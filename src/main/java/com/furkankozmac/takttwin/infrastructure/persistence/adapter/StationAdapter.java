package com.furkankozmac.takttwin.infrastructure.persistence.adapter;

import com.furkankozmac.takttwin.core.application.port.StationPort;
import com.furkankozmac.takttwin.core.domain.model.Station;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.StationEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.mapper.PersistenceMapper;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.StationJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class StationAdapter implements StationPort {

    private final StationJpaRepository repository;

    public StationAdapter(StationJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Station save(Station station) {
        StationEntity entity = PersistenceMapper.toEntity(station);
        StationEntity savedEntity = repository.save(entity);
        return PersistenceMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Station> findById(Long id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<Station> findByName(String name) {
        return repository.findByName(name).map(PersistenceMapper::toDomain);
    }

    @Override
    public List<Station> findAll() {
        return repository.findAll().stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Long> findAllIds() {
        return repository.findAll().stream().map(StationEntity::getId).collect(Collectors.toList());
    }
}
