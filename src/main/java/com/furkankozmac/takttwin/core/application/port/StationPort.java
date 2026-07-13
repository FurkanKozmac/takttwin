package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.Station;

import java.util.List;
import java.util.Optional;

public interface StationPort {
    Station save (Station station);
    Optional<Station> findById(Long id);
    Optional<Station> findByName(String name);
    List<Station> findAll();
}
