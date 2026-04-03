package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
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

    /**
     * Registra un polígono en Agromonitoring POST /polygons
     *
     * @param name Nombre del lote
     * @param geoJson String geojson extraído del request
     * @return El polyid como String
     */
    public String registrarPoligono(String name, String geoJson) {
        try {
            String safeApiKey = URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
            String url = BASE_URL + "/polygons?appid=" + safeApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Armamos el body inyectando el geojson dinámico
            String body = String.format("{\"name\": \"%s\", \"geo_json\": %s}", name, geoJson);
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

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

    /**
     * Busca las imágenes entre las fechas indicadas para un polyid
     */
    public List<Map<String, Object>> buscarImagenesSatelitales(String polyId, long startUnix, long endUnix) {
        try {
                String safePolyId = URLEncoder.encode(polyId, StandardCharsets.UTF_8);
                String safeApiKey = URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
                String url = String.format("%s/image/search?polyid=%s&start=%d&end=%d&appid=%s",
                    BASE_URL, safePolyId, startUnix, endUnix, safeApiKey);

            @SuppressWarnings("rawtypes")
            ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> body = (List<Map<String, Object>>) response.getBody();
                return body;
            } else {
                log.error("Error obteniendo imágenes: {}", response.getStatusCode());
                return List.of();
            }
        } catch (Exception e) {
            log.error("Excepción buscando imágenes", e);
            return List.of();
        }
    }
}
