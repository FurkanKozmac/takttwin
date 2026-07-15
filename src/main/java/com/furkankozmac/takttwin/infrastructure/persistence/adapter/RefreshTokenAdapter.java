package com.furkankozmac.takttwin.infrastructure.persistence.adapter;

import com.furkankozmac.takttwin.core.application.port.RefreshTokenPort;
import com.furkankozmac.takttwin.core.domain.model.RefreshToken;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.RefreshTokenEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.mapper.PersistenceMapper;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.RefreshTokenJpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
public class RefreshTokenAdapter implements RefreshTokenPort {

    private final RefreshTokenJpaRepository repository;

    public RefreshTokenAdapter(RefreshTokenJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public RefreshToken save(RefreshToken refreshToken) {
        RefreshTokenEntity entity = PersistenceMapper.toEntity(refreshToken);
        RefreshTokenEntity savedEntity = repository.save(entity);
        return PersistenceMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return repository.findByToken(token).map(PersistenceMapper::toDomain);
    }

    @Override
    @Transactional
    public void deleteByUser(Long userId) {
        repository.deleteByUserId(userId);
    }
}