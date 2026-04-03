package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.GastoFijoRequest;
import org.agronex.backend.dto.response.GastoFijoResponse;
import org.agronex.backend.security.SecurityUtils;
import org.agronex.backend.service.GastoFijoService;
import org.agronex.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/gastos")
@RequiredArgsConstructor
public class GastoFijoController {

    private final GastoFijoService gastoFijoService;
    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<GastoFijoResponse> registrarGasto(
            @Valid @RequestBody GastoFijoRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return new ResponseEntity<>(gastoFijoService.registrarGasto(request, idUsuario), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<java.util.List<GastoFijoResponse>> listMisGastos(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = usuarioService.idUsuarioParaAccesoDatos(SecurityUtils.requireUserId(jwt));
        return ResponseEntity.ok(gastoFijoService.listarGastosPersonales(idUsuario));
    }

    @DeleteMapping("/{idGasto}")
    public ResponseEntity<Void> eliminarGasto(@PathVariable UUID idGasto, @AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        gastoFijoService.eliminarGasto(idGasto, idUsuario);
        return ResponseEntity.noContent().build();
    }
}