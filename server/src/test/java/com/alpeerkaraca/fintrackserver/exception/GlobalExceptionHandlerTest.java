package com.alpeerkaraca.fintrackserver.exception;

import com.alpeerkaraca.fintrackserver.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @Mock
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        lenient().when(request.getRequestURI()).thenReturn("/api/test");
        lenient().when(request.getRemoteAddr()).thenReturn("127.0.0.1");
    }

    @Test
    void shouldHandleInvalidCredentials() {
        InvalidCredentialsException exception = new InvalidCredentialsException("Wrong password");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleInvalidCredentials(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("Invalid username or password");
    }

    @Test
    void shouldHandleInvalidRefreshToken() {
        InvalidRefreshTokenException exception = new InvalidRefreshTokenException("Token expired");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleInvalidRefreshToken(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("Invalid or expired refresh token");
    }

    @Test
    void shouldHandleEmailAlreadyExists() {
        EmailAlreadyExistsException exception = new EmailAlreadyExistsException("Email exists");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleEmailAlreadyExists(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("already registered");
    }

    @Test
    void shouldHandleTokenGeneration() {
        TokenGenerationException exception = new TokenGenerationException("Failed to generate", null);

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleTokenGeneration(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("Unable to generate authentication token");
    }

    @Test
    void shouldHandleExtraction() {
        ExtractionException exception = new ExtractionException("Extraction failed", "Invalid JWT");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleExtraction(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("Invalid request data format");
    }

    @Test
    void shouldHandleMarketDataFetch() {
        MarketDataFetchException exception = new MarketDataFetchException("API unavailable");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleMarketDataFetch(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("Unable to fetch market data");
    }

    @Test
    void shouldHandleAssetNotFound() {
        AssetNotFoundException exception = new AssetNotFoundException("Asset not found");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAssetNotFound(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).isEqualTo("Asset not found");
    }

    @Test
    void shouldHandleAssetDelete() {
        AssetDeleteException exception = new AssetDeleteException("Cannot delete asset");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAssetDelete(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).isEqualTo("Cannot delete asset");
    }

    @Test
    void shouldHandleAuthentication() {
        AuthenticationException exception = mock(AuthenticationException.class);
        when(exception.getMessage()).thenReturn("Auth failed");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAuthentication(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("Authentication required");
    }

    @Test
    void shouldHandleAccessDenied() {
        AccessDeniedException exception = new AccessDeniedException("Forbidden");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAccessDenied(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("don't have permission");
    }

    @Test
    void shouldHandleIllegalArgument() {
        IllegalArgumentException exception = new IllegalArgumentException("Invalid input");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleIllegalArgument(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).isEqualTo("Invalid input");
    }

    @Test
    void shouldHandleIllegalState() {
        IllegalStateException exception = new IllegalStateException("Invalid state");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleIllegalState(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("temporarily unavailable");
    }

    @Test
    void shouldHandleValidationErrors() {
        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        
        List<FieldError> fieldErrors = Arrays.asList(
                new FieldError("user", "email", "Email is required"),
                new FieldError("user", "password", "Password must be at least 8 characters")
        );
        
        when(exception.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(fieldErrors);

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleValidation(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("Invalid request");
        assertThat(response.getBody().getError()).contains("Email is required");
        assertThat(response.getBody().getError()).contains("Password must be at least 8 characters");
    }

    @Test
    void shouldHandleAssetAlreadyExists() {
        AssetAlreadyExistsException exception = new AssetAlreadyExistsException("Asset already in portfolio");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAssetAlreadyExists(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("already in portfolio");
    }

    @Test
    void shouldHandleUserNotFound() {
        UserNotFoundException exception = new UserNotFoundException("User not found");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleIllegalArgument(
                new IllegalArgumentException(exception.getMessage()), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
    }

    @Test
    void shouldHandleGenericException() {
        Exception exception = new Exception("Something went wrong");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGeneral(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).contains("An unexpected error occurred");
    }

    @Test
    void shouldIncludeRequestUriInErrorResponse() {
        when(request.getRequestURI()).thenReturn("/api/investments/123");
        AssetNotFoundException exception = new AssetNotFoundException("Asset not found");

        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleAssetNotFound(exception, request);

        verify(request, atLeastOnce()).getRequestURI();
    }
}
