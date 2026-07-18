package com.furkankozmac.takttwin.infrastructure.persistence.adapter;

import com.furkankozmac.takttwin.core.application.port.TelemetryLogPort;
import com.furkankozmac.takttwin.core.domain.model.TelemetryLog;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.TelemetryLogEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.mapper.PersistenceMapper;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.TelemetryLogJpaRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class TelemetryLogAdapter implements TelemetryLogPort {

    private final TelemetryLogJpaRepository repository;

    public TelemetryLogAdapter(TelemetryLogJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public TelemetryLog save(TelemetryLog telemetryLog) {
        TelemetryLogEntity entity = PersistenceMapper.toEntity(telemetryLog);
        TelemetryLogEntity savedEntity = repository.save(entity);
        return PersistenceMapper.toDomain(savedEntity);
    }

    @Override
    public List<TelemetryLog> findByCycleNumber(Long cycleNumber) {
        return repository.findByCycleNumber(cycleNumber).stream()
                .map(PersistenceMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Double getAverageDurationByElementId(Long elementId) {
        Double avg = repository.getAverageDurationByElementId(elementId);
        return avg != null ? avg : 0.0 ;
    }

    @Override
    public List<Object[]> getDurationSumsByStationIdAndStartTime(Long stationId, LocalDateTime startTime) {
        return repository.getDurationSumsByStationIdAndStartTime(stationId, startTime);
    }
}