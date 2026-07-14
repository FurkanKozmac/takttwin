package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.StationPort;
import com.furkankozmac.takttwin.core.application.port.WorkElementPort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.Station;
import com.furkankozmac.takttwin.core.domain.model.WorkElement;

import java.util.List;

public class StationService {
    private final StationPort stationPort;
    private final WorkElementPort workElementPort;

    public StationService(StationPort stationPort, WorkElementPort workElementPort) {
        this.stationPort = stationPort;
        this.workElementPort = workElementPort;
    }

    public Station createStation(Station station) {
        if (stationPort.findByName(station.getName()).isPresent()) {
            throw new IllegalArgumentException("Station with name " + station.getName() + " already exists");
        }

        return stationPort.save(station);
    }

    public Station getStationById(Long id) {
        return stationPort.findById(id).orElseThrow(() -> new EntityNotFoundException("Station with id " + id + " not found"));
    }

    public List<Station> getAllStations() {
        return stationPort.findAll();
    }

    public WorkElement addWorkElement(WorkElement workElement) {
        getStationById(workElement.getStationId());
        return workElementPort.save(workElement);
    }
}
