package com.furkankozmac.takttwin.infrastructure.persistence.adapter;

import com.furkankozmac.takttwin.core.application.port.VehiclePort;
import com.furkankozmac.takttwin.core.application.port.TelemetryLogPort;
import com.furkankozmac.takttwin.core.domain.model.Vehicle;
import com.furkankozmac.takttwin.core.domain.model.VehicleStatus;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.VehicleEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.mapper.PersistenceMapper;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.VehicleJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class VehicleAdapter implements VehiclePort {

    private final VehicleJpaRepository repository;
    private final TelemetryLogPort telemetryLogPort;

    public VehicleAdapter(VehicleJpaRepository repository, TelemetryLogPort telemetryLogPort) {
        this.repository = repository;
        this.telemetryLogPort = telemetryLogPort;
    }

    @Override
    public Vehicle save(Vehicle vehicle) {
        VehicleEntity entity = PersistenceMapper.toEntity(vehicle);
        VehicleEntity savedEntity = repository.save(entity);
        Vehicle domain = PersistenceMapper.toDomain(savedEntity);
        if (domain != null) {
            domain.setHistory(getHistoryForVehicle(domain.getSerialNumber()));
        }
        return domain;
    }

    @Override
    public Optional<Vehicle> findBySerialNumber(String serialNumber) {
        return repository.findBySerialNumber(serialNumber)
                .map(PersistenceMapper::toDomain)
                .map(vehicle -> {
                    vehicle.setHistory(getHistoryForVehicle(vehicle.getSerialNumber()));
                    return vehicle;
                });
    }

    @Override
    public List<Vehicle> findByStatus(VehicleStatus status) {
        return repository.findByStatus(status).stream()
                .map(PersistenceMapper::toDomain)
                .map(vehicle -> {
                    vehicle.setHistory(getHistoryForVehicle(vehicle.getSerialNumber()));
                    return vehicle;
                })
                .collect(Collectors.toList());
    }

    private List<com.furkankozmac.takttwin.core.domain.model.TelemetryLog> getHistoryForVehicle(String serialNumber) {
        try {
            Long cycleNumber = Long.parseLong(serialNumber);
            return telemetryLogPort.findByCycleNumber(cycleNumber);
        } catch (NumberFormatException e) {
            return List.of();
        }
    }
}
