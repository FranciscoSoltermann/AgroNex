package org.agronex.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Servicio de integración con Agromonitoring API.
 *
 * SEGURIDAD:
 *  - VUL-A02 CORREGIDO: la API key ya no se loguea ni aparece en trazas de URL.
 *    Se usa URLEncoder para el valor de la key pero no se loguea la URL completa.
 *  - VUL-A02 CORREGIDO: la construcción de JSON usa ObjectMapper (inyectado)
 *    en lugar de String.format, eliminando el riesgo de JSON Injection.
 *  - VUL-B04 CORREGIDO: se valida el tamaño máximo del GeoJSON antes de enviarlo.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgromonitoringService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${api.agromonitoring.key}")
    private String apiKey;

    private static final String BASE_URL = "https://api.agromonitoring.com/agro/1.0";

    /** Tamaño máximo del GeoJSON aceptado (64 KB). VUL-B04 */
    private static final int MAX_GEOJSON_BYTES = 65_536;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /** Retorna la key codificada para uso en URL sin exponerla en logs. */
    private String encodeKey() {
        try {
            return URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return apiKey;
        }
    }

    /** Construye una URL de API sin incluir la key en el log. */
    private String buildUrl(String path) {
        return BASE_URL + path + (path.contains("?") ? "&" : "?") + "appid=" + encodeKey();
    }

    // ─── Polígonos ───────────────────────────────────────────────────────────

    /**
     * Registra un polígono en Agromonitoring POST /polygons.
     * <p>
     * VUL-A02: JSON construido con ObjectMapper para evitar JSON Injection.
     * VUL-B04: tamaño del GeoJSON validado antes de enviarlo.
     */
    @CircuitBreaker(name = "externalApi", fallbackMethod = "fallbackRegistrarPoligono")
    public String registrarPoligono(String name, String geoJson) {
        // VUL-B04: validar tamaño del GeoJSON
        if (geoJson == null || geoJson.getBytes(StandardCharsets.UTF_8).length > MAX_GEOJSON_BYTES) {
            log.warn("GeoJSON rechazado: nulo o excede el límite de {} bytes.", MAX_GEOJSON_BYTES);
            return null;
        }

        try {
            String url = buildUrl("/polygons");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // VUL-A02: serialización segura con ObjectMapper en lugar de String.format
            Object geoJsonNode = objectMapper.readValue(geoJson, Object.class);
            String body = objectMapper.writeValueAsString(Map.of("name", name, "geo_json", geoJsonNode));

            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String polyId = (String) response.getBody().get("id");
                log.debug("Polígono '{}' registrado en Agromonitoring.", name);
                return polyId;
            } else {
                log.error("Error al registrar polígono en Agromonitoring. Status: {}", response.getStatusCode());
                return null;
            }
        } catch (Exception e) {
            log.error("Excepción registrando polígono '{}'", name, e);
            throw new RuntimeException("Error llamando a Agromonitoring", e); // Lanzar para que el Circuit Breaker lo intercepte
        }
    }

    /** Fallback para registrarPoligono cuando Agromonitoring falla */
    public String fallbackRegistrarPoligono(String name, String geoJson, Throwable t) {
        log.warn("CircuitBreaker ABIERTO o error al llamar a Agromonitoring. Fallback ejecutado para '{}'. Razón: {}", name, t.getMessage());
        // En producción podríamos guardar el evento en una cola para reintentos asíncronos.
        // Aquí devolvemos null para que el sistema superior maneje la falla grácilmente.
        return null;
    }
}

