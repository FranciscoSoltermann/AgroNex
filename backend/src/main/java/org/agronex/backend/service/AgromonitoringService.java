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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
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

    private String encodeId(String id) {
        try {
            return URLEncoder.encode(id, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return id;
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
            return null;
        }
    }

    // ─── Imágenes satelitales ─────────────────────────────────────────────────

    /**
     * Busca las imágenes satelitales entre las fechas indicadas para un polyId.
     */
    public List<Map<String, Object>> buscarImagenesSatelitales(String polyId, long startUnix, long endUnix) {
        try {
            String url = buildUrl(String.format("/image/search?polyid=%s&start=%d&end=%d",
                    encodeId(polyId), startUnix, endUnix));

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            log.error("Error obteniendo imágenes satelitales. Status: {}", response.getStatusCode());
            return List.of();
        } catch (Exception e) {
            log.error("Excepción buscando imágenes satelitales para polyId={}", encodeId(polyId), e);
            return List.of();
        }
    }

    /**
     * Obtiene las estadísticas NDVI para un polígono en un rango de tiempo.
     */
    public List<Map<String, Object>> obtenerEstadisticasNdvi(String polyId, long startUnix, long endUnix) {
        try {
            String url = buildUrl(String.format("/ndvi/image/search?polyid=%s&start=%d&end=%d",
                    encodeId(polyId), startUnix, endUnix));

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return List.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo estadísticas NDVI para polyId={}", encodeId(polyId), e);
            return List.of();
        }
    }

    // ─── Clima actual ─────────────────────────────────────────────────────────

    /**
     * Obtiene el clima actual para un polígono.
     */
    public Map<String, Object> obtenerClimaActual(String polyId) {
        try {
            String url = buildUrl(String.format("/weather?polyid=%s", encodeId(polyId)));

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Map.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo clima actual para polyId={}", encodeId(polyId), e);
            return Map.of();
        }
    }

    // ─── Clima histórico ──────────────────────────────────────────────────────

    /**
     * Obtiene el historial de clima para un polígono en un rango de fechas.
     */
    public List<Map<String, Object>> obtenerClimaHistorico(String polyId, long startUnix, long endUnix) {
        try {
            String url = buildUrl(String.format("/weather/history?polyid=%s&start=%d&end=%d",
                    encodeId(polyId), startUnix, endUnix));

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return List.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo clima histórico para polyId={}", encodeId(polyId), e);
            return List.of();
        }
    }

    // ─── Pronóstico 8 días ────────────────────────────────────────────────────

    /**
     * Obtiene el pronóstico de hasta 8 días para un polígono.
     */
    public List<Map<String, Object>> obtenerPronostico8Dias(String polyId) {
        try {
            String url = buildUrl(String.format("/forecast?polyid=%s", encodeId(polyId)));

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return List.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo pronóstico para polyId={}", encodeId(polyId), e);
            return List.of();
        }
    }

    // ─── Suelo ────────────────────────────────────────────────────────────────

    /**
     * Obtiene los datos actuales del suelo para un polígono.
     */
    public Map<String, Object> obtenerSueloActual(String polyId) {
        try {
            String url = buildUrl(String.format("/soil?polyid=%s", encodeId(polyId)));

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Map.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo datos de suelo para polyId={}", encodeId(polyId), e);
            return Map.of();
        }
    }
}
