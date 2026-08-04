package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.entity.Cotizacion;
import org.agronex.backend.repository.CotizacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.scheduling.annotation.Scheduled;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class CotizacionesService {

    private final CotizacionRepository cotizacionRepository;
    private final RestClient restClient = RestClient.create();

    // Cache en memoria (30 minutos TTL)
    private Map<String, Object> cachedResponse = null;
    private Instant cacheExpiry = Instant.EPOCH;
    private static final long CACHE_TTL_SECONDS = 1800; // 30 minutos

    private static final String MAGYP_API_URL = "https://www.magyp.gob.ar/sitio/areas/ss_mercados_agropecuarios/ws/ssma/precios_fob.php?Fecha=";
    private static final ZoneId ZONE_ARG = ZoneId.of("America/Argentina/Buenos_Aires");

    /**
     * Obtiene las cotizaciones actuales de los 6 granos de referencia.
     * Busca primero en la base de datos (caché diaria) o realiza la consulta
     * a la API del MAGyP con fallback ante fines de semana o feriados nacionales.
     */
    public synchronized Map<String, Object> getCotizacionesGranos() {
        // 1. Verificar si el caché en memoria sigue vigente
        if (cachedResponse != null && Instant.now().isBefore(cacheExpiry)) {
            return cachedResponse;
        }

        try {
            LocalDate hoyArgentina = LocalDate.now(ZONE_ARG);
            
            // 2. Intentar buscar en la base de datos para la fecha de hoy
            Optional<Cotizacion> dbCotizacionOpt = cotizacionRepository.findByFecha(hoyArgentina);
            if (dbCotizacionOpt.isPresent()) {
                log.info("Caché de base de datos encontrado para la fecha de hoy ({}).", hoyArgentina);
                Map<String, Object> response = buildResponse(dbCotizacionOpt.get());
                updateMemoryCache(response);
                return response;
            }

            // 3. Si no existe para hoy, sincronizar desde la API del MAGyP
            log.info("No se encontró cotización para la fecha de hoy en la BD. Sincronizando con MAGyP...");
            Cotizacion sincronizada = fetchAndStoreFromApi(5);
            
            // 4. Construir la respuesta final a partir del registro sincronizado (o el más reciente)
            Map<String, Object> response = buildResponse(sincronizada);
            updateMemoryCache(response);
            return response;

        } catch (Exception e) {
            log.error("Error al sincronizar cotizaciones con la API de MAGyP: {}. Usando datos de referencia/históricos.", e.getMessage());

            // 5. Fallback en caso de error: Devolver el último registro histórico disponible en la base de datos
            Optional<Cotizacion> ultimoHistorico = cotizacionRepository.findFirstByOrderByFechaDesc();
            if (ultimoHistorico.isPresent()) {
                Map<String, Object> response = buildResponse(ultimoHistorico.get());
                response.put("stale", true);
                response.put("note", "Datos del último registro histórico disponible");
                return response;
            }

            // Fallback secundario: datos por defecto si la base de datos está completamente vacía
            return buildFallbackMockResponse();
        }
    }

    /**
     * Actualiza el caché en memoria.
     */
    private void updateMemoryCache(Map<String, Object> response) {
        this.cachedResponse = response;
        this.cacheExpiry = Instant.now().plusSeconds(CACHE_TTL_SECONDS);
    }

    /**
     * Realiza las consultas con el algoritmo de reintentos decrecientes (fallback de feriados y fines de semana).
     */
    private Cotizacion fetchAndStoreFromApi(int maxAttempts) throws Exception {
        LocalDate fechaConsulta = LocalDate.now(ZONE_ARG);
        fechaConsulta = ajustarFinDeSemana(fechaConsulta);

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            String fechaFormateada = fechaConsulta.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            String url = MAGYP_API_URL + fechaFormateada;
            log.info("Conectando a API del MAGyP para la fecha: {} (Intento {}/{})", fechaFormateada, (attempt + 1), maxAttempts);

            try {
                String responseBody = restClient.get()
                        .uri(url)
                        .retrieve()
                        .body(String.class);

                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                JsonNode apiResponse = responseBody != null ? mapper.readTree(responseBody) : null;

                if (apiResponse != null && apiResponse.has("posts") && apiResponse.get("posts").isArray() && !apiResponse.get("posts").isEmpty()) {
                    JsonNode posts = apiResponse.get("posts");
                    
                    // Si ya existe la cotización de este día de fallback en la BD, la devolvemos directamente
                    Optional<Cotizacion> existente = cotizacionRepository.findByFecha(fechaConsulta);
                    if (existente.isPresent()) {
                        log.info("Los datos de la fecha de fallback {} ya existían en la base de datos.", fechaConsulta);
                        return existente.get();
                    }

                    // En caso contrario, creamos y persistimos el nuevo registro
                    Cotizacion nueva = parseGrains(posts, fechaConsulta);
                    Cotizacion guardada = cotizacionRepository.save(nueva);
                    log.info("Cotización para la fecha {} guardada exitosamente en la base de datos.", fechaConsulta);
                    return guardada;
                }
                log.warn("La API retornó datos vacíos para la fecha: {} (Posible feriado o día no laborable).", fechaFormateada);
            } catch (Exception e) {
                log.error("Error consultando la API en el intento " + (attempt + 1) + ": " + e.getMessage());
            }

            // Restar un día y reajustar si cae en fin de semana
            fechaConsulta = ajustarFinDeSemana(fechaConsulta.minusDays(1));
        }

        throw new RuntimeException("No se pudieron obtener cotizaciones del MAGyP tras " + maxAttempts + " intentos.");
    }

    private LocalDate ajustarFinDeSemana(LocalDate fecha) {
        if (fecha.getDayOfWeek() == DayOfWeek.SATURDAY) {
            return fecha.minusDays(1);
        } else if (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return fecha.minusDays(2);
        }
        return fecha;
    }

    /**
     * Mapea los NCM y embarques prompt desde el JSON de la API.
     */
    private Cotizacion parseGrains(JsonNode posts, LocalDate fechaRef) {
        Map<String, String> posiciones = Map.of(
            "soja", "12019000190C",
            "maiz", "10059010120A",
            "trigo", "10011900110H",
            "girasol", "12060090910Y", // Código estándar principal
            "sorgo", "10079000100W",
            "cebada", "10039080100A"
        );

        Map<String, BigDecimal> precios = new HashMap<>();
        int mesActual = fechaRef.getMonthValue();
        int anioActual = fechaRef.getYear();

        for (Map.Entry<String, String> entry : posiciones.entrySet()) {
            String grano = entry.getKey();
            String ncm = entry.getValue();
            BigDecimal precioFob = null;

            // 1. Filtrar registros de la posición arancelaria exacta
            List<JsonNode> matchingPosts = new ArrayList<>();
            for (JsonNode post : posts) {
                if (post.get("posicion").asText().equalsIgnoreCase(ncm)) {
                    matchingPosts.add(post);
                }
            }

            // 2. Buscar embarque del mes actual (Spot/Prompt)
            for (JsonNode post : matchingPosts) {
                if (post.get("mesDesde").asInt() == mesActual && post.get("añoDesde").asInt() == anioActual) {
                    precioFob = BigDecimal.valueOf(post.get("precio").asDouble());
                    break;
                }
            }

            // 3. Fallback al primer embarque disponible
            if (precioFob == null && !matchingPosts.isEmpty()) {
                matchingPosts.sort(Comparator.comparingInt((JsonNode a) -> a.get("añoDesde").asInt())
                        .thenComparingInt(a -> a.get("mesDesde").asInt()));
                precioFob = BigDecimal.valueOf(matchingPosts.get(0).get("precio").asDouble());
            }

            // 4. Fallback genérico por prefijo NCM (4 dígitos)
            if (precioFob == null) {
                String prefijo = ncm.substring(0, 4);
                List<JsonNode> prefixPosts = new ArrayList<>();
                for (JsonNode post : posts) {
                    if (post.get("posicion").asText().startsWith(prefijo)) {
                        prefixPosts.add(post);
                    }
                }
                if (!prefixPosts.isEmpty()) {
                    prefixPosts.sort(Comparator.comparingInt((JsonNode a) -> a.get("añoDesde").asInt())
                            .thenComparingInt(a -> a.get("mesDesde").asInt()));
                    precioFob = BigDecimal.valueOf(prefixPosts.get(0).get("precio").asDouble());
                }
            }

            precios.put(grano, precioFob);
        }

        return Cotizacion.builder()
                .fecha(fechaRef)
                .sojaFob(precios.get("soja"))
                .maizFob(precios.get("maiz"))
                .trigoFob(precios.get("trigo"))
                .girasolFob(precios.get("girasol"))
                .sorgoFob(precios.get("sorgo"))
                .cebadaFob(precios.get("cebada"))
                .build();
    }

    /**
     * Construye la respuesta formateada que consume el Frontend (CotizacionesBCR.js).
     */
    private Map<String, Object> buildResponse(Cotizacion cotizacion) {
        String fechaFormateada = cotizacion.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        Optional<Cotizacion> anteriorOpt = cotizacionRepository.findFirstByFechaBeforeOrderByFechaDesc(cotizacion.getFecha());
        Cotizacion anterior = anteriorOpt.orElse(null);

        List<Map<String, Object>> listaGranos = new ArrayList<>();
        listaGranos.add(buildGrano("Soja", "🫘", cotizacion.getSojaFob(), anterior != null ? anterior.getSojaFob() : null, "soja"));
        listaGranos.add(buildGrano("Trigo", "🌾", cotizacion.getTrigoFob(), anterior != null ? anterior.getTrigoFob() : null, "trigo"));
        listaGranos.add(buildGrano("Maíz", "🌽", cotizacion.getMaizFob(), anterior != null ? anterior.getMaizFob() : null, "maiz"));
        listaGranos.add(buildGrano("Girasol", "🌻", cotizacion.getGirasolFob(), anterior != null ? anterior.getGirasolFob() : null, "girasol"));
        listaGranos.add(buildGrano("Sorgo", "🟤", cotizacion.getSorgoFob(), anterior != null ? anterior.getSorgoFob() : null, "sorgo"));
        listaGranos.add(buildGrano("Cebada", "🌿", cotizacion.getCebadaFob(), anterior != null ? anterior.getCebadaFob() : null, "cebada"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", "Secretaría de Agricultura, Ganadería y Pesca (SAGyP)");
        result.put("fecha", fechaFormateada);
        result.put("mercado", "Precios FOB Oficiales Oficiales - Argentina");
        result.put("moneda", "USD");
        result.put("cotizaciones", listaGranos);
        result.put("apiConfigured", true);
        result.put("lastUpdate", Instant.now().toString());

        return result;
    }

    private Map<String, Object> buildGrano(String nombre, String emoji, BigDecimal precioActual, BigDecimal precioAnterior, String slug) {
        double valorActual = precioActual != null ? precioActual.doubleValue() : 0.0;
        double variacion = 0.0;

        if (precioActual != null && precioAnterior != null && precioAnterior.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = precioActual.subtract(precioAnterior);
            BigDecimal varPct = diff.multiply(BigDecimal.valueOf(100)).divide(precioAnterior, 2, RoundingMode.HALF_UP);
            variacion = varPct.doubleValue();
        }

        Map<String, Object> grano = new LinkedHashMap<>();
        grano.put("nombre", nombre);
        grano.put("emoji", emoji);
        grano.put("slug", slug);
        // Generamos spreads sintéticos de compra y venta para acoplar con la interfaz gráfica actual
        grano.put("compra", Math.round(valorActual * 0.995 * 100.0) / 100.0);
        grano.put("venta", Math.round(valorActual * 1.005 * 100.0) / 100.0);
        grano.put("cierre", valorActual);
        grano.put("variacion", variacion);
        grano.put("unidad", "USD/Tn");
        return grano;
    }

    /**
     * Respuesta alternativa por defecto si la base de datos está completamente vacía y falla la API externa.
     */
    private Map<String, Object> buildFallbackMockResponse() {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        List<Map<String, Object>> cotizaciones = new ArrayList<>();

        cotizaciones.add(buildFallbackGrano("Soja", "🫘", 435.0, -0.8, "soja"));
        cotizaciones.add(buildFallbackGrano("Trigo", "🌾", 270.0, 1.2, "trigo"));
        cotizaciones.add(buildFallbackGrano("Maíz", "🌽", 220.0, 0.5, "maiz"));
        cotizaciones.add(buildFallbackGrano("Girasol", "🌻", 390.0, -0.3, "girasol"));
        cotizaciones.add(buildFallbackGrano("Sorgo", "🟤", 195.0, 0.2, "sorgo"));
        cotizaciones.add(buildFallbackGrano("Cebada", "🌿", 210.0, -0.5, "cebada"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", "SAGyP (Datos de Referencia Offline)");
        result.put("fecha", today);
        result.put("mercado", "Mercado de Granos - Pizarra");
        result.put("moneda", "USD");
        result.put("cotizaciones", cotizaciones);
        result.put("apiConfigured", false);
        result.put("lastUpdate", Instant.now().toString());

        return result;
    }

    private Map<String, Object> buildFallbackGrano(String nombre, String emoji, double valorActual, double variacion, String slug) {
        Map<String, Object> grano = new LinkedHashMap<>();
        grano.put("nombre", nombre);
        grano.put("emoji", emoji);
        grano.put("slug", slug);
        grano.put("compra", Math.round(valorActual * 0.995 * 100.0) / 100.0);
        grano.put("venta", Math.round(valorActual * 1.005 * 100.0) / 100.0);
        grano.put("cierre", valorActual);
        grano.put("variacion", variacion);
        grano.put("unidad", "USD/Tn");
        return grano;
    }

    /**
     * Tarea programada (Cron Job) que corre de lunes a viernes a las 17:00 hs de Argentina
     * para descargar y persistir de manera proactiva la cotización oficial del día.
     */
    @Scheduled(cron = "0 0 17 * * MON-FRI", zone = "America/Argentina/Buenos_Aires")
    public void sincronizarCotizacionesDiarias() {
        log.info("[Cron] Iniciando sincronización diaria proactiva de cotizaciones MAGyP...");
        try {
            Cotizacion cot = fetchAndStoreFromApi(1);
            log.info("[Cron] Sincronización proactiva exitosa para la fecha: {}", cot.getFecha());
            // Limpiar caché en memoria para forzar recarga
            synchronized (this) {
                cachedResponse = null;
                cacheExpiry = Instant.EPOCH;
            }
        } catch (Exception e) {
            log.error("[Cron] Error durante la sincronización proactiva diaria: {}", e.getMessage());
        }
    }
}
