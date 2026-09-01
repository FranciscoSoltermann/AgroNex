package org.agronex.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgromonitoringServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AgromonitoringService agromonitoringService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(agromonitoringService, "objectMapper", objectMapper);
        ReflectionTestUtils.setField(agromonitoringService, "apiKey", "test-api-key");
    }

    @Test
    @DisplayName("registrarPoligono - Registra polígono exitosamente")
    void registrarPoligono_exito() {
        String geoJson = "{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[0,1],[1,1],[1,0],[0,0]]]}";
        Map<String, Object> body = Map.of("id", "poly-abc-123");

        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), any(ParameterizedTypeReference.class)))
                .thenReturn(ResponseEntity.ok(body));

        String polyId = agromonitoringService.registrarPoligono("Lote 1", geoJson);

        assertEquals("poly-abc-123", polyId);
    }

    @Test
    @DisplayName("registrarPoligono - GeoJSON nulo retorna null")
    void registrarPoligono_null_retornaNull() {
        assertNull(agromonitoringService.registrarPoligono("Lote 1", null));
    }

    @Test
    @DisplayName("fallbackRegistrarPoligono - Retorna null ordenadamente")
    void fallback_retornaNull() {
        assertNull(agromonitoringService.fallbackRegistrarPoligono("Lote", "{}", new RuntimeException("API down")));
    }
}
