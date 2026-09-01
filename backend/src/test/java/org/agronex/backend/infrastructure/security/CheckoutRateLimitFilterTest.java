package org.agronex.backend.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckoutRateLimitFilterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private CheckoutRateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new CheckoutRateLimitFilter(null); // Local bucket fallback by default
        ReflectionTestUtils.setField(filter, "requestsPerMinute", 5);
        ReflectionTestUtils.setField(filter, "authRegistroRequestsPerMinute", 5);
        ReflectionTestUtils.setField(filter, "trustedProxyIpsRaw", "10.0.0.1,192.168.1.1");
    }

    @Test
    @DisplayName("shouldNotFilter - Ignora peticiones GET o rutas no protegidas")
    void shouldNotFilter_rutasNoProtegidas_retornaTrue() {
        when(request.getMethod()).thenReturn("GET");
        assertTrue(filter.shouldNotFilter(request));

        when(request.getMethod()).thenReturn("POST");
        when(request.getServletPath()).thenReturn("/api/campos");
        assertTrue(filter.shouldNotFilter(request));

        when(request.getServletPath()).thenReturn("/api/public/subscriptions/mercadopago/checkout");
        assertFalse(filter.shouldNotFilter(request));
    }

    @Test
    @DisplayName("doFilterInternal - Permite peticiones dentro del límite en memoria")
    void doFilterInternal_dentroDelLimite_permitePeticion() throws ServletException, IOException {
        when(request.getServletPath()).thenReturn("/api/public/subscriptions/mercadopago/checkout");
        when(request.getRemoteAddr()).thenReturn("190.1.1.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    @Test
    @DisplayName("doFilterInternal - Bloquea peticiones al exceder el límite en memoria (HTTP 429)")
    void doFilterInternal_excedeLimite_bloqueaCon429() throws ServletException, IOException {
        when(request.getServletPath()).thenReturn("/api/public/subscriptions/mercadopago/checkout");
        when(request.getRemoteAddr()).thenReturn("190.1.1.2");

        StringWriter sw = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(sw));

        // Consumir 5 solicitudes permitidas
        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        // La 6ta solicitud debe ser bloqueada
        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        verify(response).setHeader(eq("Retry-After"), anyString());
    }

    @Test
    @DisplayName("doFilterInternal - Usa Redis cuando está disponible")
    void doFilterInternal_conRedis_utilizaIncrement() throws ServletException, IOException {
        CheckoutRateLimitFilter redisFilter = new CheckoutRateLimitFilter(redisTemplate);
        ReflectionTestUtils.setField(redisFilter, "requestsPerMinute", 5);
        ReflectionTestUtils.setField(redisFilter, "authRegistroRequestsPerMinute", 5);

        when(request.getServletPath()).thenReturn("/api/public/subscriptions/mercadopago/checkout");
        when(request.getRemoteAddr()).thenReturn("190.1.1.3");
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(1L);

        redisFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(redisTemplate).expire(anyString(), any(java.time.Duration.class));
    }

    @Test
    @DisplayName("clientIp - Respeta X-Forwarded-For solo si viene de proxy confiable")
    void clientIp_proxyConfiable_usaXForwardedFor() throws ServletException, IOException {
        when(request.getServletPath()).thenReturn("/api/public/subscriptions/mercadopago/checkout");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1"); // Trusted proxy
        when(request.getHeader("X-Forwarded-For")).thenReturn("200.5.5.5, 10.0.0.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }
}
