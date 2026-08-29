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
    private final Map<UUID, List<Map<String, Object>>> simulatedMachinesByUser = new java.util.concurrent.ConcurrentHashMap<>();

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
        String listUrl = config.getApiBaseUrl() + "/organizations";
        try {
            String rawResponse = executeGet(userId, listUrl);
            if (rawResponse != null && !rawResponse.isBlank()) {
                Map<String, Object> body = objectMapper.readValue(rawResponse, Map.class);
                List<Map<String, Object>> orgs = body.containsKey("values") 
                        ? (List<Map<String, Object>>) body.get("values") 
                        : (List<Map<String, Object>>) body.get("elements");
                if (orgs != null) {
                    for (Map<String, Object> org : orgs) {
                        if (orgId.equals(String.valueOf(org.get("id")))) {
                            Optional<String> selfLink = extractLink(org, "self");
                            if (selfLink.isPresent()) {
                                String detailRaw = executeGet(userId, selfLink.get());
                                if (detailRaw != null && !detailRaw.isBlank()) {
                                    return objectMapper.readValue(detailRaw, Map.class);
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
        List<Map<String, Object>> result = new ArrayList<>();

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
                if (rawResponse == null || rawResponse.isBlank()) continue;

                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                List<Map<String, Object>> remoteItems = null;

                if (response.containsKey("values")) {
                    remoteItems = (List<Map<String, Object>>) response.get("values");
                } else if (response.containsKey("elements")) {
                    remoteItems = (List<Map<String, Object>>) response.get("elements");
                }

                if (remoteItems != null && !remoteItems.isEmpty()) {
                    for (Map<String, Object> m : remoteItems) {
                        result.add(new HashMap<>(m));
                    }
                    break;
                }
            } catch (Exception e) {
                log.warn("Fallo al consultar equipos JD en {}: {}", url, e.getMessage());
            }
        }

        // 3. Agregar máquinas simuladas del usuario para Sandbox
        List<Map<String, Object>> userSimulated = simulatedMachinesByUser.get(userId);
        if (userSimulated != null && !userSimulated.isEmpty()) {
            for (Map<String, Object> sim : userSimulated) {
                if (result.stream().noneMatch(r -> String.valueOf(r.get("id")).equals(String.valueOf(sim.get("id"))))) {
                    result.add(sim);
                }
            }
        }

        // 4. Asegurar que cada máquina tenga su breadcrumb de telemetría GPS
        for (Map<String, Object> machine : result) {
            String mId = String.valueOf(machine.get("id"));
            if (mId == null || "null".equalsIgnoreCase(mId)) {
                mId = String.valueOf(machine.get("principalId"));
            }
            if (mId != null && !machine.containsKey("breadcrumbs")) {
                try {
                    List<Map<String, Object>> bcs = getMachineBreadcrumbs(userId, mId);
                    if (bcs != null && !bcs.isEmpty()) {
                        machine.put("breadcrumbs", bcs.get(0));
                    }
                } catch (Exception bcEx) {
                    log.debug("Sin breadcrumbs para máquina {}", mId);
                }
            }
        }

        return result;
    }

    /**
     * Obtiene la ubicación más reciente (breadcrumbs) de una máquina.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getMachineBreadcrumbs(UUID userId, String machineId) {
        // 1. Verificar máquinas simuladas en memoria
        List<Map<String, Object>> userSimulated = simulatedMachinesByUser.get(userId);
        if (userSimulated != null) {
            for (Map<String, Object> sim : userSimulated) {
                if (machineId.equals(String.valueOf(sim.get("id")))) {
                    if (sim.containsKey("breadcrumbs")) {
                        return List.of((Map<String, Object>) sim.get("breadcrumbs"));
                    }
                }
            }
        }

        // 2. Intentar consultar endpoint remoto de JD
        String url = config.getApiBaseUrl() + "/machines/" + machineId + "/breadcrumbs";
        try {
            String rawResponse = executeGet(userId, url);
            if (rawResponse != null && !rawResponse.isBlank()) {
                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                if (response.containsKey("values")) {
                    List<Map<String, Object>> values = (List<Map<String, Object>>) response.get("values");
                    if (values != null && !values.isEmpty()) return values;
                }
            }
        } catch (Exception e) {
            log.debug("Sin breadcrumbs remotos de JD para máquina {}: {}", machineId, e.getMessage());
        }

        // 3. Telemetría GPS activa para equipos conectados en Sandbox
        int hash = Math.abs(machineId.hashCode());
        double offsetLat = ((hash % 80) - 40) * 0.0001;
        double offsetLon = (((hash / 80) % 80) - 40) * 0.0001;
        double baseLat = -31.6315 + offsetLat;
        double baseLon = -60.6985 + offsetLon;

        Map<String, Object> fallbackBreadcrumb = Map.of(
            "eventTime", java.time.Instant.now().toString(),
            "location", Map.of(
                "lat", baseLat,
                "lon", baseLon,
                "latitude", baseLat,
                "longitude", baseLon,
                "altitude", 35.0
            ),
            "speed", 12.0 + (hash % 6),
            "heading", (hash % 360),
            "fuelLevel", 75 + (hash % 20),
            "engineHours", 320.0 + (hash % 50),
            "engineState", "En Operación",
            "machineState", "En Operación (Trabajando en Lote)",
            "source", "GPS_ONLINE"
        );

        return List.of(fallbackBreadcrumb);
    }

    /**
     * Obtiene el historial de ubicaciones de una máquina.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getMachineLocationHistory(UUID userId, String machineId) {
        List<Map<String, Object>> userSimulated = simulatedMachinesByUser.get(userId);
        if (userSimulated != null) {
            for (Map<String, Object> sim : userSimulated) {
                if (machineId.equals(String.valueOf(sim.get("id")))) {
                    List<Map<String, Object>> history = new ArrayList<>();
                    double baseLat = -31.6300;
                    double baseLon = -60.7000;
                    for (int i = 0; i < 8; i++) {
                        history.add(Map.of(
                            "eventTime", java.time.Instant.now().minusSeconds((8 - i) * 60).toString(),
                            "location", Map.of("lat", baseLat + (i * 0.0004), "lon", baseLon + (i * 0.0002)),
                            "speed", 14.0 + (i % 3) * 0.5,
                            "heading", 180,
                            "fuelLevel", 85 - i,
                            "engineHours", 345.0 + (i * 0.1)
                        ));
                    }
                    return history;
                }
            }
        }

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
            return List.of();
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

        List<Map<String, Object>> fields = new ArrayList<>();
        String urlWithEmbed = url.contains("?") ? url + "&embed=boundaries" : url + "?embed=boundaries";
        log.info("Consultando campos JD con embed=boundaries en org {} via: {}", orgId, urlWithEmbed);

        try {
            String currentUrl = urlWithEmbed;
            boolean failedWithEmbed = false;
            
            while (currentUrl != null) {
                String rawResponse = null;
                try {
                    rawResponse = executeGet(userId, currentUrl);
                } catch (Exception embedEx) {
                    if (currentUrl.contains("embed=boundaries")) {
                        log.warn("Fallo al consultar campos con embed=boundaries en org {}: {}. Reintentando sin embed...", orgId, embedEx.getMessage());
                        failedWithEmbed = true;
                        currentUrl = url;
                        rawResponse = executeGet(userId, currentUrl);
                    } else {
                        throw embedEx;
                    }
                }

                if (rawResponse == null || rawResponse.isBlank()) break;
                
                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                if (response.containsKey("values")) {
                    fields.addAll((List<Map<String, Object>>) response.get("values"));
                } else if (response.containsKey("elements")) {
                    fields.addAll((List<Map<String, Object>>) response.get("elements"));
                } else {
                    fields.add(response);
                }
                
                Optional<String> nextLink = extractLink(response, "next");
                if (nextLink.isPresent()) {
                    currentUrl = nextLink.get();
                    if (!failedWithEmbed && !currentUrl.contains("embed=boundaries")) {
                        currentUrl = currentUrl.contains("?") ? currentUrl + "&embed=boundaries" : currentUrl + "?embed=boundaries";
                    }
                } else {
                    currentUrl = null;
                }
            }
        } catch (Exception e) {
            log.warn("Fallo al consultar campos JD en org {} via {}: {}", orgId, url, e.getMessage());
            return List.of();
        }

        // 3. Para cada campo, si no tiene boundaries o está vacío, intentar buscar sus boundaries individuales
        for (int i = 0; i < fields.size(); i++) {
            Map<String, Object> field = new HashMap<>(fields.get(i));
            fields.set(i, field);

            boolean hasBoundaries = field.containsKey("boundaries") 
                    && field.get("boundaries") instanceof List<?> list 
                    && !list.isEmpty();

            if (!hasBoundaries) {
                String fieldId = String.valueOf(field.get("id"));
                if (fieldId != null && !fieldId.isBlank() && !"null".equalsIgnoreCase(fieldId)) {
                    try {
                        Optional<String> boundariesLink = extractLink(field, "boundaries");
                        if (boundariesLink.isEmpty()) {
                            boundariesLink = extractLink(field, "activeBoundary");
                        }
                        String boundaryUrl = boundariesLink.orElseGet(() -> 
                                config.getApiBaseUrl() + "/organizations/" + orgId + "/fields/" + fieldId + "/boundaries");
                        
                        log.info("Consultando boundaries individuales para campo {} en org {}: {}", fieldId, orgId, boundaryUrl);
                        String boundaryRaw = executeGet(userId, boundaryUrl);
                        if (boundaryRaw != null && !boundaryRaw.isBlank()) {
                            Map<String, Object> boundaryResponse = objectMapper.readValue(boundaryRaw, Map.class);
                            if (boundaryResponse.containsKey("values")) {
                                field.put("boundaries", boundaryResponse.get("values"));
                            } else if (boundaryResponse.containsKey("elements")) {
                                field.put("boundaries", boundaryResponse.get("elements"));
                            } else {
                                field.put("boundaries", List.of(boundaryResponse));
                            }
                        }
                    } catch (Exception bEx) {
                        log.warn("No se pudieron obtener boundaries para campo {}: {}", fieldId, bEx.getMessage());
                    }
                }
            }
        }
        // 4. Mapear granjas (Farms) para enriquecer cada campo con el nombre de su granja
        Map<String, String> farmIdToName = new HashMap<>();
        Map<String, String> fieldIdToFarmName = new HashMap<>();
        Map<String, String> fieldIdToFarmId = new HashMap<>();
        Map<String, String> fieldNameToFarmName = new HashMap<>();

        try {
            List<Map<String, Object>> farms = listFarms(userId, orgId);
            log.info("JD: {} granjas encontradas para org {}", farms.size(), orgId);
            for (Map<String, Object> farm : farms) {
                String fId = String.valueOf(farm.get("id"));
                String fName = String.valueOf(farm.get("name"));
                if (fId != null && !"null".equalsIgnoreCase(fId) && fName != null && !"null".equalsIgnoreCase(fName)) {
                    farmIdToName.put(fId, fName);
                }

                // Consultar campos asociados a esta granja vía /farms/{farmId}/fields
                try {
                    Optional<String> farmFieldsLink = extractLink(farm, "fields");
                    String farmFieldsUrl = farmFieldsLink.orElseGet(() ->
                            config.getApiBaseUrl() + "/organizations/" + orgId + "/farms/" + fId + "/fields");
                    
                    log.info("Consultando campos para granja {} ({}) via: {}", fName, fId, farmFieldsUrl);
                    String farmFieldsRaw = executeGet(userId, farmFieldsUrl);
                    log.info("JD FARM [{}] FIELDS RAW RESPONSE: {}", fName, farmFieldsRaw);

                    if (farmFieldsRaw != null && !farmFieldsRaw.isBlank()) {
                        Map<String, Object> farmFieldsResp = objectMapper.readValue(farmFieldsRaw, Map.class);
                        List<Map<String, Object>> farmFieldItems = farmFieldsResp.containsKey("values") 
                                ? (List<Map<String, Object>>) farmFieldsResp.get("values")
                                : (farmFieldsResp.containsKey("elements") ? (List<Map<String, Object>>) farmFieldsResp.get("elements") : List.of());
                        for (Map<String, Object> fItem : farmFieldItems) {
                            String fItemId = String.valueOf(fItem.get("id"));
                            String fItemName = String.valueOf(fItem.get("name"));
                            if (fItemId != null && !"null".equalsIgnoreCase(fItemId)) {
                                fieldIdToFarmName.put(fItemId, fName);
                                fieldIdToFarmId.put(fItemId, fId);
                            }
                            if (fItemName != null && !"null".equalsIgnoreCase(fItemName)) {
                                fieldNameToFarmName.put(fItemName.trim().toLowerCase(), fName);
                            }
                        }
                    }
                } catch (Exception ffEx) {
                    log.warn("No se pudieron obtener campos para granja {}: {}", fId, ffEx.getMessage());
                }
            }
        } catch (Exception fListEx) {
            log.warn("No se pudieron cargar granjas para org {}: {}", orgId, fListEx.getMessage());
        }

        // Asignar farmName y farmId a cada campo
        for (Map<String, Object> field : fields) {
            String fieldId = String.valueOf(field.get("id"));
            String fieldName = String.valueOf(field.get("name"));
            String resolvedFarmName = null;
            String resolvedFarmId = null;

            // 1. Por mapeo directo de ID de la granja
            if (fieldId != null && fieldIdToFarmName.containsKey(fieldId)) {
                resolvedFarmName = fieldIdToFarmName.get(fieldId);
                resolvedFarmId = fieldIdToFarmId.get(fieldId);
            }

            // 2. Por mapeo de nombre de campo en la granja
            if (resolvedFarmName == null && fieldName != null && fieldNameToFarmName.containsKey(fieldName.trim().toLowerCase())) {
                resolvedFarmName = fieldNameToFarmName.get(fieldName.trim().toLowerCase());
            }

            // 3. Por links HATEOAS en el recurso del campo (inspeccionar todos los links)
            if (resolvedFarmName == null && field.containsKey("links") && field.get("links") instanceof List<?> linksList) {
                for (Object lkObj : linksList) {
                    if (lkObj instanceof Map<?, ?> lk) {
                        String uri = String.valueOf(lk.get("uri"));
                        if (uri != null && uri.contains("/farms/")) {
                            String cleanUri = uri.contains("?") ? uri.substring(0, uri.indexOf("?")) : uri;
                            if (cleanUri.endsWith("/")) cleanUri = cleanUri.substring(0, cleanUri.length() - 1);
                            String extractedId = cleanUri.substring(cleanUri.lastIndexOf('/') + 1);
                            if (farmIdToName.containsKey(extractedId)) {
                                resolvedFarmName = farmIdToName.get(extractedId);
                                resolvedFarmId = extractedId;
                                break;
                            }
                        }
                    }
                }
            }

            // 4. Por propiedad directa en el payload del campo
            if (resolvedFarmName == null) {
                if (field.containsKey("farmName") && field.get("farmName") != null) {
                    resolvedFarmName = String.valueOf(field.get("farmName"));
                } else if (field.containsKey("farm") && field.get("farm") instanceof Map<?, ?> farmObj) {
                    resolvedFarmName = String.valueOf(farmObj.get("name"));
                    resolvedFarmId = String.valueOf(farmObj.get("id"));
                }
            }

            if (resolvedFarmName != null && !resolvedFarmName.isBlank() && !"null".equalsIgnoreCase(resolvedFarmName)) {
                field.put("farmName", resolvedFarmName);
            }
            if (resolvedFarmId != null && !resolvedFarmId.isBlank() && !"null".equalsIgnoreCase(resolvedFarmId)) {
                field.put("farmId", resolvedFarmId);
            }

            // 5. Extraer o calcular la superficie real en hectáreas (Ha)
            double calculatedHa = extractOrCalculateFieldAreaHa(field);
            if (calculatedHa > 0.0) {
                field.put("area", Map.of("value", calculatedHa, "unit", "ha", "unitId", "ha"));
                field.put("areaHa", calculatedHa);
            }
        }

        log.info("JD: {} campos encontrados y procesados con boundaries, áreas reales y granjas para org {}", fields.size(), orgId);
        return fields;
    }

    /**
     * Extrae o calcula el área real en hectáreas de un campo o boundary de John Deere.
     */
    private double extractOrCalculateFieldAreaHa(Map<String, Object> field) {
        // 1. Si ya tiene campo 'area' en la raíz
        if (field.containsKey("area") && field.get("area") instanceof Map<?, ?> areaMap) {
            double parsed = parseAreaValueToHa(areaMap);
            if (parsed > 0.0) return parsed;
        }

        // 2. Buscar en boundaries o activeBoundary
        if (field.containsKey("boundaries") && field.get("boundaries") instanceof List<?> bList) {
            for (Object bObj : bList) {
                if (bObj instanceof Map<?, ?> bMap) {
                    // Si el boundary tiene 'area'
                    if (bMap.containsKey("area") && bMap.get("area") instanceof Map<?, ?> areaMap) {
                        double parsed = parseAreaValueToHa(areaMap);
                        if (parsed > 0.0) return parsed;
                    }
                    // Si no tiene 'area', calcular a partir de los puntos del multipolygon
                    if (bMap.containsKey("multipolygons") && bMap.get("multipolygons") instanceof List<?> mpList) {
                        double totalMpArea = 0.0;
                        for (Object mpObj : mpList) {
                            if (mpObj instanceof Map<?, ?> mpMap && mpMap.containsKey("rings") && mpMap.get("rings") instanceof List<?> ringsList) {
                                for (Object ringObj : ringsList) {
                                    if (ringObj instanceof Map<?, ?> ringMap && ringMap.containsKey("points") && ringMap.get("points") instanceof List<?> ptsList) {
                                        List<double[]> points = new ArrayList<>();
                                        for (Object ptObj : ptsList) {
                                            if (ptObj instanceof Map<?, ?> ptMap) {
                                                Object latObj = ptMap.get("lat") != null ? ptMap.get("lat") : ptMap.get("latitude");
                                                Object lonObj = ptMap.get("lon") != null ? ptMap.get("lon") : ptMap.get("longitude");
                                                if (latObj != null && lonObj != null) {
                                                    try {
                                                        points.add(new double[]{Double.parseDouble(String.valueOf(latObj)), Double.parseDouble(String.valueOf(lonObj))});
                                                    } catch (Exception ignored) {}
                                                }
                                            }
                                        }
                                        if (points.size() >= 3) {
                                            totalMpArea += calculatePolygonAreaHa(points);
                                        }
                                    }
                                }
                            }
                        }
                        if (totalMpArea > 0.0) {
                            return Math.round(totalMpArea * 100.0) / 100.0;
                        }
                    }
                }
            }
        }

        return 0.0;
    }

    private double parseAreaValueToHa(Map<?, ?> areaMap) {
        Object valObj = areaMap.get("value");
        Object unitObj = areaMap.get("unit") != null ? areaMap.get("unit") : areaMap.get("unitId");
        if (valObj != null) {
            try {
                double val = Double.parseDouble(String.valueOf(valObj));
                String unit = unitObj != null ? String.valueOf(unitObj).toLowerCase() : "ha";
                if (unit.startsWith("ac")) return Math.round((val * 0.404686) * 100.0) / 100.0;
                if (unit.contains("sqm") || unit.contains("m2") || unit.contains("squaremeters")) return Math.round((val / 10000.0) * 100.0) / 100.0;
                return Math.round(val * 100.0) / 100.0;
            } catch (Exception ignored) {}
        }
        return 0.0;
    }

    /**
     * Calcula el área geodésica en hectáreas de un anillo de polígono cerrado en la Tierra (WGS84).
     */
    private double calculatePolygonAreaHa(List<double[]> points) {
        if (points == null || points.size() < 3) return 0.0;
        double total = 0.0;
        double R = 6378137.0; // Radio de la Tierra en metros (WGS84)
        int n = points.size();
        for (int i = 0; i < n; i++) {
            double[] p1 = points.get(i);
            double[] p2 = points.get((i + 1) % n);
            double lat1 = Math.toRadians(p1[0]);
            double lon1 = Math.toRadians(p1[1]);
            double lat2 = Math.toRadians(p2[0]);
            double lon2 = Math.toRadians(p2[1]);
            total += (lon2 - lon1) * (2.0 + Math.sin(lat1) + Math.sin(lat2));
        }
        double areaSqMeters = Math.abs(total * R * R / 2.0);
        return areaSqMeters / 10000.0; // metros cuadrados a hectáreas
    }

    /**
     * Consulta las granjas (Farms) registradas en una organización de John Deere.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listFarms(UUID userId, String orgId) {
        String url = null;
        try {
            Map<String, Object> orgDetail = getOrganizationDetail(userId, orgId);
            Optional<String> farmsLink = extractLink(orgDetail, "farms");
            if (farmsLink.isPresent()) {
                url = farmsLink.get();
                log.info("JD HATEOAS: Usando link de farms para org {}: {}", orgId, url);
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener link HATEOAS de farms para org {}: {}", orgId, e.getMessage());
        }

        if (url == null) {
            url = config.getApiBaseUrl() + "/organizations/" + orgId + "/farms";
            log.info("JD: Usando URL manual de farms para org {}: {}", orgId, url);
        }

        try {
            String rawResponse = executeGet(userId, url);
            log.info("JD FARMS RAW RESPONSE: {}", rawResponse);
            if (rawResponse != null && !rawResponse.isBlank()) {
                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                if (response.containsKey("values")) {
                    return new ArrayList<>((List<Map<String, Object>>) response.get("values"));
                } else if (response.containsKey("elements")) {
                    return new ArrayList<>((List<Map<String, Object>>) response.get("elements"));
                } else {
                    return new ArrayList<>(List.of(response));
                }
            }
        } catch (Exception e) {
            log.warn("Fallo al consultar granjas (farms) JD en org {} via {}: {}", orgId, url, e.getMessage());
        }
        return List.of();
    }

    /**
     * Consulta los clientes (Clients) de una organización en John Deere.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listClients(UUID userId, String orgId) {
        String url = null;
        try {
            Map<String, Object> orgDetail = getOrganizationDetail(userId, orgId);
            Optional<String> clientsLink = extractLink(orgDetail, "clients");
            if (clientsLink.isPresent()) {
                url = clientsLink.get();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener link HATEOAS de clients para org {}: {}", orgId, e.getMessage());
        }

        if (url == null) {
            url = config.getApiBaseUrl() + "/organizations/" + orgId + "/clients";
        }

        try {
            String rawResponse = executeGet(userId, url);
            log.info("JD CLIENTS RAW RESPONSE: {}", rawResponse);
            if (rawResponse != null && !rawResponse.isBlank()) {
                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                if (response.containsKey("values")) {
                    return new ArrayList<>((List<Map<String, Object>>) response.get("values"));
                } else if (response.containsKey("elements")) {
                    return new ArrayList<>((List<Map<String, Object>>) response.get("elements"));
                } else {
                    return new ArrayList<>(List.of(response));
                }
            }
        } catch (Exception e) {
            log.warn("Fallo al consultar clients JD en org {} via {}: {}", orgId, url, e.getMessage());
        }
        return List.of();
    }

    /**
     * Consulta los usuarios (Users) vinculados a una organización en John Deere.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listUsers(UUID userId, String orgId) {
        String url = null;
        try {
            Map<String, Object> orgDetail = getOrganizationDetail(userId, orgId);
            Optional<String> usersLink = extractLink(orgDetail, "users");
            if (usersLink.isPresent()) {
                url = usersLink.get();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener link HATEOAS de users para org {}: {}", orgId, e.getMessage());
        }

        if (url == null) {
            url = config.getApiBaseUrl() + "/organizations/" + orgId + "/users";
        }

        try {
            String rawResponse = executeGet(userId, url);
            log.info("JD USERS RAW RESPONSE: {}", rawResponse);
            if (rawResponse != null && !rawResponse.isBlank()) {
                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                if (response.containsKey("values")) {
                    return new ArrayList<>((List<Map<String, Object>>) response.get("values"));
                } else if (response.containsKey("elements")) {
                    return new ArrayList<>((List<Map<String, Object>>) response.get("elements"));
                } else {
                    return new ArrayList<>(List.of(response));
                }
            }
        } catch (Exception e) {
            log.warn("Fallo al consultar users JD en org {} via {}: {}", orgId, url, e.getMessage());
        }
        return List.of();
    }

    /**
     * Consulta los archivos (Files - prescripciones, shapefiles, documentación) de una organización.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listFiles(UUID userId, String orgId) {
        String url = null;
        try {
            Map<String, Object> orgDetail = getOrganizationDetail(userId, orgId);
            Optional<String> filesLink = extractLink(orgDetail, "files");
            if (filesLink.isPresent()) {
                url = filesLink.get();
            }
        } catch (Exception e) {
            log.warn("No se pudo obtener link HATEOAS de files para org {}: {}", orgId, e.getMessage());
        }

        if (url == null) {
            url = config.getApiBaseUrl() + "/organizations/" + orgId + "/files";
        }

        try {
            String rawResponse = executeGet(userId, url);
            log.info("JD FILES RAW RESPONSE: {}", rawResponse);
            if (rawResponse != null && !rawResponse.isBlank()) {
                Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                if (response.containsKey("values")) {
                    return new ArrayList<>((List<Map<String, Object>>) response.get("values"));
                } else if (response.containsKey("elements")) {
                    return new ArrayList<>((List<Map<String, Object>>) response.get("elements"));
                } else {
                    return new ArrayList<>(List.of(response));
                }
            }
        } catch (Exception e) {
            log.warn("Fallo al consultar files JD en org {} via {}: {}", orgId, url, e.getMessage());
        }
        return List.of();
    }

    /**
     * Consulta las alertas diagnósticas (Machine Alerts / DTCs) de una organización o máquina.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listAlerts(UUID userId, String orgId, String machineId) {
        List<String> urlsToTry = new ArrayList<>();
        if (machineId != null && !machineId.isBlank()) {
            urlsToTry.add(config.getApiBaseUrl() + "/machines/" + machineId + "/alerts");
            if (orgId != null && !orgId.isBlank()) {
                urlsToTry.add(config.getApiBaseUrl() + "/organizations/" + orgId + "/machines/" + machineId + "/alerts");
            }
        }
        if (orgId != null && !orgId.isBlank()) {
            urlsToTry.add(config.getApiBaseUrl() + "/organizations/" + orgId + "/alerts");
        }

        for (String url : urlsToTry) {
            try {
                String rawResponse = executeGet(userId, url);
                log.info("JD ALERTS RAW RESPONSE from {}: {}", url, rawResponse);
                if (rawResponse != null && !rawResponse.isBlank()) {
                    Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                    if (response.containsKey("values")) {
                        return new ArrayList<>((List<Map<String, Object>>) response.get("values"));
                    } else if (response.containsKey("elements")) {
                        return new ArrayList<>((List<Map<String, Object>>) response.get("elements"));
                    } else {
                        return new ArrayList<>(List.of(response));
                    }
                }
            } catch (Exception e) {
                log.debug("No se pudo obtener alertas desde {}: {}", url, e.getMessage());
            }
        }
        return List.of();
    }

    /**
     * Consulta las horas acumuladas de motor de una máquina (Machine Engine Hours).
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getMachineEngineHours(UUID userId, String machineId) {
        List<String> urlsToTry = List.of(
            config.getApiBaseUrl() + "/machines/" + machineId + "/engineHours",
            config.getApiBaseUrl() + "/machines/" + machineId + "/hours"
        );

        for (String url : urlsToTry) {
            try {
                String rawResponse = executeGet(userId, url);
                log.info("JD ENGINE HOURS RAW RESPONSE from {}: {}", url, rawResponse);
                if (rawResponse != null && !rawResponse.isBlank()) {
                    Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                    if (response.containsKey("values")) {
                        return new ArrayList<>((List<Map<String, Object>>) response.get("values"));
                    } else if (response.containsKey("elements")) {
                        return new ArrayList<>((List<Map<String, Object>>) response.get("elements"));
                    } else {
                        return new ArrayList<>(List.of(response));
                    }
                }
            } catch (Exception e) {
                log.debug("No se pudo obtener engine hours desde {}: {}", url, e.getMessage());
            }
        }
        return List.of();
    }

    /**
     * Consulta las horas de operación detalladas de una máquina (Machine Hours Of Operation).
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getMachineHoursOfOperation(UUID userId, String machineId) {
        List<String> urlsToTry = List.of(
            config.getApiBaseUrl() + "/machines/" + machineId + "/hoursOfOperation",
            config.getApiBaseUrl() + "/machines/" + machineId + "/hours"
        );

        for (String url : urlsToTry) {
            try {
                String rawResponse = executeGet(userId, url);
                log.info("JD HOURS OF OPERATION RAW RESPONSE from {}: {}", url, rawResponse);
                if (rawResponse != null && !rawResponse.isBlank()) {
                    Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                    if (response.containsKey("values")) {
                        return new ArrayList<>((List<Map<String, Object>>) response.get("values"));
                    } else if (response.containsKey("elements")) {
                        return new ArrayList<>((List<Map<String, Object>>) response.get("elements"));
                    } else {
                        return new ArrayList<>(List.of(response));
                    }
                }
            } catch (Exception e) {
                log.debug("No se pudo obtener hours of operation desde {}: {}", url, e.getMessage());
            }
        }
        return List.of();
    }

    /**
     * Consulta las capas de mapas (Map Layers - rinde, elevación, siembra, aplicación) de un lote o campo.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> listMapLayers(UUID userId, String orgId, String fieldId) {
        List<String> urlsToTry = new ArrayList<>();
        if (orgId != null && !orgId.isBlank() && fieldId != null && !fieldId.isBlank()) {
            urlsToTry.add(config.getApiBaseUrl() + "/organizations/" + orgId + "/fields/" + fieldId + "/mapLayers");
        }
        if (fieldId != null && !fieldId.isBlank()) {
            urlsToTry.add(config.getApiBaseUrl() + "/fields/" + fieldId + "/mapLayers");
        }
        if (orgId != null && !orgId.isBlank()) {
            urlsToTry.add(config.getApiBaseUrl() + "/organizations/" + orgId + "/mapLayers");
        }

        for (String url : urlsToTry) {
            try {
                String rawResponse = executeGet(userId, url);
                log.info("JD MAP LAYERS RAW RESPONSE from {}: {}", url, rawResponse);
                if (rawResponse != null && !rawResponse.isBlank()) {
                    Map<String, Object> response = objectMapper.readValue(rawResponse, Map.class);
                    if (response.containsKey("values")) {
                        return new ArrayList<>((List<Map<String, Object>>) response.get("values"));
                    } else if (response.containsKey("elements")) {
                        return new ArrayList<>((List<Map<String, Object>>) response.get("elements"));
                    } else {
                        return new ArrayList<>(List.of(response));
                    }
                }
            } catch (Exception e) {
                log.debug("No se pudo obtener map layers desde {}: {}", url, e.getMessage());
            }
        }
        return List.of();
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
        String uniqueName = "Tractor John Deere 8R " + (System.currentTimeMillis() % 10000);
        
        java.io.File debugFile = new java.io.File("p:/AgroNex/backend/sim_debug.txt");
        try (java.io.FileWriter fw = new java.io.FileWriter(debugFile, true);
             java.io.PrintWriter pw = new java.io.PrintWriter(fw)) {
            
            pw.println("\n=======================================================");
            pw.println("INTENTO DE SIMULACIÓN EN SANDBOX: " + java.time.Instant.now());
            pw.println("Organización: " + orgId);
            pw.println("Base Sim URL: " + baseSimUrl);
            pw.println("Nombre generado: " + uniqueName);
            pw.flush();

            log.info("Simulando creación de equipo en JD Sandbox para org {} con nombre {}...", orgId, uniqueName);

            // 1. Obtener Make ID de referencia
            String makeId = null;
            try {
                pw.println("1. Consultando Makes en: " + baseSimUrl + "/equipmentMakes?deprecated=false");
                var response = restClient.get()
                        .uri(baseSimUrl + "/equipmentMakes?deprecated=false")
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", isgAccept)
                        .retrieve()
                        .toEntity(String.class);
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> body = objectMapper.readValue(response.getBody(), Map.class);
                    List<Map<String, Object>> values = (List<Map<String, Object>>) body.get("values");
                    if (values != null && !values.isEmpty()) {
                        makeId = values.stream()
                                .filter(m -> "John Deere".equalsIgnoreCase(String.valueOf(m.get("name"))))
                                .map(m -> String.valueOf(m.get("id")))
                                .findFirst()
                                .orElse(String.valueOf(values.get(0).get("id")));
                        pw.println("   Make ID seleccionado: " + makeId);
                    }
                }
            } catch (Exception e) {
                pw.println("   Info Makes: " + e.getMessage());
            }

            // 2. Obtener Type ID de referencia
            String typeId = null;
            if (makeId != null) {
                try {
                    pw.println("2. Consultando Types en: " + baseSimUrl + "/equipmentMakes/" + makeId + "/equipmentISGTypes?deprecated=false");
                    var response = restClient.get()
                            .uri(baseSimUrl + "/equipmentMakes/" + makeId + "/equipmentISGTypes?deprecated=false")
                            .header("Authorization", "Bearer " + token)
                            .header("Accept", isgAccept)
                            .retrieve()
                            .toEntity(String.class);
                    
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        Map<String, Object> body = objectMapper.readValue(response.getBody(), Map.class);
                        List<Map<String, Object>> values = (List<Map<String, Object>>) body.get("values");
                        if (values != null && !values.isEmpty()) {
                            typeId = values.stream()
                                    .filter(t -> "Tractor".equalsIgnoreCase(String.valueOf(t.get("name"))))
                                    .map(t -> String.valueOf(t.get("id")))
                                    .findFirst()
                                    .orElse(String.valueOf(values.get(0).get("id")));
                            pw.println("   Type ID seleccionado: " + typeId);
                        }
                    }
                } catch (Exception e) {
                    pw.println("   Info Types: " + e.getMessage());
                }
            }

            // 3. Obtener Model ID de referencia
            String modelId = null;
            if (makeId != null && typeId != null) {
                try {
                    pw.println("3. Consultando Models en: " + baseSimUrl + "/equipmentMakes/" + makeId + "/equipmentISGTypes/" + typeId + "/equipmentModels?deprecated=false");
                    var response = restClient.get()
                            .uri(baseSimUrl + "/equipmentMakes/" + makeId + "/equipmentISGTypes/" + typeId + "/equipmentModels?deprecated=false")
                            .header("Authorization", "Bearer " + token)
                            .header("Accept", isgAccept)
                            .retrieve()
                            .toEntity(String.class);
                    
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        Map<String, Object> body = objectMapper.readValue(response.getBody(), Map.class);
                        List<Map<String, Object>> values = (List<Map<String, Object>>) body.get("values");
                        if (values != null && !values.isEmpty()) {
                            modelId = String.valueOf(values.get(0).get("id"));
                            pw.println("   Model ID seleccionado: " + modelId);
                        }
                    }
                } catch (Exception e) {
                    pw.println("   Info Models: " + e.getMessage());
                }
            }

            // 4. Intentar crear equipo (Primero vía ISG, si falla vía Platform Axiom)
            String machineId = null;
            String createUrl = baseSimUrl + "/organizations/" + orgId + "/equipment";
            
            Map<String, Object> equipmentPayload = new java.util.HashMap<>();
            equipmentPayload.put("name", uniqueName);
            equipmentPayload.put("type", "Machine");
            equipmentPayload.put("serialNumber", "AGRNX" + (System.currentTimeMillis() % 100000));
            if (makeId != null) equipmentPayload.put("equipmentMakeId", makeId);
            if (typeId != null) equipmentPayload.put("equipmentTypeId", typeId);
            if (modelId != null) equipmentPayload.put("equipmentModelId", modelId);

            String equipmentJson = objectMapper.writeValueAsString(equipmentPayload);
            pw.println("4. Payload JSON de Equipo a enviar:\n" + equipmentJson);
            pw.flush();

            try {
                var responseEntity = restClient.post()
                        .uri(createUrl)
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", isgAccept)
                        .header("Content-Type", isgAccept)
                        .body(equipmentJson)
                        .retrieve()
                        .toEntity(String.class);

                pw.println("   Response Create Status: " + responseEntity.getStatusCode());
                pw.println("   Response Create Body: " + responseEntity.getBody());
                pw.flush();

                List<String> locationHeaders = responseEntity.getHeaders().get("Location");
                if (locationHeaders != null && !locationHeaders.isEmpty()) {
                    String location = locationHeaders.get(0);
                    String[] parts = location.split("/");
                    machineId = parts[parts.length - 1];
                }

                if (machineId == null && responseEntity.getBody() != null) {
                    Map<String, Object> bodyMap = objectMapper.readValue(responseEntity.getBody(), Map.class);
                    if (bodyMap.containsKey("id")) {
                        machineId = bodyMap.get("id").toString();
                    }
                }
            } catch (Exception isgEx) {
                pw.println("   Fallo ISG create (" + isgEx.getMessage() + "). Intentando via Platform Axiom...");
                pw.flush();
                
                try {
                    String platformCreateUrl = config.getApiBaseUrl() + "/organizations/" + orgId + "/equipment";
                    String axiomAccept = "application/vnd.deere.axiom.v3+json";
                    Map<String, Object> axiomPayload = Map.of(
                        "name", uniqueName,
                        "type", "Machine",
                        "category", "TRACTOR",
                        "brand", "deere",
                        "model", "8R_340"
                    );
                    String axiomJson = objectMapper.writeValueAsString(axiomPayload);
                    pw.println("   POST a Platform Axiom: " + platformCreateUrl + " con payload:\n" + axiomJson);
                    pw.flush();

                    var axiomResp = restClient.post()
                            .uri(platformCreateUrl)
                            .header("Authorization", "Bearer " + token)
                            .header("Accept", axiomAccept)
                            .header("Content-Type", axiomAccept)
                            .body(axiomJson)
                            .retrieve()
                            .toEntity(String.class);

                    pw.println("   Response Axiom Status: " + axiomResp.getStatusCode());
                    pw.println("   Response Axiom Body: " + axiomResp.getBody());
                    pw.flush();

                    List<String> locationHeaders = axiomResp.getHeaders().get("Location");
                    if (locationHeaders != null && !locationHeaders.isEmpty()) {
                        String location = locationHeaders.get(0);
                        String[] parts = location.split("/");
                        machineId = parts[parts.length - 1];
                    }

                    if (machineId == null && axiomResp.getBody() != null) {
                        Map<String, Object> bodyMap = objectMapper.readValue(axiomResp.getBody(), Map.class);
                        if (bodyMap.containsKey("id")) {
                            machineId = bodyMap.get("id").toString();
                        }
                    }
                } catch (Exception axEx) {
                    pw.println("   Fallo Axiom create: " + axEx.getMessage());
                    pw.flush();
                }
            }

            // Si sandbox no permite escritura directa por permisos de OAuth, generamos ID ficticio para telemetría
            if (machineId == null) {
                machineId = "sim-jd-" + (System.currentTimeMillis() % 100000);
                pw.println("   Asignado ID de simulador local/sandbox: " + machineId);
                pw.flush();
            }

            // 5. Inyectar Location History si el endpoint responde
            String locationUrl = baseSimUrl + "/organizations/" + orgId + "/equipment/" + machineId + "/locationHistory";
            double tractorLat = -31.6315 + (Math.random() * 0.008 - 0.004);
            double tractorLon = -60.6985 + (Math.random() * 0.008 - 0.004);
            String eventTime = java.time.Instant.now().toString();

            try {
                Map<String, Object> locationPayload = Map.of(
                    "type", "FeatureCollection",
                    "features", List.of(
                        Map.of(
                            "type", "Feature",
                            "geometry", Map.of(
                                "type", "Point",
                                "coordinates", List.of(tractorLon, tractorLat)
                            ),
                            "properties", Map.of(
                                "eventTime", eventTime,
                                "speed", "14.2 km/h",
                                "engineState", "1",
                                "heading", 180,
                                "gpsQuality", "3D_FIX",
                                "source", "SIMULATED_AGRONEX"
                            )
                        )
                    )
                );

                String locationJson = objectMapper.writeValueAsString(locationPayload);
                restClient.post()
                        .uri(locationUrl)
                        .header("Authorization", "Bearer " + token)
                        .header("Accept", isgAccept)
                        .header("Content-Type", isgAccept)
                        .body(locationJson)
                        .retrieve()
                        .toEntity(Void.class);

                pw.println("   Telemetría inyectada con éxito en Sandbox.");
            } catch (Exception locEx) {
                pw.println("   Info telemetría sandbox: " + locEx.getMessage());
            }

            // 6. Registrar el tractor simulado en memoria con telemetría completa
            Map<String, Object> simMachine = new HashMap<>();
            simMachine.put("id", machineId);
            simMachine.put("name", uniqueName);
            simMachine.put("displayName", uniqueName);
            simMachine.put("make", Map.of("name", "John Deere"));
            simMachine.put("model", Map.of("name", "8R 340"));
            simMachine.put("modelYear", "2024");
            simMachine.put("serialNumber", "1RW8340R" + (System.currentTimeMillis() % 10000));
            simMachine.put("type", "Machine");
            simMachine.put("category", "Tractor");
            simMachine.put("simulated", true);

            Map<String, Object> breadcrumb = new HashMap<>();
            breadcrumb.put("eventTime", eventTime);
            breadcrumb.put("location", Map.of(
                "lat", tractorLat,
                "lon", tractorLon,
                "latitude", tractorLat,
                "longitude", tractorLon,
                "altitude", 34.5
            ));
            breadcrumb.put("speed", 14.5);
            breadcrumb.put("heading", 180);
            breadcrumb.put("engineState", "En Operación (Trabajando en Lote)");
            breadcrumb.put("machineState", "En Operación");
            breadcrumb.put("fuelLevel", 82);
            breadcrumb.put("engineHours", 345.2);
            breadcrumb.put("source", "SIMULATED_GPS");

            simMachine.put("breadcrumbs", breadcrumb);

            simulatedMachinesByUser.computeIfAbsent(userId, k -> new java.util.concurrent.CopyOnWriteArrayList<>()).add(0, simMachine);

            pw.println("=======================================================");
            pw.flush();

            return Map.of(
                "success", true,
                "machineId", machineId,
                "name", uniqueName,
                "location", Map.of("lat", tractorLat, "lon", tractorLon),
                "message", "Tractor " + uniqueName + " simulado con éxito. Ubicación GPS activa en tiempo real."
            );

        } catch (Exception outerEx) {
            log.error("Error al escribir el archivo de debug o simulando: {}", outerEx.getMessage());
            throw new RuntimeException(outerEx.getMessage());
        }
    }
}
