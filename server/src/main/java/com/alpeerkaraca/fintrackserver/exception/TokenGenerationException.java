package com.alpeerkaraca.fintrackserver.exception;

public class TokenGenerationException extends RuntimeException {
    public TokenGenerationException(String message, Exception e) {
        super(message);
    }
}
