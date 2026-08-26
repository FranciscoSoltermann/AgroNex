package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.entity.CotizacionBcrPizarra;
import org.agronex.backend.repository.CotizacionBcrPizarraRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Servicio que obtiene los Precios de Pizarra de la Cámara Arbitral de Cereales (CAC)
 * de la Bolsa de Comercio de Rosario mediante web scraping con Jsoup.
 *
 * Fuente: https://www.cac.bcr.com.ar/es/precios-de-pizarra
 *
 * La página CAC BCR renderiza los precios vía Drupal SSR dentro de bloques con
 * clases CSS .board-{grano} y el precio en .price (ARS) y .bottom .cell (USD).
 *
 * Características:
 * - Scraping con Jsoup + User-Agent de navegador real
 * - Caché en memoria (30 minutos TTL)
 * - Persistencia en base de datos PostgreSQL
 * - Cron job diario a las 17:00 hs Argentina (lunes a viernes)
 * - Fallback con datos de referencia si el scraping falla
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CotizacionesBcrPizarraService {

    private final CotizacionBcrPizarraRepository repository;

    // URL principal de la Cámara Arbitral de Cereales
    private static final String CAC_PIZARRA_URL = "https://www.cac.bcr.com.ar/es/precios-de-pizarra";

    private static final ZoneId ZONE_ARG = ZoneId.of("America/Argentina/Buenos_Aires");

    // User-Agent de navegador real para evitar bloqueos
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

    // Caché en memoria (30 minutos TTL)
    private Map<String, Object> cachedResponse = null;
    private Instant cacheExpiry = Instant.EPOCH;
    private static final long CACHE_TTL_SECONDS = 1800; // 30 minutos

    // Timeout de conexión y lectura (en milisegundos)
    private static final int CONNECT_TIMEOUT_MS = 15000;

    // Mapeo de clases CSS de la CAC BCR a slugs internos
    private static final Map<String, String> BOARD_CSS_TO_SLUG = Map.of(
            "board-trigo", "trigo",
            "board-maiz", "maiz",
            "board-girasol", "girasol",
            "board-soja", "soja",
            "board-sorgo", "sorgo"
    );

    /**
     * Obtiene las cotizaciones de pizarra de la BCR/CAC.
     * Busca primero en caché en memoria, luego en BD, luego hace scraping.
     */
    public synchronized Map<String, Object> getCotizacionesPizarra() {
        // 1. Verificar caché en memoria
        if (cachedResponse != null && Instant.now().isBefore(cacheExpiry)) {
            return cachedResponse;
        }

        try {
            LocalDate hoyArgentina = LocalDate.now(ZONE_ARG);

            // 2. Buscar en base de datos para hoy
            Optional<CotizacionBcrPizarra> dbOpt = repository.findByFecha(hoyArgentina);
            if (dbOpt.isPresent()) {
                log.info("[BCR Pizarra] Datos encontrados en BD para la fecha de hoy ({}).", hoyArgentina);
                Map<String, Object> response = buildResponse(dbOpt.get());
                updateMemoryCache(response);
                return response;
            }

            // 3. No hay datos de hoy → hacer scraping
            log.info("[BCR Pizarra] No hay datos en BD para hoy. Iniciando scraping...");
            CotizacionBcrPizarra scraped = scrapeAndStore();

            if (scraped != null) {
                Map<String, Object> response = buildResponse(scraped);
                updateMemoryCache(response);
                return response;
            }

            // 4. Scraping falló → buscar el registro más reciente en BD
            Optional<CotizacionBcrPizarra> ultimoOpt = repository.findFirstByOrderByFechaDesc();
            if (ultimoOpt.isPresent()) {
                log.warn("[BCR Pizarra] Scraping falló. Usando último registro histórico: {}", ultimoOpt.get().getFecha());
                Map<String, Object> response = buildResponse(ultimoOpt.get());
                response.put("stale", true);
                response.put("note", "Datos del último registro histórico disponible");
                updateMemoryCache(response);
                return response;
            }

        } catch (Exception e) {
            log.error("[BCR Pizarra] Error general al obtener cotizaciones: {}", e.getMessage());

            // Fallback: último registro histórico
            Optional<CotizacionBcrPizarra> ultimoHistorico = repository.findFirstByOrderByFechaDesc();
            if (ultimoHistorico.isPresent()) {
                Map<String, Object> response = buildResponse(ultimoHistorico.get());
                response.put("stale", true);
                return response;
            }
        }

        // 5. Fallback final: datos de referencia
        return buildFallbackResponse();
    }

    /**
     * Realiza el scraping de la página de la CAC BCR y persiste los datos.
     */
    private CotizacionBcrPizarra scrapeAndStore() {
        Map<String, BigDecimal> precios = scrapeFromCac();

        if (precios.isEmpty()) {
            log.error("[BCR Pizarra] No se pudieron obtener precios de la CAC BCR.");
            return null;
        }

        LocalDate hoy = LocalDate.now(ZONE_ARG);
        // Ajustar por fin de semana (los precios se publican L-V)
        hoy = ajustarFinDeSemana(hoy);

        // Verificar si ya existe
        Optional<CotizacionBcrPizarra> existente = repository.findByFecha(hoy);
        if (existente.isPresent()) {
            return existente.get();
        }

        CotizacionBcrPizarra nueva = CotizacionBcrPizarra.builder()
                .fecha(hoy)
                .trigoPizarra(precios.get("trigo"))
                .maizPizarra(precios.get("maiz"))
                .girasolPizarra(precios.get("girasol"))
                .sojaPizarra(precios.get("soja"))
                .sorgoPizarra(precios.get("sorgo"))
                .build();

        CotizacionBcrPizarra guardada = repository.save(nueva);
        log.info("[BCR Pizarra] Cotización guardada para fecha: {} — Precios: {}", hoy, precios);
        return guardada;
    }

    /**
     * Scraping de la página principal de la CAC BCR (precios-de-pizarra).
     *
     * Estructura HTML de la CAC BCR (Drupal SSR):
     * <pre>
     * &lt;div class="board board-trigo"&gt;
     *   &lt;div class="board-wrapper"&gt;
     *     &lt;h3&gt;Trigo&lt;/h3&gt;
     *     &lt;div class="price"&gt; $335.250,00 &lt;/div&gt;
     *     &lt;div class="bottom"&gt;
     *       &lt;div class="cell"&gt;
     *         &lt;strong&gt;US$&lt;/strong&gt; 225,00
     *       &lt;/div&gt;
     *     &lt;/div&gt;
     *   &lt;/div&gt;
     * &lt;/div&gt;
     * </pre>
     */
    private Map<String, BigDecimal> scrapeFromCac() {
        Map<String, BigDecimal> precios = new LinkedHashMap<>();

        try {
            log.info("[BCR Pizarra] Conectando a: {}", CAC_PIZARRA_URL);
            Document doc = Jsoup.connect(CAC_PIZARRA_URL)
                    .userAgent(USER_AGENT)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "es-AR,es;q=0.9,en;q=0.8")
                    .header("Accept-Encoding", "gzip, deflate, br")
                    .header("Connection", "keep-alive")
                    .referrer("https://www.google.com/")
                    .timeout(CONNECT_TIMEOUT_MS)
                    .get();

            log.debug("[BCR Pizarra] HTML obtenido, título: {}", doc.title());

            // Iterar sobre cada grano usando las clases CSS exactas de la CAC
            for (Map.Entry<String, String> entry : BOARD_CSS_TO_SLUG.entrySet()) {
                String cssClass = entry.getKey();
                String slug = entry.getValue();

                // Selector: <div class="board board-trigo">
                Element boardDiv = doc.selectFirst("div.board." + cssClass);
                if (boardDiv == null) {
                    log.warn("[BCR Pizarra] No se encontró el bloque para: {}", cssClass);
                    continue;
                }

                // Extraer precio ARS desde <div class="price">
                Element priceDiv = boardDiv.selectFirst("div.price");
                if (priceDiv == null) {
                    log.warn("[BCR Pizarra] No se encontró div.price para: {}", slug);
                    continue;
                }

                // El precio puede ser directo: "$335.250,00" 
                // o estimado: "S/C (E) $737.550,00"
                String priceText = priceDiv.text().trim();
                BigDecimal precio = parsePrecioArs(priceText);

                if (precio != null && precio.compareTo(BigDecimal.ZERO) > 0) {
                    precios.put(slug, precio);
                    log.info("[BCR Pizarra] {} → ARS {}", slug, precio);
                } else {
                    log.warn("[BCR Pizarra] No se pudo parsear precio para {}: '{}'", slug, priceText);
                }
            }

            if (!precios.isEmpty()) {
                log.info("[BCR Pizarra] Scraping exitoso. {} granos extraídos: {}", precios.size(), precios.keySet());
            }

        } catch (Exception e) {
            log.error("[BCR Pizarra] Error al hacer scraping de CAC: {}", e.getMessage());
        }

        return precios;
    }

    /**
     * Parsea el texto del precio ARS de la pizarra BCR.
     * Maneja formatos como:
     * - " $335.250,00 "
     * - " S/C  (E) $737.550,00"
     * - "$521.500,00"
     */
    private BigDecimal parsePrecioArs(String text) {
        if (text == null || text.isBlank()) return null;

        try {
            // Buscar el último patrón de precio con $ (puede haber "(E)" antes)
            java.util.regex.Matcher matcher = java.util.regex.Pattern
                    .compile("\\$\\s*([\\d.]+,\\d{2})")
                    .matcher(text);

            String lastMatch = null;
            while (matcher.find()) {
                lastMatch = matcher.group(1);
            }

            if (lastMatch == null) return null;

            // Formato argentino: "335.250,00" → "335250.00"
            String cleaned = lastMatch.replace(".", "").replace(",", ".");
            return new BigDecimal(cleaned).setScale(2, RoundingMode.HALF_UP);

        } catch (NumberFormatException e) {
            log.warn("[BCR Pizarra] Error parseando precio: '{}' → {}", text, e.getMessage());
            return null;
        }
    }

    private LocalDate ajustarFinDeSemana(LocalDate fecha) {
        if (fecha.getDayOfWeek() == DayOfWeek.SATURDAY) {
            return fecha.minusDays(1);
        } else if (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return fecha.minusDays(2);
        }
        return fecha;
    }

    private void updateMemoryCache(Map<String, Object> response) {
        this.cachedResponse = response;
        this.cacheExpiry = Instant.now().plusSeconds(CACHE_TTL_SECONDS);
    }

    /**
     * Construye la respuesta JSON que consume el frontend.
     * Incluye precio en ARS (original) para que el frontend pueda
     * convertir a USD usando useCurrency si el usuario lo prefiere.
     */
    private Map<String, Object> buildResponse(CotizacionBcrPizarra cotizacion) {
        String fechaFormateada = cotizacion.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        // Buscar cotización anterior para calcular variaciones
        Optional<CotizacionBcrPizarra> anteriorOpt = repository.findFirstByFechaBeforeOrderByFechaDesc(cotizacion.getFecha());
        CotizacionBcrPizarra anterior = anteriorOpt.orElse(null);

        List<Map<String, Object>> listaGranos = new ArrayList<>();
        listaGranos.add(buildGrano("Soja", "🫘", cotizacion.getSojaPizarra(), anterior != null ? anterior.getSojaPizarra() : null, "soja"));
        listaGranos.add(buildGrano("Trigo", "🌾", cotizacion.getTrigoPizarra(), anterior != null ? anterior.getTrigoPizarra() : null, "trigo"));
        listaGranos.add(buildGrano("Maíz", "🌽", cotizacion.getMaizPizarra(), anterior != null ? anterior.getMaizPizarra() : null, "maiz"));
        listaGranos.add(buildGrano("Girasol", "🌻", cotizacion.getGirasolPizarra(), anterior != null ? anterior.getGirasolPizarra() : null, "girasol"));
        listaGranos.add(buildGrano("Sorgo", "🟤", cotizacion.getSorgoPizarra(), anterior != null ? anterior.getSorgoPizarra() : null, "sorgo"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", "Cámara Arbitral de Cereales (CAC) — BCR");
        result.put("fecha", fechaFormateada);
        result.put("mercado", "Precios de Pizarra — Rosario");
        result.put("moneda", "ARS");
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
        grano.put("compra", Math.round(valorActual * 0.995 * 100.0) / 100.0);
        grano.put("venta", Math.round(valorActual * 1.005 * 100.0) / 100.0);
        grano.put("cierre", valorActual);
        grano.put("variacion", variacion);
        grano.put("unidad", "ARS/Tn");
        return grano;
    }

    /**
     * Respuesta de fallback con datos de referencia cuando no hay datos disponibles.
     * Precios basados en los valores reales de la CAC BCR al 21/08/2026.
     */
    private Map<String, Object> buildFallbackResponse() {
        String today = LocalDate.now(ZONE_ARG).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        List<Map<String, Object>> cotizaciones = new ArrayList<>();

        cotizaciones.add(buildFallbackGrano("Soja", "🫘", 521500.0, 0.0, "soja"));
        cotizaciones.add(buildFallbackGrano("Trigo", "🌾", 335250.0, 0.0, "trigo"));
        cotizaciones.add(buildFallbackGrano("Maíz", "🌽", 266710.0, 0.0, "maiz"));
        cotizaciones.add(buildFallbackGrano("Girasol", "🌻", 737550.0, 0.0, "girasol"));
        cotizaciones.add(buildFallbackGrano("Sorgo", "🟤", 278630.0, 0.0, "sorgo"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", "CAC — BCR (Datos de Referencia Offline)");
        result.put("fecha", today);
        result.put("mercado", "Precios de Pizarra — Rosario");
        result.put("moneda", "ARS");
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
        grano.put("unidad", "ARS/Tn");
        return grano;
    }

    /**
     * Cron Job: se ejecuta de lunes a viernes a las 17:00 hs de Argentina (UTC-3).
     * A esa hora se fijan los precios de pizarra de la jornada.
     */
    @Scheduled(cron = "0 0 17 * * MON-FRI", zone = "America/Argentina/Buenos_Aires")
    public void sincronizarPizarraDiaria() {
        log.info("[BCR Pizarra Cron] Iniciando sincronización diaria de precios de pizarra...");
        try {
            CotizacionBcrPizarra cotizacion = scrapeAndStore();
            if (cotizacion != null) {
                log.info("[BCR Pizarra Cron] Sincronización exitosa para la fecha: {}", cotizacion.getFecha());
                // Limpiar caché para forzar recarga con datos frescos
                synchronized (this) {
                    cachedResponse = null;
                    cacheExpiry = Instant.EPOCH;
                }
            } else {
                log.warn("[BCR Pizarra Cron] No se obtuvieron datos en la sincronización diaria.");
            }
        } catch (Exception e) {
            log.error("[BCR Pizarra Cron] Error durante la sincronización diaria: {}", e.getMessage());
        }
    }
}
