package org.agronex.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.infrastructure.config.JohnDeereConfig;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Servicio que consume las APIs de Equipment y Machine Locations de John Deere.
 * Requiere tokens user-level (Authorization Code flow).
 *
 * SEGURIDAD:
 *  - VUL-B02 CORREGIDO: los logs de respuesta RAW completa se redujeron a nivel
 *    DEBUG para evitar filtrar datos de ubicación, tokens o PII en entornos prod.
 *  - VUL-M05 CORREGIDO: ObjectMapper se inyecta desde el contexto de Spring en
 *    lugar de instanciarse por llamada, usando la configuración centralizada.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JohnDeereMachineService {

    private final JohnDeereAuthService authService;
    private final JohnDeereConfig config;
    private final UsuarioService usuarioService;
    private final ObjectMapper objectMapper;   // VUL-M05: inyectado, no new ObjectMapper()
    private final RestClient restClient = RestClient.create();

    private static final String ACCEPT_HEADER = "application/vnd.deere.axiom.v3+json";

    /**
     * Lista las organizaciones del usuario conectado.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listOrganizations(UUID userId) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String token = authService.getUserAccessToken(idDatos);
        String url = config.getApiBaseUrl() + "/organizations";

        log.debug("Consultando organizaciones JD para usuario {}", idDatos);

        try {
            String rawResponse = restClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", ACCEPT_HEADER)
                    .retrieve()
                    .body(String.class);

            // VUL-B02: solo DEBUG en producción, no INFO
            log.debug("Respuesta de organizaciones JD recibida ({} chars)", rawResponse != null ? rawResponse.length() : 0);

            if (rawResponse == null || rawResponse.isBlank()) return List.of();

            Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);

            if (response.containsKey("values")) {
                List<Map<String, Object>> values = (List<Map<String, Object>>) response.get("values");
                log.debug("JD: {} organizaciones encontradas.", values.size());
                return values;
            } else if (response.containsKey("elements")) {
                List<Map<String, Object>> elements = (List<Map<String, Object>>) response.get("elements");
                log.debug("JD: {} organizaciones encontradas (elements).", elements.size());
                return elements;
            }

            return List.of(response);
        } catch (Exception e) {
            log.error("Error listando organizaciones JD para usuario {}: {}", idDatos, e.getMessage());
            throw new RuntimeException("Error al obtener organizaciones de John Deere.");
        }
    }

    /**
     * Lista las máquinas de una organización.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listMachines(UUID userId, String orgId) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String token = authService.getUserAccessToken(idDatos);
        List<String> endpointsToTry = List.of(
            config.getApiBaseUrl() + "/organizations/" + orgId + "/machines",
            config.getApiBaseUrl() + "/organizations/" + orgId + "/equipment"
        );

        for (String url : endpointsToTry) {
            log.debug("Consultando equipos JD en org {}", orgId);
            try {
                String rawResponse = restClient.get()
                        .uri(url)
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", ACCEPT_HEADER)
                        .retrieve()
                        .body(String.class);

                // VUL-B02: respuesta completa solo a nivel DEBUG
                log.debug("Respuesta equipos JD recibida ({} chars)", rawResponse != null ? rawResponse.length() : 0);

                if (rawResponse == null || rawResponse.isBlank()) continue;

                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);

                if (response.containsKey("values")) {
                    List<Map<String, Object>> values = (List<Map<String, Object>>) response.get("values");
                    log.debug("JD: {} equipos encontrados.", values.size());
                    return values;
                } else if (response.containsKey("elements")) {
                    List<Map<String, Object>> elements = (List<Map<String, Object>>) response.get("elements");
                    log.debug("JD: {} equipos encontrados (elements).", elements.size());
                    return elements;
                }

                log.debug("JD: respuesta sin 'values' ni 'elements'. Keys: {}", response.keySet());
                return List.of(response);
            } catch (Exception e) {
                log.warn("Fallo al consultar equipos JD en {}: {}", url, e.getMessage());
            }
        }

        log.error("Todos los endpoints fallaron para equipos de org {}", orgId);
        return List.of();
    }

    /**
     * Obtiene la ubicación más reciente (breadcrumbs) de una máquina.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getMachineBreadcrumbs(UUID userId, String machineId) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String token = authService.getUserAccessToken(idDatos);
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
            throw new RuntimeException("Error al obtener ubicación de la máquina.");
        }
    }

    /**
     * Obtiene el historial de ubicaciones de una máquina.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getMachineLocationHistory(UUID userId, String machineId) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String token = authService.getUserAccessToken(idDatos);
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
            throw new RuntimeException("Error al obtener historial de ubicación.");
        }
    }

    /**
     * Lista los campos (fields) de una organización.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listFields(UUID userId, String orgId) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String token = authService.getUserAccessToken(idDatos);
        String url = config.getApiBaseUrl() + "/organizations/" + orgId + "/fields";

        log.debug("Consultando campos JD en org {}", orgId);
        try {
            String rawResponse = restClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", ACCEPT_HEADER)
                    .retrieve()
                    .body(String.class);

            // VUL-B02: solo DEBUG
            log.debug("Respuesta campos JD recibida ({} chars)", rawResponse != null ? rawResponse.length() : 0);

            if (rawResponse == null || rawResponse.isBlank()) return List.of();

            Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);

            if (response.containsKey("values")) {
                List<Map<String, Object>> values = (List<Map<String, Object>>) response.get("values");
                log.debug("JD: {} campos encontrados.", values.size());
                return values;
            } else if (response.containsKey("elements")) {
                List<Map<String, Object>> elements = (List<Map<String, Object>>) response.get("elements");
                log.debug("JD: {} campos encontrados (elements).", elements.size());
                return elements;
            }

            return List.of(response);
        } catch (Exception e) {
            log.warn("Fallo al consultar campos JD en org {}: {}", orgId, e.getMessage());
            return List.of();
        }
    }
}
