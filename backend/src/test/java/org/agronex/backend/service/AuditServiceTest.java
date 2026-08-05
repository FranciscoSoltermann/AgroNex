package org.agronex.backend.service;

import org.agronex.backend.entity.AccionAudit;
import org.agronex.backend.entity.AuditLog;
import org.agronex.backend.entity.EntidadAudit;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.repository.AuditLogRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private AuditService auditService;

    @Captor
    private ArgumentCaptor<AuditLog> auditLogCaptor;

    private UUID userId;
    private UUID ownerId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Debe registrar auditoría resolviendo idPropietario cuando el usuario es Empleado")
    void registrar_Empleado_DebeResolverIdPropietario() {
        // Arrange
        Usuario usuarioEmpleado = PersonaFisica.builder()
                .idUsuario(userId)
                .idPropietario(ownerId)
                .email("empleado@agronex.com")
                .nombre("Juan")
                .apellido("Pérez")
                .dni("12345678")
                .build();

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuarioEmpleado));

        // Act
        auditService.registrar(
                userId,
                "empleado@agronex.com",
                EntidadAudit.LOTE,
                "123",
                "Lote Norte",
                AccionAudit.CREAR,
                "Creación de lote",
                "127.0.0.1"
        );

        // Assert
        verify(auditLogRepository, times(1)).save(auditLogCaptor.capture());
        AuditLog savedLog = auditLogCaptor.getValue();

        assertNotNull(savedLog);
        assertEquals(userId, savedLog.getIdUsuario());
        assertEquals(ownerId, savedLog.getIdPropietario());
        assertEquals("empleado@agronex.com", savedLog.getEmailUsuario());
        assertEquals(EntidadAudit.LOTE, savedLog.getEntidad());
        assertEquals(AccionAudit.CREAR, savedLog.getAccion());
        assertEquals("127.0.0.1", savedLog.getIpCliente());
    }

    @Test
    @DisplayName("Debe usar idUsuario como idPropietario cuando el usuario es Propietario (idPropietario es null)")
    void registrar_Propietario_DebeUsarMismoIdComoPropietario() {
        // Arrange
        Usuario usuarioPropietario = PersonaFisica.builder()
                .idUsuario(userId)
                .idPropietario(null)
                .email("propietario@agronex.com")
                .nombre("Carlos")
                .apellido("Gómez")
                .dni("87654321")
                .build();

        when(usuarioRepository.findById(userId)).thenReturn(Optional.of(usuarioPropietario));

        // Act
        auditService.registrar(
                userId,
                "propietario@agronex.com",
                EntidadAudit.CAMPO,
                "456",
                "Campo Don Pedro",
                AccionAudit.ACTUALIZAR,
                "Edición de campo"
        );

        // Assert
        verify(auditLogRepository, times(1)).save(auditLogCaptor.capture());
        AuditLog savedLog = auditLogCaptor.getValue();

        assertNotNull(savedLog);
        assertEquals(userId, savedLog.getIdUsuario());
        assertEquals(userId, savedLog.getIdPropietario());
        assertEquals(EntidadAudit.CAMPO, savedLog.getEntidad());
        assertNull(savedLog.getIpCliente());
    }

    @Test
    @DisplayName("No debe propagar excepciones si el repositorio de auditoría falla")
    void registrar_SiFallaGuardado_NoDebeLanzarExcepcion() {
        // Arrange
        when(usuarioRepository.findById(any())).thenReturn(Optional.empty());
        when(auditLogRepository.save(any())).thenThrow(new RuntimeException("Error en base de datos"));

        // Act & Assert (No debería lanzar excepción)
        assertDoesNotThrow(() -> auditService.registrar(
                userId,
                "usuario@agronex.com",
                EntidadAudit.USUARIO,
                "789",
                "Usuario Test",
                AccionAudit.ELIMINAR,
                "Eliminar usuario"
        ));
    }
}
