package com.furkankozmac.takttwin.infrastructure.web.controller;

import com.furkankozmac.takttwin.core.application.service.AndonAlertService;
import com.furkankozmac.takttwin.core.domain.model.AndonAlert;
import com.furkankozmac.takttwin.infrastructure.web.dto.ResolveAlertRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/andon")
public class AndonAlertController {

    private final AndonAlertService andonAlertService;

    public AndonAlertController(AndonAlertService andonAlertService) {
        this.andonAlertService = andonAlertService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TEAM_LEADER', 'HSE_SPECIALIST')")
    public ResponseEntity<List<AndonAlert>> getActiveAlerts() {
        return ResponseEntity.ok(andonAlertService.getActiveAlerts());
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('TEAM_LEADER', 'HSE_SPECIALIST')")
    public ResponseEntity<AndonAlert> resolveAlert(
            @PathVariable("id") Long id,
            @Valid @RequestBody ResolveAlertRequest request,
            Authentication authentication) {

        String resolvedBy = authentication.getName();

        AndonAlert resolved = andonAlertService.resolveAlert(id, resolvedBy, request.getComment());
        return ResponseEntity.ok(resolved);
    }
}