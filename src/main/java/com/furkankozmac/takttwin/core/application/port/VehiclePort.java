package com.furkankozmac.takttwin.core.application.port;

import com.furkankozmac.takttwin.core.domain.model.Vehicle;
import com.furkankozmac.takttwin.core.domain.model.VehicleStatus;

import java.util.List;
import java.util.Optional;

public interface VehiclePort {
    Vehicle save(Vehicle vehicle);
    Optional<Vehicle> findBySerialNumber(String serialNumber);
    List<Vehicle> findByStatus(VehicleStatus status);
}
