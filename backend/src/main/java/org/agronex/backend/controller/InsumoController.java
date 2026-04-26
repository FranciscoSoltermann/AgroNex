package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.InsumoService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/insumos")
@RequiredArgsConstructor
public class InsumoController {

    private final InsumoService insumoService;
    private final UsuarioService usuarioService;

    // Obtener todo el catálogo de semillas, químicos, etc.
    @GetMapping
    public ResponseEntity<List<InsumoResponse>> listarInsumos(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) UUID idCampo,
            @RequestParam(required = false) UUID idCampania) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(insumoService.listarTodos(idUsuario, idCampo, idCampania));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InsumoResponse> obtenerPorId(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(insumoService.buscarPorId(id, idUsuario));
    }

    @PostMapping
    public ResponseEntity<InsumoResponse> crearInsumo(
            @Valid @RequestBody InsumoRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return new ResponseEntity<>(insumoService.crearInsumo(request, idUsuario), HttpStatus.CREATED);
    }
}
