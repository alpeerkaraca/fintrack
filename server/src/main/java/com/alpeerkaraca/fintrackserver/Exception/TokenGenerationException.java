package com.alpeerkaraca.fintrackserver.Exception;

public class TokenGenerationException extends RuntimeException {
    public TokenGenerationException(String message, Exception e) {
        super(message);
    }
}
