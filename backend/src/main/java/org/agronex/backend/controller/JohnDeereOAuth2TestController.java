package org.agronex.backend.controller;

import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/maquinaria/john-deere/test")
public class JohnDeereOAuth2TestController {

    /**
     * Ejemplo de cómo extraer el token automáticamente con Spring Security OAuth2 Client
     * y hacer una llamada a la API de John Deere.
     */
    @GetMapping("/organizations")
    public ResponseEntity<String> testJohnDeereApi(
            @RegisteredOAuth2AuthorizedClient("johndeere") OAuth2AuthorizedClient authorizedClient) {
        
        String accessToken = authorizedClient.getAccessToken().getTokenValue();
        
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        // Header requerido por la API de John Deere
        headers.set("Accept", "application/vnd.deere.axiom.v3+json");
        
        HttpEntity<String> entity = new HttpEntity<>("", headers);
        
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://sandboxapi.deere.com/platform/organizations",
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error al consumir API JD: " + e.getMessage());
        }
    }
}
