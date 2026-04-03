package org.agronex.backend.service;

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

@Service
@RequiredArgsConstructor
@Slf4j
public class AgromonitoringService {

    private final RestTemplate restTemplate;

    @Value("${api.agromonitoring.key}")
    private String apiKey;

    private static final String BASE_URL = "https://api.agromonitoring.com/agro/1.0";

    // ─── Helpers ─────────────────────────────────────────────────────────────

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

    // ─── Polígonos ───────────────────────────────────────────────────────────

    /**
     * Registra un polígono en Agromonitoring POST /polygons
     */
    public String registrarPoligono(String name, String geoJson) {
        try {
            String url = BASE_URL + "/polygons?appid=" + encodeKey();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String body = String.format("{\"name\": \"%s\", \"geo_json\": %s}", name, geoJson);
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
                );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("id");
            } else {
                log.error("Error al registrar polígono en Agromonitoring: {}", response.getStatusCode());
                return null;
            }
        } catch (Exception e) {
            log.error("Excepción registrando polígono", e);
            return null;
        }
    }

    // ─── Imágenes satelitales ─────────────────────────────────────────────────

    /**
     * Busca las imágenes satelitales entre las fechas indicadas para un polyId.
     * GET /image/search?polyid=...&start=...&end=...
     */
    public List<Map<String, Object>> buscarImagenesSatelitales(String polyId, long startUnix, long endUnix) {
        try {
            String url = String.format("%s/image/search?polyid=%s&start=%d&end=%d&appid=%s",
                    BASE_URL, encodeId(polyId), startUnix, endUnix, encodeKey());

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            log.error("Error obteniendo imágenes: {}", response.getStatusCode());
            return List.of();
        } catch (Exception e) {
            log.error("Excepción buscando imágenes satelitales para polyId={}", polyId, e);
            return List.of();
        }
    }

    /**
     * Obtiene las estadísticas NDVI de las imágenes en un rango de tiempo.
     * GET /ndvi/image/search?polyid=...&start=...&end=...
     * Cada item contiene: { dt, stats: { mean, max, min, median, std } }
     */
    public List<Map<String, Object>> obtenerEstadisticasNdvi(String polyId, long startUnix, long endUnix) {
        try {
            String url = String.format("%s/ndvi/image/search?polyid=%s&start=%d&end=%d&appid=%s",
                    BASE_URL, encodeId(polyId), startUnix, endUnix, encodeKey());

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return List.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo estadísticas NDVI para polyId={}", polyId, e);
            return List.of();
        }
    }

    // ─── Clima actual ─────────────────────────────────────────────────────────

    /**
     * Obtiene el clima actual para un polígono.
     * GET /weather?polyid=...&appid=...
     * Retorna: { main: { temp, humidity }, weather: [...], wind, clouds, dt }
     */
    public Map<String, Object> obtenerClimaActual(String polyId) {
        try {
            String url = String.format("%s/weather?polyid=%s&appid=%s",
                    BASE_URL, encodeId(polyId), encodeKey());

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Map.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo clima actual para polyId={}", polyId, e);
            return Map.of();
        }
    }

    // ─── Clima histórico ──────────────────────────────────────────────────────

    /**
     * Obtiene el historial de clima para un polígono en un rango de fechas.
     * GET /weather/history?polyid=...&start=...&end=...&appid=...
     * Cada item: { dt, main: { temp_min, temp_max, humidity }, rain, snow }
     */
    public List<Map<String, Object>> obtenerClimaHistorico(String polyId, long startUnix, long endUnix) {
        try {
            String url = String.format("%s/weather/history?polyid=%s&start=%d&end=%d&appid=%s",
                    BASE_URL, encodeId(polyId), startUnix, endUnix, encodeKey());

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return List.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo clima histórico para polyId={}", polyId, e);
            return List.of();
        }
    }

    // ─── Pronóstico 8 días ────────────────────────────────────────────────────

    /**
     * Obtiene el pronóstico de hasta 8 días para un polígono.
     * GET /forecast?polyid=...&appid=...
     * Cada item: { dt, main: { temp, temp_min, temp_max }, weather: [...], rain, wind }
     */
    public List<Map<String, Object>> obtenerPronostico8Dias(String polyId) {
        try {
            String url = String.format("%s/forecast?polyid=%s&appid=%s",
                    BASE_URL, encodeId(polyId), encodeKey());

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return List.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo pronóstico para polyId={}", polyId, e);
            return List.of();
        }
    }

    // ─── Suelo ────────────────────────────────────────────────────────────────

    /**
     * Obtiene los datos actuales del suelo para un polígono.
     * GET /soil?polyid=...&appid=...
     * Retorna: { t0: temp_superficie_K, t10: temp_10cm_K, moisture: humedad_m3/m3, dt }
     */
    public Map<String, Object> obtenerSueloActual(String polyId) {
        try {
            String url = String.format("%s/soil?polyid=%s&appid=%s",
                    BASE_URL, encodeId(polyId), encodeKey());

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return Map.of();
        } catch (Exception e) {
            log.error("Excepción obteniendo datos de suelo para polyId={}", polyId, e);
            return Map.of();
        }
    }
}
