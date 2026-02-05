package com.alpeerkaraca.fintrackserver.Exception;

import lombok.Getter;

@Getter
public class ExtractionException extends RuntimeException {
    private final String details;

    public ExtractionException(String message, String details) {
        super(message);
        this.details = details;
    }

}