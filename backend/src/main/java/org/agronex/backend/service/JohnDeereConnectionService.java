package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.dto.response.JohnDeereConnectionResponse;
import org.agronex.backend.infrastructure.config.JohnDeereConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Servicio que consume la API de Connection Management de John Deere.
 * Actúa como proxy seguro: el frontend nunca habla directo con JD.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JohnDeereConnectionService {

    private final JohnDeereAuthService authService;
    private final JohnDeereConfig config;
    private final RestClient restClient = RestClient.create();

    /**
     * Lista todas las conexiones activas de la app en John Deere.
     */
    @SuppressWarnings("unchecked")
    public List<JohnDeereConnectionResponse> listConnections() {
        String token = authService.getAppAccessToken();
        String url = config.getApiBaseUrl() + "/connections";

        try {
            Map<String, Object> response = restClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/json")
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), (req, res) -> {
                        if (res.getStatusCode().value() == 401) {
                            authService.invalidateAppToken();
                        }
                        throw new RuntimeException("Error de John Deere: " + res.getStatusCode());
                    })
                    .body(Map.class);

            if (response == null) return List.of();

            // La API de JD devuelve { "connections": [...], "links": [...] }
            Object connectionsObj = response.get("connections");
            if (connectionsObj == null) {
                // Puede venir como lista directa
                if (response.containsKey("id")) {
                    // Es una sola conexión
                    return List.of(mapConnection(response));
                }
                return List.of();
            }

            List<Map<String, Object>> connections = (List<Map<String, Object>>) connectionsObj;
            List<JohnDeereConnectionResponse> result = new ArrayList<>();
            for (Map<String, Object> conn : connections) {
                result.add(mapConnection(conn));
            }
            return result;

        } catch (Exception e) {
            log.error("Error al listar conexiones de John Deere: {}", e.getMessage());
            throw new RuntimeException("Error al consultar conexiones de John Deere: " + e.getMessage());
        }
    }

    /**
     * Elimina una conexión específica por su ID.
     */
    public void deleteConnection(String connectionId) {
        String token = authService.getAppAccessToken();
        String url = config.getApiBaseUrl() + "/connections/" + connectionId;

        try {
            restClient.delete()
                    .uri(url)
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/json")
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), (req, res) -> {
                        if (res.getStatusCode().value() == 401) {
                            authService.invalidateAppToken();
                        }
                        throw new RuntimeException("Error de John Deere: " + res.getStatusCode());
                    })
                    .toBodilessEntity();

            log.info("Conexión {} eliminada de John Deere.", connectionId);
        } catch (Exception e) {
            log.error("Error al eliminar conexión {}: {}", connectionId, e.getMessage());
            throw new RuntimeException("Error al eliminar conexión de John Deere: " + e.getMessage());
        }
    }

    /**
     * Verifica si la integración con John Deere está configurada.
     */
    public boolean isConfigured() {
        return config.isEnabled();
    }

    @SuppressWarnings("unchecked")
    private JohnDeereConnectionResponse mapConnection(Map<String, Object> data) {
        return JohnDeereConnectionResponse.builder()
                .id(data.get("id") != null ? data.get("id").toString() : null)
                .orgName(data.get("orgName") != null ? data.get("orgName").toString() : null)
                .orgId(data.get("orgId") != null ? ((Number) data.get("orgId")).intValue() : null)
                .partnerOrgId(data.get("partnerOrgId") != null ? ((Number) data.get("partnerOrgId")).intValue() : null)
                .created(data.get("created") != null ? data.get("created").toString() : null)
                .permissions(data.get("permissions") != null ? (List<Integer>) data.get("permissions") : List.of())
                .build();
    }
}
