package com.furkankozmac.takttwin.core.application.service;

import com.furkankozmac.takttwin.core.application.port.AndonAlertPort;
import com.furkankozmac.takttwin.core.application.port.StationPort;
import com.furkankozmac.takttwin.core.application.port.TelemetryLogPort;
import com.furkankozmac.takttwin.core.application.port.WorkElementPort;
import com.furkankozmac.takttwin.core.domain.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TelemetryServiceTest {

    @Mock
    private TelemetryLogPort telemetryLogPort;
    @Mock
    private StationPort stationPort;
    @Mock
    private WorkElementPort workElementPort;
    @Mock
    private AndonAlertPort andonAlertPort;
    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;
    @Mock
    private com.furkankozmac.takttwin.core.application.port.MaterialPort materialPort;

    private TelemetryService telemetryService;

    @BeforeEach
    void setUp() {
        // Servisimizi mock'lanmış portlarla (arayüzlerle) ayağa kaldırıyoruz.
        // Spring Boot ayağa kalkmadan saniyeler içinde çalışacak!
        telemetryService = new TelemetryService(telemetryLogPort, stationPort, workElementPort, andonAlertPort, eventPublisher, materialPort);
    }

    @Test
    @DisplayName("Gelen telemetri verisini kaydetmeli ve çevrim bitmediyse Andon tetiklememeli")
    void shouldSaveTelemetryAndNotTriggerAndonWhenCycleIsNotComplete() {
        // GIVEN (Hazırlık Aşaması)
        Long stationId = 1L;
        Long elementId = 1L;
        Long cycleNumber = 100L;

        Station station = Station.builder().id(stationId).name("Trim-1").taktTime(60.0).build();
        List<WorkElement> definedElements = Arrays.asList(
                WorkElement.builder().id(1L).name("İş 1").standardDuration(20.0).build(),
                WorkElement.builder().id(2L).name("İş 2").standardDuration(25.0).build()
        );

        TelemetryLog incomingLog = TelemetryLog.builder()
                .stationId(stationId)
                .workElementId(elementId)
                .actualDuration(18.0)
                .cycleNumber(cycleNumber)
                .build();

        // Altyapı portlarının taklit (mock) davranışlarını belirliyoruz
        when(stationPort.findById(stationId)).thenReturn(Optional.of(station));
        when(workElementPort.findByStationId(stationId)).thenReturn(definedElements);
        when(telemetryLogPort.save(any(TelemetryLog.class))).thenReturn(incomingLog);

        // Çevrimin bitmediğini simüle etmek için veritabanında sadece 1 log olduğunu varsayıyoruz (tanımlı iş sayısı 2)
        List<TelemetryLog> savedLogsInDb = Collections.singletonList(incomingLog);
        when(telemetryLogPort.findByCycleNumber(cycleNumber)).thenReturn(savedLogsInDb);

        // WHEN (Çalıştırma Aşaması)
        TelemetryLog result = telemetryService.submitTelemetry(incomingLog);

        // THEN (Doğrulama Aşaması)
        assertNotNull(result);
        assertEquals(18.0, result.getActualDuration());

        // Andon portunun asla tetiklenmediğini doğruluyoruz (çünkü çevrim henüz bitmedi)
        verify(andonAlertPort, never()).save(any(AndonAlert.class));
        verify(telemetryLogPort, times(1)).save(any(TelemetryLog.class));
    }

    @Test
    @DisplayName("Çevrim bittiğinde ve süre Takt Süresini aştığında otomatik ANDON ALARMI tetiklemeli")
    void shouldTriggerAndonAlertWhenCycleIsCompleteAndDurationExceedsTaktTime() {
        // GIVEN (Hazırlık Aşaması)
        Long stationId = 1L;
        Long cycleNumber = 101L;

        Station station = Station.builder().id(stationId).name("Trim-1").taktTime(60.0).build();
        List<WorkElement> definedElements = Arrays.asList(
                WorkElement.builder().id(1L).name("İş 1").standardDuration(20.0).build(),
                WorkElement.builder().id(2L).name("İş 2").standardDuration(25.0).build()
        );

        TelemetryLog log1 = TelemetryLog.builder().stationId(stationId).workElementId(1L).actualDuration(35.0).cycleNumber(cycleNumber).build();
        TelemetryLog log2 = TelemetryLog.builder().stationId(stationId).workElementId(2L).actualDuration(30.0).cycleNumber(cycleNumber).build();
        // Toplam gerçekleşen gerçek süre = 35 + 30 = 65.0 saniye (Takt süresi olan 60'ı aşıyor!)

        when(stationPort.findById(stationId)).thenReturn(Optional.of(station));
        when(workElementPort.findByStationId(stationId)).thenReturn(definedElements);
        when(telemetryLogPort.save(any(TelemetryLog.class))).thenReturn(log2);

        // Veritabanında her iki işin de logunun olduğunu simüle ediyoruz (Çevrim bitti)
        List<TelemetryLog> savedLogsInDb = Arrays.asList(log1, log2);
        when(telemetryLogPort.findByCycleNumber(cycleNumber)).thenReturn(savedLogsInDb);

        // WHEN (Çalıştırma Aşaması)
        telemetryService.submitTelemetry(log2); // 2. ve son logu göndererek çevrimi tamamlıyoruz

        // THEN (Doğrulama Aşaması)
        // AndonAlertPort.save metodunun çağrılıp çağrılmadığını ve kaydedilen alarm detaylarını yakalıyoruz (ArgumentCaptor)
        ArgumentCaptor<AndonAlert> alertCaptor = ArgumentCaptor.forClass(AndonAlert.class);
        verify(andonAlertPort, times(1)).save(alertCaptor.capture());

        AndonAlert triggeredAlert = alertCaptor.getValue();
        assertNotNull(triggeredAlert);
        assertEquals(stationId, triggeredAlert.getStationId());
        assertEquals(cycleNumber, triggeredAlert.getCycleNumber());
        assertEquals(65.0, triggeredAlert.getTotalCycleTime());
        assertEquals(60.0, triggeredAlert.getTaktTime());
        assertFalse(triggeredAlert.isResolved());
        assertTrue(triggeredAlert.getMessage().contains("ANDON UYARISI"));
    }
}