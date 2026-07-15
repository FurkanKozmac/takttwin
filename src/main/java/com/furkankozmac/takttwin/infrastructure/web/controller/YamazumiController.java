package com.furkankozmac.takttwin.infrastructure.web.controller;

import com.furkankozmac.takttwin.core.application.service.YamazumiService;
import com.furkankozmac.takttwin.core.domain.model.YamazumiItem;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stations")
public class YamazumiController {

    private final YamazumiService yamazumiService;

    public YamazumiController(YamazumiService yamazumiService) {
        this.yamazumiService = yamazumiService;
    }

    @GetMapping("/{id}/yamazumi")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEAM_LEADER')")
    public ResponseEntity<List<YamazumiItem>> getYamazumiData(@PathVariable("id") Long id) {
        List<YamazumiItem> chartData = yamazumiService.getYamazumiChartData(id);
        return ResponseEntity.ok(chartData);
    }
}