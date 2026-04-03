package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.dto.response.LoteResponse;
import org.agronex.backend.security.SecurityUtils;
import org.agronex.backend.service.LoteService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lotes")
@RequiredArgsConstructor
public class LoteController {

    private final LoteService loteService;
    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<LoteResponse> crearLote(
            @Valid @RequestBody LoteRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = UUID.fromString(jwt.getSubject());
        LoteResponse response = loteService.crearLote(request, idUsuario);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    @GetMapping
    public ResponseEntity<List<LoteResponse>> listarMisLotes(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(loteService.listarMisLotes(idUsuario));
    }

    @DeleteMapping("/{idLote}")
    public ResponseEntity<Void> eliminarLote(@PathVariable UUID idLote, @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        loteService.eliminarLote(idLote, idUsuario);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{idLote}/poligono")
    public ResponseEntity<LoteResponse> actualizarPoligono(
            @PathVariable UUID idLote,
            @Valid @RequestBody LoteRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        LoteResponse response = loteService.actualizarPoligono(idLote, request.getCoordenadasGeoJson(), idUsuario);
        return ResponseEntity.ok(response);
    }
}