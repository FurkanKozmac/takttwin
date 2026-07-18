package com.furkankozmac.takttwin.core.application.event;

import com.furkankozmac.takttwin.core.domain.model.Material;

public class MaterialEvent {
    private final Material material;

    public MaterialEvent(Material material) {
        this.material = material;
    }

    public Material getMaterial() {
        return material;
    }
}
