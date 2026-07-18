package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.Material;

import java.util.List;
import java.util.Optional;

public interface MaterialPort {
    Material save(Material material);
    Optional<Material> findById(Long id);
    List<Material> findAll();
}
