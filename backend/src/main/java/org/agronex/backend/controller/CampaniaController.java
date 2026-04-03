package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampaniaRequest;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.security.SecurityUtils;
import org.agronex.backend.service.CampaniaService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/campanias")
@RequiredArgsConstructor
public class CampaniaController {

    private final CampaniaService campaniaService;
    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<CampaniaResponse> crearCampania(
            @Valid @RequestBody CampaniaRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        CampaniaResponse response = campaniaService.crearCampania(request, idUsuario);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CampaniaResponse>> listarMisCampanias(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(campaniaService.listarMisCampanias(idUsuario));
    }

    @PostMapping("/{idCampania}/cerrar")
    public ResponseEntity<CampaniaResponse> cerrarCampania(
            @PathVariable UUID idCampania,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(campaniaService.cerrarCampania(idCampania, idUsuario));
    }
}