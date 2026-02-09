package com.alpeerkaraca.fintrackserver.exception;

import lombok.Getter;

@Getter
public class ExtractionException extends RuntimeException {
    private final String details;

    public ExtractionException(String message, String details) {
        super(message);
        this.details = details;
    }

}