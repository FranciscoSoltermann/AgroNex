package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.FinanzasCampoResponse;
import org.agronex.backend.dto.response.ResumenCampaniaResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.FinanzasService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/finanzas")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_GESTION_FINANZAS')")
public class FinanzasController {

    private final FinanzasService finanzasService;
    private final UsuarioService usuarioService;

    @GetMapping("/resumen")
    public ResponseEntity<List<FinanzasCampoResponse>> obtenerResumen(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(finanzasService.obtenerResumenGeneral(idUsuario));
    }

    @GetMapping("/campania/{idCampania}/resumen")
    public ResponseEntity<ResumenCampaniaResponse> resumenPorCampania(
            @PathVariable UUID idCampania,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(finanzasService.obtenerResumenCampania(idCampania, idUsuario));
    }
}

