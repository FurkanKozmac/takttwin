package com.furkankozmac.takttwin.core.application.event;

import com.furkankozmac.takttwin.core.domain.model.AndonAlert;

public class AndonEvent {
    private final AndonAlert andonAlert;

    public AndonEvent(AndonAlert andonAlert) {
        this.andonAlert = andonAlert;
    }

    public AndonAlert getAndonAlert() {
        return andonAlert;
    }
}
