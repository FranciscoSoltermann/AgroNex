package org.agronex.backend.controller;

import org.agronex.backend.service.CotizacionesBcrPizarraService;
import org.agronex.backend.service.CotizacionesService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CotizacionesControllerTest {

    @Mock
    private CotizacionesService cotizacionesService;
    @Mock
    private CotizacionesBcrPizarraService cotizacionesBcrPizarraService;

    @InjectMocks
    private CotizacionesController cotizacionesController;

    @Test
    @DisplayName("getCotizacionesGranos - Retorna 200 OK con mapa de cotizaciones")
    void getCotizacionesGranos_exito() {
        when(cotizacionesService.getCotizacionesGranos()).thenReturn(Map.of("moneda", "USD"));

        ResponseEntity<Map<String, Object>> response = cotizacionesController.getCotizacionesGranos();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("USD", response.getBody().get("moneda"));
    }

    @Test
    @DisplayName("getCotizacionesPizarraBcr - Retorna 200 OK con precios de pizarra")
    void getCotizacionesPizarraBcr_exito() {
        when(cotizacionesBcrPizarraService.getCotizacionesPizarra()).thenReturn(Map.of("moneda", "ARS"));

        ResponseEntity<Map<String, Object>> response = cotizacionesController.getCotizacionesPizarraBcr();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ARS", response.getBody().get("moneda"));
    }
}
