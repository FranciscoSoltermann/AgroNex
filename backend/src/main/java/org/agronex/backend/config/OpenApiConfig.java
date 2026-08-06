package org.agronex.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "AgroNex API",
                version = "v1.0.0",
                description = "API REST para la gestión agrícola de AgroNex, integrando telemetría de John Deere, pagos de MercadoPago, y administración de campos.",
                contact = @Contact(
                        name = "Soporte AgroNex",
                        email = "soporte@agronex.com"
                ),
                license = @License(
                        name = "Uso Privado",
                        url = "https://agronex.vercel.app/terms"
                )
        ),
        servers = {
                @Server(url = "/", description = "Servidor Actual"),
                @Server(url = "http://localhost:8080", description = "Entorno de Desarrollo"),
                @Server(url = "https://agronex-backend.onrender.com", description = "Entorno de Producción")
        },
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Token JWT provisto por Supabase Auth. Utiliza el header 'Authorization: Bearer <token>'."
)
public class OpenApiConfig {
}
