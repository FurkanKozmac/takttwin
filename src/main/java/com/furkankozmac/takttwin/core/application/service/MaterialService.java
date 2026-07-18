package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.event.MaterialEvent;
import com.furkankozmac.takttwin.core.application.port.MaterialPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.Material;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;

public class MaterialService {

    private final MaterialPort materialPort;
    private final ApplicationEventPublisher eventPublisher;

    public MaterialService(MaterialPort materialPort, ApplicationEventPublisher eventPublisher) {
        this.materialPort = materialPort;
        this.eventPublisher = eventPublisher;
    }

    public List<Material> getAllMaterials() {
        return materialPort.findAll();
    }

    public Material restock(Long id, Integer quantity) {
        Material material = materialPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Material with id " + id + " not found"));
        material.setStockQuantity(quantity);
        Material saved = materialPort.save(material);
        
        // Publish event for real-time inventory update
        eventPublisher.publishEvent(new MaterialEvent(saved));
        
        return saved;
    }
}
