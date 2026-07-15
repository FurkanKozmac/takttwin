package com.furkankozmac.takttwin.infrastructure.persistence.adapter;

import com.furkankozmac.takttwin.core.application.port.UserPort;
import com.furkankozmac.takttwin.core.domain.model.User;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.UserEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.mapper.PersistenceMapper;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.UserJpaRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class UserAdapter implements UserPort {

    private final UserJpaRepository repository;

    public UserAdapter(UserJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public User save(User user) {
        UserEntity entity = PersistenceMapper.toEntity(user);
        UserEntity savedEntity = repository.save(entity);
        return PersistenceMapper.toDomain(savedEntity);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return repository.findByEmail(email).map(PersistenceMapper::toDomain);
    }

    @Override
    public Optional<User> findById(Long id) {
        return repository.findById(id).map(PersistenceMapper::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(email);
    }
}