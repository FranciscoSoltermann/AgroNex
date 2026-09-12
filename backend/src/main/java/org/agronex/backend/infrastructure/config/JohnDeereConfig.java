package org.agronex.backend.infrastructure.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de la integración con John Deere Operations Center.
 * Las credenciales se inyectan desde variables de entorno.
 */
@Configuration
@ConfigurationProperties(prefix = "john-deere")
@Getter
@Setter
public class JohnDeereConfig {

    /** Client ID de la aplicación registrada en developer.deere.com */
    private String clientId;

    /** Client Secret de la aplicación registrada en developer.deere.com */
    private String clientSecret;

    /** URL para autorización OAuth */
    private String authUrl = "https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize";

    /** URL para obtener tokens OAuth (client_credentials) */
    private String tokenUrl = "https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token";

    /** Base URL de la API (sandbox por defecto) */
    private String apiBaseUrl = "https://sandboxapi.deere.com/platform";

    /** Sanitiza apiBaseUrl para evitar dobles barras al concatenar */
    public String getApiBaseUrl() {
        if (apiBaseUrl == null || apiBaseUrl.isBlank()) {
            return "https://sandboxapi.deere.com/platform";
        }
        return apiBaseUrl.trim().replaceAll("/+$", "");
    }

    /** Indica si la integración está habilitada (requiere credenciales) */
    public boolean isEnabled() {
        return clientId != null && !clientId.isBlank()
            && clientSecret != null && !clientSecret.isBlank();
    }
}
