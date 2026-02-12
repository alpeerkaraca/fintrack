package com.alpeerkaraca.fintrackserver.exception;

/**
 * Exception thrown when external market data cannot be fetched.
 */
public class MarketDataFetchException extends RuntimeException {
    public MarketDataFetchException(String message, Throwable cause) {
        super(message, cause);
    }

    public MarketDataFetchException(String message) {
        super(message);
    }
}
