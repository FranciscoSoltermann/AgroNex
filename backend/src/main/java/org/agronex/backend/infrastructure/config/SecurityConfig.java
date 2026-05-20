package org.agronex.backend.infrastructure.config;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.infrastructure.security.CheckoutRateLimitFilter;
import org.agronex.backend.infrastructure.security.RolJwtAuthenticationConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import java.util.Set;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Configuración de seguridad de AgroNex.
 *
 * Roles:
 *  - ROLE_ADMIN       → audit completo, acceso total
 *  - ROLE_PROPIETARIO → CRUD sobre sus propios recursos
 *  - ROLE_EMPLEADO    → solo lectura (GET)
 *  - ROLE_USER        → base: cualquier JWT válido de Supabase
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final RolJwtAuthenticationConverter rolJwtAuthenticationConverter;
    private final CheckoutRateLimitFilter checkoutRateLimitFilter;

    /** Orígenes CORS separados por coma en la variable de entorno CORS_ALLOWED_ORIGINS */
    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOriginsRaw;

    /** Perfil de ejecución actual para endurecer validaciones en producción. */
    @Value("${spring.profiles.active:default}")
    private String activeProfiles;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Rate limit checkout MP antes de autenticación (VUL-02)
            .addFilterBefore(checkoutRateLimitFilter, BearerTokenAuthenticationFilter.class)

            // ── CORS ──────────────────────────────────────────────────
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ── CSRF desactivado: API stateless con JWT ────────────────
            .csrf(csrf -> csrf.disable())

            // ── Cabeceras de seguridad ─────────────────────────────────
            .headers(headers -> headers
                .contentTypeOptions(opt -> {})
                .frameOptions(frame -> frame.deny())
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31_536_000)
                )
                .referrerPolicy(ref -> ref
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)
                )
                .permissionsPolicyHeader(policy ->
                    policy.policy("camera=(), microphone=(), geolocation=()")
                )
                // VUL-M04: Content-Security-Policy para prevenir XSS en páginas de error y Swagger
                .contentSecurityPolicy(csp ->
                    csp.policyDirectives("default-src 'self'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
                )
            )

            // ── Sin sesión HTTP (JWT stateless) ────────────────────────
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ── Reglas de autorización por endpoint ─────────────────────
            .authorizeHttpRequests(auth -> auth

                // Validación de disponibilidad (sin JWT)
                .requestMatchers(HttpMethod.POST, "/api/public/auth/registro/validar-disponibilidad")
                    .permitAll()

                // Registro: el supabaseId sale del JWT — debe estar autenticado (VUL-08)
                .requestMatchers(HttpMethod.POST,
                        "/api/public/auth/registro/fisica",
                        "/api/public/auth/registro/juridica")
                    .authenticated()

                // Callback OAuth de John Deere (redirect externo, sin JWT de AgroNex)
                .requestMatchers("/api/maquinaria/john-deere/auth/callback")
                    .permitAll()

                // Resto de rutas públicas (checkout, webhook MP, etc.)
                .requestMatchers("/api/public/**", "/public/**").permitAll()

                // VUL-M01: Swagger/OpenAPI requiere ROLE_ADMIN (no exponer la API a usuarios anónimos)
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                    .hasAuthority("ROLE_ADMIN")

                // Audit "todos" → solo ADMIN
                .requestMatchers(HttpMethod.GET, "/api/audit/todos")
                    .hasAuthority("ROLE_ADMIN")

                // Audit propio → cualquier autenticado
                .requestMatchers(HttpMethod.GET, "/api/audit/mis-eventos")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_PROPIETARIO", "ROLE_EMPLEADO")

                // EMPLEADO puede marcar sus notificaciones; el resto de escrituras no
                .requestMatchers(HttpMethod.PUT, "/api/notificaciones/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_PROPIETARIO", "ROLE_EMPLEADO")

                // Mutaciones sobre datos de negocio → PROPIETARIO o ADMIN (no EMPLEADO)
                .requestMatchers(HttpMethod.DELETE, "/api/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_PROPIETARIO")
                .requestMatchers(HttpMethod.POST, "/api/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_PROPIETARIO")
                .requestMatchers(HttpMethod.PUT, "/api/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_PROPIETARIO")
                .requestMatchers(HttpMethod.PATCH, "/api/**")
                    .hasAnyAuthority("ROLE_ADMIN", "ROLE_PROPIETARIO")

                // Lecturas y rutas restantes → JWT válido (incl. EMPLEADO en GET)
                .anyRequest().authenticated()
            )

            // ── Resource server con JWT y conversión de roles desde DB ──
            .oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
                jwt.jwtAuthenticationConverter(rolJwtAuthenticationConverter)
            ));
            // Se remueve oauth2Login() nativo porque usamos el flujo manual JWT-state


        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());

        // Para desarrollo local, agregamos también 127.0.0.1 de forma segura
        String profiles = activeProfiles == null ? "" : activeProfiles.toLowerCase(Locale.ROOT);
        boolean isProd = profiles.contains("prod") || profiles.contains("production");
        if (!isProd) {
            if (!origins.contains("http://127.0.0.1:3000")) origins.add("http://127.0.0.1:3000");
            if (!origins.contains("http://127.0.0.1:3001")) origins.add("http://127.0.0.1:3001");
        }

        if (origins.isEmpty()) {
            throw new IllegalStateException("CORS_ALLOWED_ORIGINS no puede estar vacío.");
        }

        if (isProd) {
            boolean invalidProdOrigin = origins.stream().anyMatch(origin ->
                    origin.contains("*") || origin.contains("localhost") || origin.startsWith("http://")
            );
            if (invalidProdOrigin) {
                throw new IllegalStateException(
                        "Configuración CORS insegura para producción. Use solo orígenes HTTPS explícitos."
                );
            }
        }

        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        // VUL-CORS: Permitimos cualquier header en desarrollo y producción segura para evitar preflight blocks
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("X-Total-Count", "Link"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Cache preflight 1 hora

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        try {
            // JWK Set estático obtenido directamente de Supabase para evitar timeouts de red saliente
            String jwkSetJson = "{\"keys\":[{\"alg\":\"ES256\",\"crv\":\"P-256\",\"ext\":true,\"key_ops\":[\"verify\"],\"kid\":\"af8da56c-0cd5-4109-841e-35de777acae2\",\"kty\":\"EC\",\"use\":\"sig\",\"x\":\"ZIcX5bHrnjqRPSz_Km-OaZA05REvA6hXUFFvX860b1w\",\"y\":\"vkuvP28i9Tvn3fjB7PjOtMCybZDKUJW7TKVkrDoNXW4\"}]}";
            JWKSet jwkSet = JWKSet.parse(jwkSetJson);
            JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(jwkSet);
            DefaultJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();
            JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(
                    Set.of(JWSAlgorithm.ES256), jwkSource);
            jwtProcessor.setJWSKeySelector(keySelector);
            return new NimbusJwtDecoder(jwtProcessor);
        } catch (Exception e) {
            throw new IllegalStateException("Error al inicializar JwtDecoder con JWK Set local", e);
        }
    }
}

