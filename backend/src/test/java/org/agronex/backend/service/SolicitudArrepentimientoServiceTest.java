package org.agronex.backend.service;

import org.agronex.backend.dto.request.SolicitudArrepentimientoRequest;
import org.agronex.backend.entity.SolicitudArrepentimiento;
import org.agronex.backend.repository.SolicitudArrepentimientoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitudArrepentimientoServiceTest {

    @Mock
    private SolicitudArrepentimientoRepository repository;

    @Mock
    private NotificacionMailService mailService;

    @InjectMocks
    private SolicitudArrepentimientoService service;

    @Test
    @DisplayName("registrarSolicitud - Persiste solicitud, envía correo y retorna comprobante")
    void registrarSolicitud_exito() {
        SolicitudArrepentimientoRequest req = new SolicitudArrepentimientoRequest();
        req.setEmail("  Cliente@AgroNex.com ");
        req.setMotivo("Baja dentro de los 10 días corridos");

        when(repository.findByEmailAndEstado("cliente@agronex.com", "PENDIENTE"))
                .thenReturn(Optional.empty());

        Map<String, String> res = service.registrarSolicitud(req);

        assertNotNull(res);
        assertEquals("Solicitud registrada exitosamente", res.get("mensaje"));
        assertNotNull(res.get("comprobante"));
        assertEquals(8, res.get("comprobante").length());

        ArgumentCaptor<SolicitudArrepentimiento> captor = ArgumentCaptor.forClass(SolicitudArrepentimiento.class);
        verify(repository).save(captor.capture());
        assertEquals("cliente@agronex.com", captor.getValue().getEmail());
        assertEquals("PENDIENTE", captor.getValue().getEstado());
        assertEquals(res.get("comprobante"), captor.getValue().getCodigoComprobante());

        verify(mailService).enviarAlerta(
                eq("cliente@agronex.com"),
                eq("Comprobante de Solicitud de Arrepentimiento"),
                contains(res.get("comprobante"))
        );
    }

    @Test
    @DisplayName("registrarSolicitud - Rechaza duplicado pendiente con 409 CONFLICT")
    void registrarSolicitud_duplicado_lanzaConflict() {
        SolicitudArrepentimientoRequest req = new SolicitudArrepentimientoRequest();
        req.setEmail("cliente@agronex.com");
        req.setMotivo("Solicitud repetida");

        when(repository.findByEmailAndEstado("cliente@agronex.com", "PENDIENTE"))
                .thenReturn(Optional.of(SolicitudArrepentimiento.builder()
                        .email("cliente@agronex.com")
                        .estado("PENDIENTE")
                        .build()));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.registrarSolicitud(req)
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(repository, never()).save(any());
    }
}
