package com.furkankozmac.takttwin.infrastructure.persistence.mapper;

import com.furkankozmac.takttwin.core.domain.model.AndonAlert;
import com.furkankozmac.takttwin.core.domain.model.Station;
import com.furkankozmac.takttwin.core.domain.model.TelemetryLog;
import com.furkankozmac.takttwin.core.domain.model.WorkElement;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.AndonAlertEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.StationEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.TelemetryLogEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.WorkElementEntity;

import java.util.stream.Collectors;

public class PersistenceMapper {

    public static Station toDomain(StationEntity entity) {
        if (entity == null) return null;

        Station station = Station.builder()
                .id(entity.getId())
                .name(entity.getName())
                .taktTime(entity.getTaktTime())
                .build();

        if (entity.getWorkElements() != null) {
            station.setWorkElements(entity.getWorkElements().stream()
                    .map(elementEntity -> toDomainSimple(elementEntity, entity.getId()))
                    .collect(Collectors.toList()));
        }
        return station;
    }

    public static StationEntity toEntity(Station domain) {
        if (domain == null) return null;
        return StationEntity.builder()
                .id(domain.getId())
                .name(domain.getName())
                .taktTime(domain.getTaktTime())
                .build();
    }

    public static WorkElement toDomain(WorkElementEntity entity) {
        if (entity == null) return null;
        return WorkElement.builder()
                .id(entity.getId())
                .name(entity.getName())
                .standardDuration(entity.getStandardDuration())
                .workType(entity.getWorkType())
                .isValueAdded(entity.isValueAdded())
                .stationId(entity.getStation() != null ? entity.getStation().getId() : null)
                .build();
    }

    private static WorkElement toDomainSimple(WorkElementEntity entity, Long stationId) {
        if (entity == null) return null;
        return WorkElement.builder()
                .id(entity.getId())
                .name(entity.getName())
                .standardDuration(entity.getStandardDuration())
                .workType(entity.getWorkType())
                .isValueAdded(entity.isValueAdded())
                .stationId(stationId)
                .build();
    }

    public static WorkElementEntity toEntity(WorkElement domain, StationEntity stationEntity) {
        if (domain == null) return null;
        return WorkElementEntity.builder()
                .id(domain.getId())
                .name(domain.getName())
                .standardDuration(domain.getStandardDuration())
                .workType(domain.getWorkType())
                .isValueAdded(domain.isValueAdded())
                .station(stationEntity)
                .build();
    }

    public static TelemetryLog toDomain(TelemetryLogEntity entity) {
        if (entity == null) return null;
        return TelemetryLog.builder()
                .id(entity.getId())
                .stationId(entity.getStationId())
                .workElementId(entity.getWorkElementId())
                .actualDuration(entity.getActualDuration())
                .cycleNumber(entity.getCycleNumber())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static TelemetryLogEntity toEntity(TelemetryLog domain) {
        if (domain == null) return null;
        return TelemetryLogEntity.builder()
                .id(domain.getId())
                .stationId(domain.getStationId())
                .workElementId(domain.getWorkElementId())
                .actualDuration(domain.getActualDuration())
                .cycleNumber(domain.getCycleNumber())
                .createdAt(domain.getCreatedAt())
                .build();
    }

    public static AndonAlert toDomain(AndonAlertEntity entity) {
        if (entity == null) return null;
        return AndonAlert.builder()
                .id(entity.getId())
                .stationId(entity.getStationId())
                .cycleNumber(entity.getCycleNumber())
                .totalCycleTime(entity.getTotalCycleTime())
                .taktTime(entity.getTaktTime())
                .message(entity.getMessage())
                .resolved(entity.isResolved())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public static AndonAlertEntity toEntity(AndonAlert domain) {
        if (domain == null) return null;
        return AndonAlertEntity.builder()
                .id(domain.getId())
                .stationId(domain.getStationId())
                .cycleNumber(domain.getCycleNumber())
                .totalCycleTime(domain.getTotalCycleTime())
                .taktTime(domain.getTaktTime())
                .message(domain.getMessage())
                .resolved(domain.isResolved())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
