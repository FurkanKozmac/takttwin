package com.furkankozmac.takttwin.infrastructure.persistence.adapter;

import com.furkankozmac.takttwin.core.application.port.MaterialPort;
import com.furkankozmac.takttwin.core.domain.model.Material;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.MaterialEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.mapper.PersistenceMapper;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.MaterialJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class MaterialAdapter implements MaterialPort {

    private final MaterialJpaRepository repository;

    public MaterialAdapter(MaterialJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Material save(Material material) {
        MaterialEntity entity = PersistenceMapper.toEntity(material);
        MaterialEntity savedEntity = repository.save(entity);
        return PersistenceMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Material> findById(Long id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public List<Material> findAll() {
        return repository.findAll().stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }
}
