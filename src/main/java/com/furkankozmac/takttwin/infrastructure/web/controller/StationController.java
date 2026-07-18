package com.furkankozmac.takttwin.infrastructure.web.controller;

import com.furkankozmac.takttwin.core.application.service.StationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.furkankozmac.takttwin.core.domain.model.Station;
import com.furkankozmac.takttwin.core.domain.model.WorkElement;
import com.furkankozmac.takttwin.infrastructure.web.dto.StationCreateRequest;
import com.furkankozmac.takttwin.infrastructure.web.dto.WorkElementCreateRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stations")
public class StationController {

    private static final Logger log = LoggerFactory.getLogger(StationController.class);

    private final StationService stationService;

    public StationController(StationService stationService) {
        this.stationService = stationService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Station> createStation(@Valid @RequestBody StationCreateRequest request) {
        Station domainStation = Station.builder()
                .name(request.getName())
                .taktTime(request.getTaktTime())
                .build();

        Station created = stationService.createStation(domainStation);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEADER', 'OPERATOR')")
    public ResponseEntity<List<Station>> getAllStations() {
        return ResponseEntity.ok(stationService.getAllStations());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEADER', 'OPERATOR')")
    public ResponseEntity<Station> getStationById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(stationService.getStationById(id));
    }

    @PostMapping("/{id}/elements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkElement> addWorkElement(
            @PathVariable("id") Long id,
            @Valid @RequestBody WorkElementCreateRequest request) {

        log.debug("URL'den Gelen ID: {}", id);

        WorkElement domainElement = WorkElement.builder()
                .name(request.getName())
                .standardDuration(request.getStandardDuration())
                .workType(request.getWorkType())
                .isValueAdded(request.isValueAdded())
                .stationId(id)
                .build();

        log.debug("Nesneye Setlenen Station ID: {}", domainElement.getStationId());

        WorkElement created = stationService.addWorkElement(domainElement);
        return ResponseEntity.ok(created);
    }
}