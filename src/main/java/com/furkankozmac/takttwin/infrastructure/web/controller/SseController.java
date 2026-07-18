package com.furkankozmac.takttwin.infrastructure.web.controller;

import com.furkankozmac.takttwin.core.application.event.AndonEvent;
import com.furkankozmac.takttwin.core.application.event.OrderEvent;
import com.furkankozmac.takttwin.core.application.event.TelemetryEvent;
import com.furkankozmac.takttwin.core.application.event.MaterialEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/sse")
public class SseController {

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 mins timeout
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((ex) -> emitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event().name("init").data("connection established"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    @EventListener
    public void handleTelemetryEvent(TelemetryEvent event) {
        broadcast("telemetry", event.getTelemetryLog());
    }

    @EventListener
    public void handleAndonEvent(AndonEvent event) {
        broadcast("andon", event.getAndonAlert());
    }

    @EventListener
    public void handleOrderEvent(OrderEvent event) {
        broadcast("order-update", event.getProductionOrder());
    }

    @EventListener
    public void handleMaterialEvent(MaterialEvent event) {
        broadcast("material-update", event.getMaterial());
    }

    private void broadcast(String eventName, Object data) {
        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
        }
    }
}
