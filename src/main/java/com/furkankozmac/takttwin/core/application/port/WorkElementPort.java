package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.WorkElement;

import java.util.List;

public interface WorkElementPort {
    WorkElement save(WorkElement workElement);
    List<WorkElement> findByStationId(Long stationId);
}
