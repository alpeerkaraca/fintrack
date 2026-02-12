package com.alpeerkaraca.fintrackserver.exception;

public class AssetAlreadyExistsException extends RuntimeException {
    public AssetAlreadyExistsException(String message) {
        super(message);
    }
}
