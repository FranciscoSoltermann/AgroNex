package org.agronex.backend.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

/**
 * Configuración global de OpenAPI / Swagger UI para AgroNex.
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("AgroNex REST API")
                        .version("1.0.0")
                        .description("Documentación oficial de la API de AgroNex. Incluye soporte para autenticación Bearer JWT.")
                        .contact(new Contact()
                                .name("AgroNex Engineering Team")
                                .email("soporte@agronex.org"))
                        .license(new License().name("Proprietary")))
                .servers(List.of(
                        new io.swagger.v3.oas.models.servers.Server().url("/").description("Servidor Actual"),
                        new io.swagger.v3.oas.models.servers.Server().url("http://localhost:8080").description("Entorno de Desarrollo"),
                        new io.swagger.v3.oas.models.servers.Server().url("https://agronex-backend.onrender.com").description("Entorno de Producción")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Token Bearer JWT obtenido tras autenticarse en Supabase/AgroNex.")));
    }
}
