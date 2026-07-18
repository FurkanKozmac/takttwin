package com.furkankozmac.takttwin.core.domain.exception;

public class MaterialOutOfStockException extends RuntimeException {
    public MaterialOutOfStockException(String message) {
        super(message);
    }
}
