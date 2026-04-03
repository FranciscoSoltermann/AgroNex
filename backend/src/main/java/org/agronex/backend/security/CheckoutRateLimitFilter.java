package org.agronex.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limita solicitudes al checkout público de Mercado Pago por dirección IP (VUL-02).
 */
@Component
public class CheckoutRateLimitFilter extends OncePerRequestFilter {

    private static final String CHECKOUT_PATH = "/api/public/subscriptions/mercadopago/checkout";
    private static final String REGISTRO_DISPONIBILIDAD_PATH = "/api/public/auth/registro/validar-disponibilidad";

    @Value("${public.mercadopago.checkout.rate-limit-per-minute:15}")
    private int requestsPerMinute;

    @Value("${public.auth.registro.rate-limit-per-minute:20}")
    private int authRegistroRequestsPerMinute;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

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
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String ip = clientIp(request);
        String path = request.getServletPath();
        String bucketKey = ip + "|" + path;
        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> newBucket(path));
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Demasiadas solicitudes. Intenta más tarde.\"}");
        }
    }

    private Bucket newBucket(String path) {
        int configured = CHECKOUT_PATH.equals(path) ? requestsPerMinute : authRegistroRequestsPerMinute;
        int cap = Math.max(1, Math.min(configured, 120));
        Bandwidth limit = Bandwidth.classic(cap, Refill.intervally(cap, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
