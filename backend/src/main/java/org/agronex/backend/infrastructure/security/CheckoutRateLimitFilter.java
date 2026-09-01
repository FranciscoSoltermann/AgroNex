package org.agronex.backend.infrastructure.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limita solicitudes a endpoints públicos sensibles por dirección IP.
 * Cubre: checkout de Mercado Pago y validación de disponibilidad en registro.
 *
 * Soporta Rate Limiting distribuido con Redis, con fallback automático en memoria (Bucket4j).
 *
 * SEGURIDAD (VUL-A01 CORREGIDO): la extracción de IP ahora es defensiva.
 * El header {@code X-Forwarded-For} solo se usa si la petición proviene de la
 * lista de proxies confiables configurada en {@code trusted.proxy.ips}. Si el
 * request llega directamente (sin proxy o desde un IP no confiable), se usa
 * {@code RemoteAddr} para evitar spoofing.
 */
@Slf4j
@Component
public class CheckoutRateLimitFilter extends OncePerRequestFilter {

    private static final String CHECKOUT_PATH = "/api/public/subscriptions/mercadopago/checkout";
    private static final String REGISTRO_DISPONIBILIDAD_PATH = "/api/public/auth/registro/validar-disponibilidad";

    @Value("${public.mercadopago.checkout.rate-limit-per-minute:15}")
    private int requestsPerMinute;

    @Value("${public.auth.registro.rate-limit-per-minute:20}")
    private int authRegistroRequestsPerMinute;

    /**
     * IPs de proxies confiables separadas por coma (ej: 10.0.0.1,172.16.0.1).
     * Solo desde estas IPs se respetará el header X-Forwarded-For.
     * En producción configurar con los IPs del load balancer / nginx.
     */
    @Value("${trusted.proxy.ips:}")
    private String trustedProxyIpsRaw;

    private final StringRedisTemplate redisTemplate;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public CheckoutRateLimitFilter(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getServletPath();
        return !CHECKOUT_PATH.equals(path) && !REGISTRO_DISPONIBILIDAD_PATH.equals(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String ip = clientIp(request);
        String path = request.getServletPath();
        boolean allowed = tryConsume(ip, path);

        if (allowed) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Demasiadas solicitudes. Intenta más tarde.\"}");
        }
    }

    private boolean tryConsume(String ip, String path) {
        int cap = getCap(path);
        if (redisTemplate != null) {
            try {
                String redisKey = "ratelimit:" + path.replace("/", "_") + ":" + ip;
                Long current = redisTemplate.opsForValue().increment(redisKey);
                if (current != null && current == 1) {
                    redisTemplate.expire(redisKey, Duration.ofMinutes(1));
                }
                return current != null && current <= cap;
            } catch (Exception e) {
                log.debug("Redis no disponible para rate limit, usando fallback local en memoria: {}", e.getMessage());
            }
        }

        String bucketKey = ip + "|" + path;
        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> newBucket(path));
        return bucket.tryConsume(1);
    }

    private int getCap(String path) {
        int configured = CHECKOUT_PATH.equals(path) ? requestsPerMinute : authRegistroRequestsPerMinute;
        return Math.max(1, Math.min(configured, 120));
    }

    private Bucket newBucket(String path) {
        int cap = getCap(path);
        Bandwidth limit = Bandwidth.builder()
                .capacity(cap)
                .refillGreedy(cap, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Extrae la IP real del cliente de forma segura.
     *
     * VUL-A01: X-Forwarded-For solo se acepta si el RemoteAddr del request pertenece
     * a los proxies configurados como confiables. Esto previene IP spoofing desde
     * clientes directos que inyecten el header manualmente.
     */
    private String clientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return "unknown";
        }

        // Solo confiar en X-Forwarded-For si el request llega desde un proxy confiable
        if (isFromTrustedProxy(remoteAddr)) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                String firstIp = xff.split(",")[0].trim();
                if (!firstIp.isBlank()) {
                    return firstIp;
                }
            }
        }

        return remoteAddr;
    }

    private Set<String> parsedTrustedProxies;

    private boolean isFromTrustedProxy(String remoteAddr) {
        if (parsedTrustedProxies == null) {
            parsedTrustedProxies = new java.util.HashSet<>();
            if (trustedProxyIpsRaw != null && !trustedProxyIpsRaw.isBlank()) {
                for (String ip : trustedProxyIpsRaw.split(",")) {
                    String trimmed = ip.trim();
                    if (!trimmed.isBlank()) {
                        parsedTrustedProxies.add(trimmed);
                    }
                }
            }
        }
        return parsedTrustedProxies.contains(remoteAddr);
    }
}
