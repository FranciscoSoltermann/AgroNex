package org.agronex.backend.infrastructure.exception;

import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Manejador global de excepciones adaptado al estándar RFC 7807 (Problem Details for HTTP APIs).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 1. Errores de validación de DTOs (@Valid) -> 400 BAD REQUEST
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationExceptions(MethodArgumentNotValidException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Error de validación en los parámetros de la solicitud."
        );
        problemDetail.setTitle("Validación Fallida");
        problemDetail.setType(URI.create("https://agronex.org/errors/validation-error"));

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage()));

        problemDetail.setProperty("invalid_params", errors);
        return problemDetail;
    }

    // 2. Errores de Base de Datos (Ej: Email o CUIT duplicado) -> 409 CONFLICT
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                ex.getMostSpecificCause().getMessage()
        );
        problemDetail.setTitle("Conflicto de Integridad de Datos");
        problemDetail.setType(URI.create("https://agronex.org/errors/data-conflict"));
        return problemDetail;
    }

    // 3. Recurso no encontrado -> 404 NOT FOUND
    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail handleEntityNotFound(EntityNotFoundException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
        problemDetail.setTitle("Recurso No Encontrado");
        problemDetail.setType(URI.create("https://agronex.org/errors/not-found"));
        return problemDetail;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatus(ResponseStatusException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                ex.getStatusCode(),
                ex.getReason() != null ? ex.getReason() : ex.getMessage()
        );
        problemDetail.setTitle("Error de Respuesta HTTP");
        return problemDetail;
    }

    // 4. Errores de permisos o seguridad -> 403 FORBIDDEN
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                ex.getMessage() != null ? ex.getMessage() : "No posee los permisos necesarios para realizar esta acción."
        );
        problemDetail.setTitle("Acceso Denegado");
        problemDetail.setType(URI.create("https://agronex.org/errors/access-denied"));
        return problemDetail;
    }

    // 5. Reglas de negocio rotas -> 400 BAD REQUEST
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
        problemDetail.setTitle("Solicitud Incorrecta");
        problemDetail.setType(URI.create("https://agronex.org/errors/bad-request"));
        return problemDetail;
    }

    // 6. JSON mal formado desde el Frontend -> 400 BAD REQUEST
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleMessageNotReadable(HttpMessageNotReadableException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "El cuerpo de la solicitud JSON está mal formado o contiene tipos de datos inválidos."
        );
        problemDetail.setTitle("Formato JSON Inválido");
        problemDetail.setType(URI.create("https://agronex.org/errors/malformed-json"));
        return problemDetail;
    }

    // 7. FALLBACK: Cualquier otro error imprevisto -> 500 INTERNAL SERVER ERROR
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleAllExceptions(Exception ex) {
        log.error("Error inesperado [{}]: {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ha ocurrido un error interno inesperado en el servidor."
        );
        problemDetail.setTitle("Error Interno del Servidor");
        problemDetail.setType(URI.create("https://agronex.org/errors/internal-server-error"));
        return problemDetail;
    }
}

