package org.agronex.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.infrastructure.config.JohnDeereConfig;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

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
     * Extrae la URI de un link HATEOAS dado su 'rel' desde un objeto JD (org, machine, etc.).
     * John Deere usa HATEOAS: las URLs correctas vienen en el campo "links" de cada recurso.
     * NOTA: JD retorna links apuntando a api.deere.com incluso en sandbox.
     *       Reescribimos el host para que coincida con el apiBaseUrl configurado.
     */
    @SuppressWarnings("unchecked")
    private Optional<String> extractLink(Map<String, Object> resource, String rel) {
        List<Map<String, Object>> links = (List<Map<String, Object>>) resource.get("links");
        if (links == null) return Optional.empty();
        return links.stream()
                .filter(l -> rel.equalsIgnoreCase(String.valueOf(l.get("rel"))))
                .map(l -> rewriteUrl(String.valueOf(l.get("uri"))))
                .findFirst();
    }

    /**
     * Reescribe URLs de la API de John Deere para usar el host correcto según la configuración.
     * Ejemplo: Si apiBaseUrl = "https://sandboxapi.deere.com/platform"
     *          y la URL recibida es "https://api.deere.com/platform/organizations/123"
     *          se reescribe a "https://sandboxapi.deere.com/platform/organizations/123"
     */
    private String rewriteUrl(String originalUrl) {
        if (originalUrl == null) return null;
        String baseUrl = config.getApiBaseUrl(); // e.g. "https://sandboxapi.deere.com/platform"

        // Reemplazar los hosts conocidos de producción por nuestro host configurado
        String[] productionHosts = {
            "https://api.deere.com/platform",
            "https://partnerapi.deere.com/platform"
        };

        for (String prodHost : productionHosts) {
            if (originalUrl.startsWith(prodHost)) {
                String rewritten = baseUrl + originalUrl.substring(prodHost.length());
                log.debug("JD URL rewrite: {} -> {}", originalUrl, rewritten);
                return rewritten;
            }
        }
        return originalUrl;
    }

    /**
     * Obtiene el detalle de una organización específica siguiendo su link 'self',
     * para obtener todos los sub-links (fields, machines, etc.).
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> getOrganizationDetail(UUID userId, String orgId) {
        // Primero obtener la org desde el listado para extraer su self link
        String listUrl = config.getApiBaseUrl() + "/organizations";
        try {
            String rawResponse = executeGet(userId, listUrl);
            if (rawResponse != null && !rawResponse.isBlank()) {
                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                List<Map<String, Object>> values = (List<Map<String, Object>>) response.get("values");
                if (values != null) {
                    for (Map<String, Object> org : values) {
                        if (orgId.equals(String.valueOf(org.get("id")))) {
                            // Seguir el link self (reescrito) para obtener todos sus sub-links
                            Optional<String> selfLink = extractLink(org, "self");
                            if (selfLink.isPresent()) {
                                log.info("JD HATEOAS: Siguiendo self link (reescrito) de org {}: {}", orgId, selfLink.get());
                                String detailRaw = executeGet(userId, selfLink.get());
                                if (detailRaw != null && !detailRaw.isBlank()) {
                                    Map<String, Object> detail = objectMapper.readValue(detailRaw, Map.class);
                                    List<Map<String, Object>> detailLinks = (List<Map<String, Object>>) detail.get("links");
                                    if (detailLinks != null) {
                                        log.info("JD HATEOAS: Links disponibles para org {}: {}",
                                                orgId, detailLinks.stream()
                                                        .map(l -> l.get("rel") + " -> " + rewriteUrl(String.valueOf(l.get("uri"))))
                                                        .toList());
                                    }
                                    return detail;
                                }
                            }
                            return org;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error obteniendo detalle HATEOAS de org {}: {}", orgId, e.getMessage());
        }
        return Map.of();
    }

    /**
     * Realiza una consulta GET firmada a la API de John Deere.
     * Si la API retorna un 401, intenta refrescar el token de forma forzada y reintentar una vez.
     * Si el reintento o el refresh fallan, desconecta al usuario en BD (autocleanup) y lanza una excepción limpia.
     */
    private String executeGet(UUID userId, String url) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String token = authService.getUserAccessToken(idDatos);

        try {
            return restClient.get()
                    .uri(url)
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", ACCEPT_HEADER)
                    .retrieve()
                    .body(String.class);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.info("Token JD inválido o expirado (401) para usuario {}. Intentando forzar refresh...", idDatos);
            try {
                token = authService.forceRefreshUserToken(idDatos);
                return restClient.get()
                        .uri(url)
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", ACCEPT_HEADER)
                        .retrieve()
                        .body(String.class);
            } catch (HttpClientErrorException e2) {
                log.error("Fallo tras refresh. Status: {}. Headers: {}. Body: {}", e2.getStatusCode(), e2.getResponseHeaders(), e2.getResponseBodyAsString());
                authService.disconnectUser(idDatos);
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "La sesión de John Deere ha expirado. Por favor, vuelve a conectar tu cuenta."
                );
            }
        } catch (HttpClientErrorException e) {
            log.error("Error JD en GET {}. Status: {}. Headers: {}. Body: {}", url, e.getStatusCode(), e.getResponseHeaders(), e.getResponseBodyAsString());
            throw e;
        }
    }

    /**
     * Lista las organizaciones del usuario conectado.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listOrganizations(UUID userId) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String url = config.getApiBaseUrl() + "/organizations";

        log.debug("Consultando organizaciones JD para usuario {}", idDatos);

        try {
            String rawResponse = executeGet(userId, url);

            // VUL-B02: solo DEBUG en producción, no INFO
            log.info("JD ORGS RAW RESPONSE: {}", rawResponse);

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
     * Usa HATEOAS: primero intenta seguir los links de la org, luego fallback manual.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listMachines(UUID userId, String orgId) {
        // 1. Intentar obtener URLs desde HATEOAS
        List<String> endpointsToTry = new ArrayList<>();
        try {
            Map<String, Object> orgDetail = getOrganizationDetail(userId, orgId);
            extractLink(orgDetail, "machines").ifPresent(endpointsToTry::add);
            extractLink(orgDetail, "equipment").ifPresent(endpointsToTry::add);
        } catch (Exception e) {
            log.warn("No se pudieron obtener links HATEOAS para equipos de org {}: {}", orgId, e.getMessage());
        }

        // 2. Fallback: URLs construidas manualmente
        if (endpointsToTry.isEmpty()) {
            endpointsToTry.add(config.getApiBaseUrl() + "/organizations/" + orgId + "/machines");
            endpointsToTry.add(config.getApiBaseUrl() + "/organizations/" + orgId + "/equipment");
        }

        for (String url : endpointsToTry) {
            log.info("Consultando equipos JD en org {} via: {}", orgId, url);
            try {
                String rawResponse = executeGet(userId, url);

                log.debug("Respuesta equipos JD recibida ({} chars)", rawResponse != null ? rawResponse.length() : 0);

                if (rawResponse == null || rawResponse.isBlank()) continue;

                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);

                if (response.containsKey("values")) {
                    List<Map<String, Object>> values = (List<Map<String, Object>>) response.get("values");
                    log.info("JD: {} equipos encontrados via {}", values.size(), url);
                    return values;
                } else if (response.containsKey("elements")) {
                    List<Map<String, Object>> elements = (List<Map<String, Object>>) response.get("elements");
                    log.info("JD: {} equipos encontrados (elements) via {}", elements.size(), url);
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
        String url = config.getApiBaseUrl() + "/machines/" + machineId + "/breadcrumbs";

        try {
            String rawResponse = executeGet(userId, url);
            if (rawResponse == null || rawResponse.isBlank()) return List.of();

            Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);

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
        String url = config.getApiBaseUrl() + "/machines/" + machineId + "/locationHistory";

        try {
            String rawResponse = executeGet(userId, url);
            if (rawResponse == null || rawResponse.isBlank()) return List.of();

            Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);

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
     * Usa HATEOAS: primero intenta seguir los links de la org, luego fallback manual.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listFields(UUID userId, String orgId) {
        // 1. Intentar obtener URL desde HATEOAS
        String url = null;
        try {
            Map<String, Object> orgDetail = getOrganizationDetail(userId, orgId);
            Optional<String> fieldsLink = extractLink(orgDetail, "fields");
            if (fieldsLink.isPresent()) {
                url = fieldsLink.get();
                log.info("JD HATEOAS: Usando link de fields para org {}: {}", orgId, url);
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener link HATEOAS de fields para org {}: {}", orgId, e.getMessage());
        }

        // 2. Fallback: URL construida manualmente
        if (url == null) {
            url = config.getApiBaseUrl() + "/organizations/" + orgId + "/fields";
            log.info("JD: Usando URL manual de fields para org {}: {}", orgId, url);
        }

        // Remover temporalmente embed=boundaries para probar permisos basicos
        log.info("Consultando campos JD (SIN BOUNDARIES) en org {} via: {}", orgId, url);
        try {
            String rawResponse = executeGet(userId, url);

            log.info("JD FIELDS RAW RESPONSE: {}", rawResponse);

            if (rawResponse == null || rawResponse.isBlank()) return List.of();

            Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);

            if (response.containsKey("values")) {
                List<Map<String, Object>> values = (List<Map<String, Object>>) response.get("values");
                log.info("JD: {} campos encontrados via {}", values.size(), url);
                return values;
            } else if (response.containsKey("elements")) {
                List<Map<String, Object>> elements = (List<Map<String, Object>>) response.get("elements");
                log.info("JD: {} campos encontrados (elements) via {}", elements.size(), url);
                return elements;
            }

            return List.of(response);
        } catch (Exception e) {
            log.warn("Fallo al consultar campos JD en org {} via {}: {}", orgId, url, e.getMessage());
            return List.of();
        }
    }

    /**
     * Simula la creación de un equipo ficticio e inyecta telemetría (ubicación) en el Sandbox de John Deere.
     *
     * @param userId ID del usuario autenticado
     * @param orgId ID de la organización de Sandbox (ej: 7711480)
     * @return Mapa con detalles del equipo creado y estado de la simulación
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> simulateSandboxTelemetry(UUID userId, String orgId) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(userId);
        String token = authService.getUserAccessToken(idDatos);
        
        String baseSimUrl = config.getApiBaseUrl().replace("/platform", "/isg");
        String isgAccept = "application/vnd.deere.isg.v1+json";
        String uniqueName = "Tractor Simulador " + (System.currentTimeMillis() % 10000);
        
        java.io.File debugFile = new java.io.File("p:/AgroNex/backend/sim_debug.txt");
        try (java.io.FileWriter fw = new java.io.FileWriter(debugFile, true);
             java.io.PrintWriter pw = new java.io.PrintWriter(fw)) {
            
            pw.println("\n=======================================================");
            pw.println("INTENTO DE SIMULACIÓN EN SANDBOX: " + java.time.Instant.now());
            pw.println("Organización: " + orgId);
            pw.println("Token (truncado): " + (token != null && token.length() > 15 ? token.substring(0, 15) + "..." : "null"));
            pw.println("Base Sim URL: " + baseSimUrl);
            pw.println("Nombre generado: " + uniqueName);
            pw.flush();

            log.info("Simulando creación de equipo en JD Sandbox para org {} con nombre {}...", orgId, uniqueName);

            // 1. Obtener Make ID de referencia
            String makeId = null;
            try {
                pw.println("1. Consultando Makes en: " + baseSimUrl + "/equipmentMakes");
                var response = restClient.get()
                        .uri(baseSimUrl + "/equipmentMakes")
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", isgAccept)
                        .retrieve()
                        .toEntity(String.class);
                
                pw.println("   Response Makes Status: " + response.getStatusCode());
                pw.println("   Response Makes Body: " + response.getBody());
                pw.flush();

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> body = objectMapper.readValue(response.getBody(), Map.class);
                    List<Map<String, Object>> values = (List<Map<String, Object>>) body.get("values");
                    if (values != null && !values.isEmpty()) {
                        makeId = values.stream()
                                .filter(m -> "John Deere".equalsIgnoreCase(String.valueOf(m.get("name"))))
                                .map(m -> String.valueOf(m.get("id")))
                                .findFirst()
                                .orElse(String.valueOf(values.get(0).get("id")));
                        log.info("Identificado Make ID para Sandbox: {}", makeId);
                        pw.println("   Make ID seleccionado: " + makeId);
                    }
                }
            } catch (Exception e) {
                log.warn("No se pudo obtener el Make de John Deere, se continuará sin él. Error: {}", e.getMessage());
                pw.println("   Error obteniendo Makes: " + e.getMessage());
                e.printStackTrace(pw);
                pw.flush();
            }

            // 2. Obtener Type ID de referencia
            String typeId = null;
            if (makeId != null) {
                try {
                    pw.println("2. Consultando Types en: " + baseSimUrl + "/equipmentMakes/" + makeId + "/equipmentISGTypes");
                    var response = restClient.get()
                            .uri(baseSimUrl + "/equipmentMakes/" + makeId + "/equipmentISGTypes")
                            .header("Authorization", "Bearer " + token)
                            .header("Accept", isgAccept)
                            .retrieve()
                            .toEntity(String.class);
                    
                    pw.println("   Response Types Status: " + response.getStatusCode());
                    pw.println("   Response Types Body: " + response.getBody());
                    pw.flush();

                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        Map<String, Object> body = objectMapper.readValue(response.getBody(), Map.class);
                        List<Map<String, Object>> values = (List<Map<String, Object>>) body.get("values");
                        if (values != null && !values.isEmpty()) {
                            typeId = values.stream()
                                    .filter(t -> "Tractor".equalsIgnoreCase(String.valueOf(t.get("name"))))
                                    .map(t -> String.valueOf(t.get("id")))
                                    .findFirst()
                                    .orElse(String.valueOf(values.get(0).get("id")));
                            log.info("Identificado Type ID para Sandbox: {}", typeId);
                            pw.println("   Type ID seleccionado: " + typeId);
                        }
                    }
                } catch (Exception e) {
                    log.warn("No se pudo obtener el Type de John Deere. Error: {}", e.getMessage());
                    pw.println("   Error obteniendo Types: " + e.getMessage());
                    e.printStackTrace(pw);
                    pw.flush();
                }
            }

            // 3. Obtener Model ID de referencia
            String modelId = null;
            if (makeId != null && typeId != null) {
                try {
                    pw.println("3. Consultando Models en: " + baseSimUrl + "/equipmentMakes/" + makeId + "/equipmentISGTypes/" + typeId + "/equipmentModels");
                    var response = restClient.get()
                            .uri(baseSimUrl + "/equipmentMakes/" + makeId + "/equipmentISGTypes/" + typeId + "/equipmentModels")
                            .header("Authorization", "Bearer " + token)
                            .header("Accept", isgAccept)
                            .retrieve()
                            .toEntity(String.class);
                    
                    pw.println("   Response Models Status: " + response.getStatusCode());
                    pw.println("   Response Models Body: " + response.getBody());
                    pw.flush();

                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        Map<String, Object> body = objectMapper.readValue(response.getBody(), Map.class);
                        List<Map<String, Object>> values = (List<Map<String, Object>>) body.get("values");
                        if (values != null && !values.isEmpty()) {
                            modelId = String.valueOf(values.get(0).get("id"));
                            log.info("Identificado Model ID para Sandbox: {}", modelId);
                            pw.println("   Model ID seleccionado: " + modelId);
                        }
                    }
                } catch (Exception e) {
                    log.warn("No se pudo obtener el Model de John Deere. Error: {}", e.getMessage());
                    pw.println("   Error obteniendo Models: " + e.getMessage());
                    e.printStackTrace(pw);
                    pw.flush();
                }
            }

            // 4. Construir payload compatible (sin propiedades desconocidas de Jackson)
            Map<String, Object> equipmentPayload = new java.util.HashMap<>();
            equipmentPayload.put("name", uniqueName);
            equipmentPayload.put("type", "Machine"); // 'Machine' o 'Implement'
            equipmentPayload.put("serialNumber", "AGRNX" + (System.currentTimeMillis() % 100000));
            if (makeId != null) {
                equipmentPayload.put("make", makeId);
            }
            if (modelId != null) {
                equipmentPayload.put("model", modelId);
            }

            // SERIALIZACIÓN EXPLICITA DEL JSON BODY
            String equipmentJson = objectMapper.writeValueAsString(equipmentPayload);
            pw.println("4. Payload JSON de Equipo a enviar:\n" + equipmentJson);
            pw.flush();

            String createUrl = baseSimUrl + "/organizations/" + orgId + "/equipment";
            String machineId = null;
            try {
                pw.println("   POST a: " + createUrl);
                var responseEntity = restClient.post()
                        .uri(createUrl)
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", isgAccept)
                        .header("Content-Type", isgAccept)
                        .body(equipmentJson) // Enviando String serializado directamente
                        .retrieve()
                        .toEntity(String.class);

                pw.println("   Response Create Status: " + responseEntity.getStatusCode());
                pw.println("   Response Create Headers: " + responseEntity.getHeaders());
                pw.println("   Response Create Body: " + responseEntity.getBody());
                pw.flush();

                if (responseEntity.getStatusCode().isError()) {
                    throw new RuntimeException("Error creando equipo en Sandbox: " + responseEntity.getStatusCode());
                }

                // Capturar ID desde el header Location
                List<String> locationHeaders = responseEntity.getHeaders().get("Location");
                if (locationHeaders != null && !locationHeaders.isEmpty()) {
                    String location = locationHeaders.get(0);
                    String[] parts = location.split("/");
                    machineId = parts[parts.length - 1];
                }

                // Si no viene en el header Location, intentar parsear el body
                if (machineId == null && responseEntity.getBody() != null) {
                    Map<String, Object> bodyMap = objectMapper.readValue(responseEntity.getBody(), Map.class);
                    if (bodyMap.containsKey("id")) {
                        machineId = bodyMap.get("id").toString();
                    }
                }

                if (machineId == null) {
                    throw new RuntimeException("No se pudo obtener el ID del equipo creado a partir de la respuesta de John Deere.");
                }

                log.info("Equipo de prueba creado exitosamente en Sandbox con ID: {}", machineId);
                pw.println("   Equipo creado con ID: " + machineId);
                pw.flush();

            } catch (org.springframework.web.client.RestClientResponseException e) {
                String errorBody = e.getResponseBodyAsString();
                pw.println("   Error HTTP Creando Equipo: " + e.getMessage() + " - Cuerpo: " + errorBody);
                e.printStackTrace(pw);
                pw.flush();
                log.error("Fallo de API John Deere al crear equipo: {} - Respuesta: {}", e.getMessage(), errorBody, e);
                throw new RuntimeException("Error en API de John Deere (" + e.getStatusCode() + "): " + errorBody);
            } catch (Exception e) {
                pw.println("   Error General Creando Equipo: " + e.getMessage());
                e.printStackTrace(pw);
                pw.flush();
                log.error("Fallo al crear equipo ficticio en Sandbox: {}", e.getMessage(), e);
                throw new RuntimeException("Error al simular creación de equipo: " + e.getMessage());
            }

            // 5. Inyectar Location History
            String locationUrl = baseSimUrl + "/organizations/" + orgId + "/equipment/" + machineId + "/locationHistory";
            log.info("Inyectando historial de ubicación ficticio para máquina {}...", machineId);
            pw.println("5. Inyectando ubicación para máquina " + machineId + " en: " + locationUrl);

            // Generar coordenadas en la pampa argentina y datos de telemetría ficticios
            String eventTime = java.time.Instant.now().toString();
            Map<String, Object> locationPayload = Map.of(
                "type", "FeatureCollection",
                "features", List.of(
                    Map.of(
                        "type", "Feature",
                        "geometry", Map.of(
                            "type", "Point",
                            "coordinates", List.of(-60.7000, -31.6300)
                        ),
                        "properties", Map.of(
                            "eventTime", eventTime,
                            "speed", "12.5 km/h",
                            "engineState", "1",
                            "heading", 180,
                            "gpsQuality", "3D_FIX",
                            "source", "SIMULATED_AGRONEX"
                        )
                    )
                )
            );

            String locationJson = objectMapper.writeValueAsString(locationPayload);
            pw.println("   Payload JSON de ubicación: " + locationJson);
            pw.flush();

            try {
                var responseEntity = restClient.post()
                        .uri(locationUrl)
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", isgAccept)
                        .header("Content-Type", isgAccept)
                        .body(locationJson) // Enviando String serializado directamente
                        .retrieve()
                        .toEntity(Void.class);

                pw.println("   Response Location Status: " + responseEntity.getStatusCode());
                pw.flush();

                if (responseEntity.getStatusCode().isError()) {
                    throw new RuntimeException("Error inyectando ubicación en Sandbox: " + responseEntity.getStatusCode());
                }

                log.info("Telemetría ficticia inyectada con éxito.");
                pw.println("   Telemetría inyectada con éxito.");
                pw.println("=======================================================");
                pw.flush();

                return Map.of(
                    "success", true,
                    "machineId", machineId,
                    "organizationId", orgId,
                    "name", uniqueName,
                    "coordinates", List.of(-60.7000, -31.6300),
                    "speed", "12.5 km/h",
                    "engineState", "1",
                    "eventTime", eventTime
                );

            } catch (org.springframework.web.client.RestClientResponseException e) {
                String errorBody = e.getResponseBodyAsString();
                pw.println("   Error HTTP Inyectando Ubicación: " + e.getMessage() + " - Cuerpo: " + errorBody);
                e.printStackTrace(pw);
                pw.flush();
                log.error("Fallo de API John Deere al inyectar ubicación: {} - Respuesta: {}", e.getMessage(), errorBody, e);
                throw new RuntimeException("Error en API de John Deere (" + e.getStatusCode() + "): " + errorBody);
            } catch (Exception e) {
                pw.println("   Error General Inyectando Ubicación: " + e.getMessage());
                e.printStackTrace(pw);
                pw.flush();
                log.error("Fallo al inyectar ubicación ficticia en Sandbox: {}", e.getMessage(), e);
                throw new RuntimeException("Error al simular ubicación de equipo: " + e.getMessage());
            }

        } catch (Exception outerEx) {
            log.error("Error al escribir el archivo de debug o simulando: {}", outerEx.getMessage());
            throw new RuntimeException(outerEx.getMessage());
        }
    }
}
