package org.agronex.backend.service;

import org.agronex.backend.entity.Cotizacion;
import org.agronex.backend.repository.CotizacionRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CotizacionesServiceTest {

    @Mock
    private CotizacionRepository cotizacionRepository;

    @InjectMocks
    private CotizacionesService cotizacionesService;

    @Test
    @DisplayName("getCotizacionesGranos - Retorna datos de base de datos si existen para hoy")
    void getCotizacionesGranos_desdeBD() {
        LocalDate hoy = LocalDate.now();
        Cotizacion cot = Cotizacion.builder()
                .fecha(hoy)
                .sojaFob(BigDecimal.valueOf(450))
                .maizFob(BigDecimal.valueOf(210))
                .trigoFob(BigDecimal.valueOf(260))
                .girasolFob(BigDecimal.valueOf(380))
                .sorgoFob(BigDecimal.valueOf(190))
                .cebadaFob(BigDecimal.valueOf(200))
                .build();

        when(cotizacionRepository.findByFecha(any())).thenReturn(Optional.of(cot));
        when(cotizacionRepository.findFirstByFechaBeforeOrderByFechaDesc(any())).thenReturn(Optional.empty());

        Map<String, Object> result = cotizacionesService.getCotizacionesGranos();

        assertNotNull(result);
        assertEquals("USD", result.get("moneda"));
        assertTrue(result.containsKey("cotizaciones"));
    }

    @Test
    @DisplayName("getCotizacionesGranos - Fallback a registro histórico si falla API")
    void getCotizacionesGranos_fallbackHistorico() {
        when(cotizacionRepository.findByFecha(any())).thenReturn(Optional.empty());
        Cotizacion hist = Cotizacion.builder().fecha(LocalDate.now().minusDays(3)).sojaFob(BigDecimal.valueOf(440)).build();
        when(cotizacionRepository.findFirstByOrderByFechaDesc()).thenReturn(Optional.of(hist));

        Map<String, Object> result = cotizacionesService.getCotizacionesGranos();

        assertNotNull(result);
        assertTrue(result.containsKey("cotizaciones"));
    }
}
