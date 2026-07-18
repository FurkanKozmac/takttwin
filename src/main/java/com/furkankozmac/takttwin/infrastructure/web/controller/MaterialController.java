package com.furkankozmac.takttwin.infrastructure.web.controller;

import com.furkankozmac.takttwin.core.application.service.MaterialService;
import com.furkankozmac.takttwin.core.domain.model.Material;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping
    public ResponseEntity<List<Material>> getAllMaterials() {
        return ResponseEntity.ok(materialService.getAllMaterials());
    }

    @PutMapping("/{id}/restock")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEADER')")
    public ResponseEntity<Material> restock(@PathVariable Long id,
                                            @RequestParam(required = false, defaultValue = "100") Integer quantity) {
        Material updated = materialService.restock(id, quantity);
        return ResponseEntity.ok(updated);
    }
}
