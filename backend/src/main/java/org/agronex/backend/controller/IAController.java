package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.service.IAService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.agronex.backend.security.SecurityUtils;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ia")
@RequiredArgsConstructor
public class IAController {

    private final IAService iaService;

    @GetMapping("/evaluar-campania/{idCampania}")
    public ResponseEntity<Map<String, String>> evaluarCampania(
            @PathVariable String idCampania,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        String evaluacion = iaService.evaluarCampania(idCampania, idUsuario);
        return ResponseEntity.ok(Map.of("respuesta", evaluacion));
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chatAgronomico(@RequestBody Map<String, String> body) {
        String pregunta = body.getOrDefault("pregunta", "");
        String respuesta = iaService.chatAgronomico(pregunta);
        return ResponseEntity.ok(Map.of("respuesta", respuesta));
    }
}
