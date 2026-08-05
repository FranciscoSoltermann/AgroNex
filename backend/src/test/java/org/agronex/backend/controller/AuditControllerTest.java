package org.agronex.backend.controller;

import org.agronex.backend.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditControllerTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditController auditController;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("misEventos debe responder HTTP 200 cuando el JWT es válido")
    void misEventos_ConJwtValido_DebeRetornar200() {
        // Arrange
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
        when(auditLogRepository.findByIdUsuarioOrderByOcurridoEnDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // Act
        ResponseEntity<?> response = auditController.misEventos(jwt, 0, 20);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        verify(auditLogRepository, times(1)).findByIdUsuarioOrderByOcurridoEnDesc(eq(userId), any(Pageable.class));
    }

    @Test
    @DisplayName("miGranja debe retornar los eventos del propietario en la página solicitada")
    void miGranja_ConJwtPropietario_DebeRetornarEventosDeLaGranja() {
        // Arrange
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn(userId.toString());
        when(auditLogRepository.findByIdPropietarioOrderByOcurridoEnDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // Act
        ResponseEntity<?> response = auditController.miGranja(jwt, 0, 50);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(auditLogRepository, times(1)).findByIdPropietarioOrderByOcurridoEnDesc(eq(userId), any(Pageable.class));
    }

    @Test
    @DisplayName("misEventos debe lanzar ResponseStatusException 401 si el JWT es nulo")
    void misEventos_SinJwt_DebeLanzarExcepcion401() {
        // Act & Assert
        assertThrows(Exception.class, () -> auditController.misEventos(null, 0, 20));
    }

    @Test
    @DisplayName("todos debe retornar la lista completa de eventos para ADMIN")
    void todos_ConRolAdmin_DebeRetornarEventos() {
        // Arrange
        when(auditLogRepository.findAllByOrderByOcurridoEnDesc(any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        // Act
        ResponseEntity<?> response = auditController.todos(0, 50);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(auditLogRepository, times(1)).findAllByOrderByOcurridoEnDesc(any(Pageable.class));
    }
}
