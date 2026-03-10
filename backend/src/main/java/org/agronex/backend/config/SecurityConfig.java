package org.agronex.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${supabase.jwt.secret}")
    private String jwtSecret;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Configuramos CORS para que acepte peticiones de tu Frontend
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 2. Desactivamos CSRF (No es necesario en APIs REST que usan tokens JWT Bearer)
                .csrf(csrf -> csrf.disable())

                // 3. API Stateless: Spring no guarda datos de sesión, confía 100% en el JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. Reglas de rutas (Acá definís qué es público y qué es privado)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/public/**").permitAll() // Rutas abiertas (ej: login/registro si lo manejaras acá)
                        .anyRequest().authenticated() // CUALQUIER otra ruta exige token válido
                )

                // 5. Le decimos que valide la seguridad usando nuestro decodificador de Supabase
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.decoder(jwtDecoder()))
                );

        return http.build();
    }

    // --- DECODIFICADOR DEL JWT DE SUPABASE ---
    @Bean
    public JwtDecoder jwtDecoder() {
        // Supabase usa el algoritmo HS256 (HMAC SHA-256) para firmar sus tokens
        SecretKey secretKey = new SecretKeySpec(jwtSecret.getBytes(), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(secretKey).build();
    }

    // --- CONFIGURACIÓN DE CORS (Frontend <-> Backend) ---
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Poner acá la URL exacta de tu frontend (ej: http://localhost:3000 para Next.js)
        config.setAllowedOrigins(List.of("http://localhost:3000"));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true); // Necesario si en el futuro mandas cookies

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // Aplica a todas las rutas
        return source;
    }
}