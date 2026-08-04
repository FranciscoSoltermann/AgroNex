package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CosechaRequest;
import org.agronex.backend.dto.response.CosechaResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.CosechaService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cosechas")
@RequiredArgsConstructor
public class CosechaController {

    private final CosechaService cosechaService;
    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<CosechaResponse>> listarTodas(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(cosechaService.listarTodas(idUsuario));
    }

    @PostMapping
    public ResponseEntity<CosechaResponse> registrarCosecha(
            @Valid @RequestBody CosechaRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        CosechaResponse response = cosechaService.registrarCosecha(request, idUsuario);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
