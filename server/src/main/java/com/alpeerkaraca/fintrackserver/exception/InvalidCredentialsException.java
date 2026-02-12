package com.alpeerkaraca.fintrackserver.exception;

/**
 * Exception thrown when user provides invalid login credentials.
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
