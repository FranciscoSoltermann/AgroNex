package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.infrastructure.config.JohnDeereConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Servicio que consume las APIs de Equipment y Machine Locations de John Deere.
 * Requiere tokens user-level (Authorization Code flow).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JohnDeereMachineService {

    private final JohnDeereAuthService authService;
    private final JohnDeereConfig config;
    private final RestClient restClient = RestClient.create();

    private static final String ACCEPT_HEADER = "application/vnd.deere.axiom.v3+json";

    /**
     * Lista las organizaciones del usuario conectado.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listOrganizations(UUID userId) {
        String token = authService.getUserAccessToken(userId);
        String url = config.getApiBaseUrl() + "/organizations";

        try {
            Map<String, Object> response = restClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", ACCEPT_HEADER)
                    .retrieve()
                    .body(Map.class);

            if (response == null) return List.of();

            // La respuesta puede venir como { "values": [...] } o lista directa
            if (response.containsKey("values")) {
                return (List<Map<String, Object>>) response.get("values");
            }

            return List.of(response);
        } catch (Exception e) {
            log.error("Error listando organizaciones JD: {}", e.getMessage());
            throw new RuntimeException("Error al obtener organizaciones de John Deere: " + e.getMessage());
        }
    }

    /**
     * Lista las máquinas de una organización.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listMachines(UUID userId, String orgId) {
        String token = authService.getUserAccessToken(userId);
        List<String> endpointsToTry = List.of(
            config.getApiBaseUrl() + "/organizations/" + orgId + "/machines",
            "https://equipmentapi.deere.com/isg/equipment",
            "https://equipmentapi.deere.com/isg/equipment?orgId=" + orgId,
            config.getApiBaseUrl() + "/organizations/" + orgId + "/equipment"
        );

        for (String url : endpointsToTry) {
            log.info(">>> Probando URL JD: {}", url);
            try {
                String rawResponse = restClient.get()
                        .uri(url)
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", ACCEPT_HEADER)
                        .retrieve()
                        .body(String.class);

                log.info(">>> Exito con {}. Respuesta RAW: {}", url, rawResponse);
                
                if (rawResponse == null || rawResponse.isBlank()) continue;

                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> response = mapper.readValue(rawResponse, Map.class);

                if (response.containsKey("values")) {
                    List<Map<String, Object>> values = (List<Map<String, Object>>) response.get("values");
                    log.info(">>> Encontrados {} equipos.", values.size());
                    return values;
                } else if (response.containsKey("elements")) {
                    List<Map<String, Object>> elements = (List<Map<String, Object>>) response.get("elements");
                    log.info(">>> Encontrados {} equipos (elements).", elements.size());
                    return elements;
                }
                
                log.info(">>> Respuesta sin 'values' ni 'elements'. Keys: {}", response.keySet());
                return List.of(response);
            } catch (Exception e) {
                log.warn(">>> Fallo al consultar {}: {}", url, e.getMessage());
            }
        }
        
        log.error("Todos los endpoints fallaron para la org {}", orgId);
        return List.of();
    }

    /**
     * Obtiene la ubicación más reciente (breadcrumbs) de una máquina.
     * Devuelve: speed, fuelLevel, heading, machineState, location, altitude.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getMachineBreadcrumbs(UUID userId, String machineId) {
        String token = authService.getUserAccessToken(userId);
        String url = config.getApiBaseUrl() + "/machines/" + machineId + "/breadcrumbs";

        try {
            Map<String, Object> response = restClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", ACCEPT_HEADER)
                    .retrieve()
                    .body(Map.class);

            if (response == null) return List.of();

            if (response.containsKey("values")) {
                return (List<Map<String, Object>>) response.get("values");
            }

            return List.of(response);
        } catch (Exception e) {
            log.error("Error obteniendo breadcrumbs para máquina {}: {}", machineId, e.getMessage());
            throw new RuntimeException("Error al obtener ubicación de la máquina: " + e.getMessage());
        }
    }

    /**
     * Obtiene el historial de ubicaciones de una máquina.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getMachineLocationHistory(UUID userId, String machineId) {
        String token = authService.getUserAccessToken(userId);
        String url = config.getApiBaseUrl() + "/machines/" + machineId + "/locationHistory";

        try {
            Map<String, Object> response = restClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", ACCEPT_HEADER)
                    .retrieve()
                    .body(Map.class);

            if (response == null) return List.of();

            if (response.containsKey("values")) {
                return (List<Map<String, Object>>) response.get("values");
            }

            return List.of(response);
        } catch (Exception e) {
            log.error("Error obteniendo historial de ubicación para máquina {}: {}", machineId, e.getMessage());
            throw new RuntimeException("Error al obtener historial de ubicación: " + e.getMessage());
        }
    }
}
