package org.agronex.backend.service;

import org.agronex.backend.entity.CotizacionBcrPizarra;
import org.agronex.backend.repository.CotizacionBcrPizarraRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CotizacionesBcrPizarraServiceTest {

    @Mock
    private CotizacionBcrPizarraRepository repository;

    @InjectMocks
    private CotizacionesBcrPizarraService service;

    @Test
    @DisplayName("getCotizacionesPizarra - Retorna datos desde BD si existen")
    void getCotizacionesPizarra_desdeBD() {
        CotizacionBcrPizarra cot = CotizacionBcrPizarra.builder()
                .fecha(LocalDate.now())
                .sojaPizarra(BigDecimal.valueOf(520000))
                .maizPizarra(BigDecimal.valueOf(265000))
                .trigoPizarra(BigDecimal.valueOf(330000))
                .girasolPizarra(BigDecimal.valueOf(730000))
                .sorgoPizarra(BigDecimal.valueOf(270000))
                .build();

        when(repository.findByFecha(any())).thenReturn(Optional.of(cot));
        when(repository.findFirstByFechaBeforeOrderByFechaDesc(any())).thenReturn(Optional.empty());

        Map<String, Object> result = service.getCotizacionesPizarra();

        assertNotNull(result);
        assertEquals("ARS", result.get("moneda"));
        assertTrue(result.containsKey("cotizaciones"));
    }

    @Test
    @DisplayName("getCotizacionesPizarra - Fallback mock si la BD está vacía y falla scraping")
    void getCotizacionesPizarra_fallback() {
        when(repository.findByFecha(any())).thenReturn(Optional.empty());
        when(repository.findFirstByOrderByFechaDesc()).thenReturn(Optional.empty());

        Map<String, Object> result = service.getCotizacionesPizarra();

        assertNotNull(result);
        assertFalse((Boolean) result.get("apiConfigured"));
    }
}
