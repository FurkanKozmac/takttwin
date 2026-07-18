package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.VehiclePort;
import com.furkankozmac.takttwin.core.domain.exception.EntityNotFoundException;
import com.furkankozmac.takttwin.core.domain.model.ProductionOrder;
import com.furkankozmac.takttwin.core.domain.model.Station;
import com.furkankozmac.takttwin.core.domain.model.Vehicle;
import com.furkankozmac.takttwin.core.domain.model.VehicleStatus;

import java.time.LocalDateTime;
import java.util.List;

public class VehicleService {

    private final VehiclePort vehiclePort;

    public VehicleService(VehiclePort vehiclePort) {
        this.vehiclePort = vehiclePort;
    }

    public Vehicle createVehicle(String serialNumber, ProductionOrder productionOrder, Station currentStation) {
        Vehicle vehicle = Vehicle.builder()
                .serialNumber(serialNumber)
                .productionOrder(productionOrder)
                .currentStation(currentStation)
                .status(VehicleStatus.IN_PRODUCTION)
                .createdAt(LocalDateTime.now())
                .build();
        return vehiclePort.save(vehicle);
    }

    public Vehicle updateVehicle(Vehicle vehicle) {
        return vehiclePort.save(vehicle);
    }

    public Vehicle getVehicleGenealogy(String serialNumber) {
        return vehiclePort.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle with serial number " + serialNumber + " not found"));
    }

    public List<Vehicle> getActiveVehicles() {
        return vehiclePort.findByStatus(VehicleStatus.IN_PRODUCTION);
    }
}
