package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.request.ActividadInsumoRequest;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.dto.response.ActividadInsumoResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.ActividadService;
import org.agronex.backend.service.ActividadInsumoService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/actividades")
@RequiredArgsConstructor
public class ActividadController {

    private final ActividadService actividadService;
    private final ActividadInsumoService actividadInsumoService;
    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<ActividadResponse> registrarActividad(
            @Valid @RequestBody ActividadRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return new ResponseEntity<>(actividadService.registrarActividad(request, idUsuario), HttpStatus.CREATED);
    }

    @PostMapping("/insumos")
    public ResponseEntity<ActividadInsumoResponse> agregarInsumoAActividad(
            @Valid @RequestBody ActividadInsumoRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return new ResponseEntity<>(actividadInsumoService.agregarInsumo(request, idUsuario), HttpStatus.CREATED);
    }
    @GetMapping
    public ResponseEntity<List<ActividadResponse>> listarMisActividades(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(actividadService.listarMisActividades(idUsuario));
    }

    @DeleteMapping("/{idActividad}")
    public ResponseEntity<Void> eliminarActividad(@PathVariable UUID idActividad, @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        actividadService.eliminarActividad(idActividad, idUsuario);
        return ResponseEntity.noContent().build();
    }
}
