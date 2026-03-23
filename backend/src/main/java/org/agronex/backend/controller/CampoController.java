package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.security.SecurityUtils;
import org.agronex.backend.service.CampoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/campos")
@RequiredArgsConstructor
public class CampoController {

    private final CampoService campoService;

    @PostMapping
    public ResponseEntity<?> crearCampo(@RequestBody CampoRequest request, @AuthenticationPrincipal Jwt jwt) {
        SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(campoService.crearCampo(request, jwt));
    }

    @GetMapping
    public ResponseEntity<List<CampoResponse>> listar(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(campoService.listarMisCampos(idUsuario));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(campoService.obtenerEstadisticas(idUsuario));
    }

    @DeleteMapping("/{idCampo}")
    public ResponseEntity<Void> eliminarCampo(@PathVariable UUID idCampo, @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        campoService.eliminarCampo(idCampo, idUsuario);
        return ResponseEntity.noContent().build();
    }
}