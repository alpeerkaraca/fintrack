package com.alpeerkaraca.fintrackserver.exception;

import com.alpeerkaraca.fintrackserver.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Global exception handler that catches exceptions across all controllers
 * and returns consistent error responses with proper HTTP status codes.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle authentication failures (invalid credentials, expired tokens, etc.)
     */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidCredentials(
            InvalidCredentialsException ex,
            HttpServletRequest request) {
        log.warn("Authentication failed for request to {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid username or password", request.getRequestURI()));
    }

    /**
     * Handle invalid refresh token exceptions
     */
    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidRefreshToken(
            InvalidRefreshTokenException ex,
            HttpServletRequest request) {
        log.warn("Invalid refresh token used from {}: {}", request.getRemoteAddr(), ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid or expired refresh token. Please login again.", request.getRequestURI()));
    }

    /**
     * Handle duplicate email registration attempts
     */
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleEmailAlreadyExists(
            EmailAlreadyExistsException ex,
            HttpServletRequest request) {
        log.warn("Registration attempt with existing email: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("This email is already registered. Please use a different email or login.", request.getRequestURI()));
    }

    /**
     * Handle JWT token generation failures
     */
    @ExceptionHandler(TokenGenerationException.class)
    public ResponseEntity<ApiResponse<Void>> handleTokenGeneration(
            TokenGenerationException ex,
            HttpServletRequest request) {
        log.error("Token generation failed for request to {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Unable to generate authentication token. Please try again.", request.getRequestURI()));
    }

    /**
     * Handle data extraction failures (e.g., JWT parsing, data conversion)
     */
    @ExceptionHandler(ExtractionException.class)
    public ResponseEntity<ApiResponse<Void>> handleExtraction(
            ExtractionException ex,
            HttpServletRequest request) {
        log.error("Data extraction failed for request to {}: {} - Details: {}",
                request.getRequestURI(), ex.getMessage(), ex.getDetails());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Invalid request data format", request.getRequestURI()));
    }

    /**
     * Handle market data fetch failures
     */
    @ExceptionHandler(MarketDataFetchException.class)
    public ResponseEntity<ApiResponse<Void>> handleMarketDataFetch(
            MarketDataFetchException ex,
            HttpServletRequest request) {
        log.error("Market data fetch failed for request to {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("Unable to fetch market data at the moment. Please try again later.", request.getRequestURI()));
    }

    /**
     * Handle request validation errors (e.g., @Valid annotations)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        log.warn("Validation failed for request to {}: {}", request.getRequestURI(), errors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Invalid request: " + errors, request.getRequestURI()));
    }

    /**
     * Handle Spring Security authentication failures
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(
            AuthenticationException ex,
            HttpServletRequest request) {
        log.warn("Authentication failed for request to {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Authentication required. Please login.", request.getRequestURI()));
    }

    /**
     * Handle Spring Security authorization failures
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {
        log.warn("Access denied for request to {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("You don't have permission to access this resource.", request.getRequestURI()));
    }

    /**
     * Handle illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {
        log.warn("Invalid argument for request to {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), request.getRequestURI()));
    }

    /**
     * Handle illegal state exceptions (e.g., JWT secret too short)
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(
            IllegalStateException ex,
            HttpServletRequest request) {
        log.error("Application state error for request to {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Service is temporarily unavailable. Please contact support.", request.getRequestURI()));
    }

    /**
     * Catch-all handler for unexpected exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(
            Exception ex,
            HttpServletRequest request) {
        log.error("Unexpected error occurred for request to {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Please try again later.", request.getRequestURI()));
    }
}
