package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampaniaRequest;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.CampaniaService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/campanias")
@RequiredArgsConstructor
@Tag(name = "Campania", description = "Operaciones de Campania")
public class CampaniaController {

    private final CampaniaService campaniaService;
    private final UsuarioService usuarioService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<CampaniaResponse> crearCampania(
            @Valid @RequestBody CampaniaRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        CampaniaResponse response = campaniaService.crearCampania(request, idUsuario);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{idCampania}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<CampaniaResponse> editarCampania(
            @PathVariable UUID idCampania,
            @Valid @RequestBody CampaniaRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        CampaniaResponse response = campaniaService.editarCampania(idCampania, request, idUsuario);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_LECTURA_CAMPOS', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<List<CampaniaResponse>> listarMisCampanias(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(campaniaService.listarMisCampanias(idUsuario));
    }

    @PostMapping("/{idCampania}/cerrar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<CampaniaResponse> cerrarCampania(
            @PathVariable UUID idCampania,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(campaniaService.cerrarCampania(idCampania, idUsuario));
    }

    @DeleteMapping("/{idCampania}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO', 'PERMISO_EDICION_CAMPOS')")
    public ResponseEntity<Void> eliminarCampania(
            @PathVariable UUID idCampania,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        campaniaService.eliminarCampania(idCampania, idUsuario);
        return ResponseEntity.noContent().build();
    }
}
