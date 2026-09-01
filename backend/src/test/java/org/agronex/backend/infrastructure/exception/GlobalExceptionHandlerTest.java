package org.agronex.backend.infrastructure.exception;

import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("handleEntityNotFound - Retorna 404 NOT FOUND con ProblemDetail")
    void handleEntityNotFound_retorna404() {
        EntityNotFoundException ex = new EntityNotFoundException("Campo no encontrado");
        ProblemDetail pd = handler.handleEntityNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND.value(), pd.getStatus());
        assertEquals("Campo no encontrado", pd.getDetail());
    }

    @Test
    @DisplayName("handleAccessDenied - Retorna 403 FORBIDDEN")
    void handleAccessDenied_retorna403() {
        AccessDeniedException ex = new AccessDeniedException("No tiene permisos");
        ProblemDetail pd = handler.handleAccessDenied(ex);

        assertEquals(HttpStatus.FORBIDDEN.value(), pd.getStatus());
        assertEquals("No tiene permisos", pd.getDetail());
    }

    @Test
    @DisplayName("handleIllegalArgument - Retorna 400 BAD REQUEST")
    void handleIllegalArgument_retorna400() {
        IllegalArgumentException ex = new IllegalArgumentException("Parámetro inválido");
        ProblemDetail pd = handler.handleIllegalArgument(ex);

        assertEquals(HttpStatus.BAD_REQUEST.value(), pd.getStatus());
        assertEquals("Parámetro inválido", pd.getDetail());
    }

    @Test
    @DisplayName("handleDataIntegrityViolation - Retorna 409 CONFLICT")
    void handleDataIntegrityViolation_retorna409() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException("Duplicate key", new RuntimeException("Email duplicado"));
        ProblemDetail pd = handler.handleDataIntegrityViolation(ex);

        assertEquals(HttpStatus.CONFLICT.value(), pd.getStatus());
        assertTrue(pd.getDetail().contains("Email duplicado"));
    }

    @Test
    @DisplayName("handleResponseStatus - Retorna status code correspondiente")
    void handleResponseStatus_retornaStatusCorrecto() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        ProblemDetail pd = handler.handleResponseStatus(ex);

        assertEquals(HttpStatus.UNAUTHORIZED.value(), pd.getStatus());
    }

    @Test
    @DisplayName("handleMessageNotReadable - Retorna 400 BAD REQUEST")
    void handleMessageNotReadable_retorna400() {
        HttpMessageNotReadableException ex = mock(HttpMessageNotReadableException.class);
        ProblemDetail pd = handler.handleMessageNotReadable(ex);

        assertEquals(HttpStatus.BAD_REQUEST.value(), pd.getStatus());
    }

    @Test
    @DisplayName("handleAllExceptions - Retorna 500 INTERNAL SERVER ERROR")
    void handleAllExceptions_retorna500() {
        Exception ex = new NullPointerException("Null reference");
        ProblemDetail pd = handler.handleAllExceptions(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), pd.getStatus());
    }

    @Test
    @DisplayName("handleValidationExceptions - Retorna 400 con mapa de errores")
    void handleValidationExceptions_retorna400ConDetalles() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "nombre", "No puede estar vacio");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        ProblemDetail pd = handler.handleValidationExceptions(ex);

        assertEquals(HttpStatus.BAD_REQUEST.value(), pd.getStatus());
        assertNotNull(pd.getProperties());
        assertTrue(pd.getProperties().containsKey("invalid_params"));
        Map<?, ?> params = (Map<?, ?>) pd.getProperties().get("invalid_params");
        assertEquals("No puede estar vacio", params.get("nombre"));
    }
}
