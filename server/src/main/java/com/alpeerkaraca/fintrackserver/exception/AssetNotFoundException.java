package com.alpeerkaraca.fintrackserver.exception;

public class AssetNotFoundException extends RuntimeException {
    public AssetNotFoundException(String message) {
        super(message);
    }
}
