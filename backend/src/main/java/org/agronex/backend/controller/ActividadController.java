package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.ActividadRequest;
import org.agronex.backend.dto.request.ActividadInsumoRequest;
import org.agronex.backend.dto.response.ActividadResponse;
import org.agronex.backend.dto.response.ActividadInsumoResponse;
import org.agronex.backend.service.ActividadService;
import org.agronex.backend.service.ActividadInsumoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/actividades")
@RequiredArgsConstructor
public class ActividadController {

    private final ActividadService actividadService;
    private final ActividadInsumoService actividadInsumoService;

    @PostMapping
    public ResponseEntity<ActividadResponse> registrarActividad(
            @Valid @RequestBody ActividadRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = UUID.fromString(jwt.getSubject());
        return new ResponseEntity<>(actividadService.registrarActividad(request, idUsuario), HttpStatus.CREATED);
    }

    @PostMapping("/insumos")
    public ResponseEntity<ActividadInsumoResponse> agregarInsumoAActividad(
            @Valid @RequestBody ActividadInsumoRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = UUID.fromString(jwt.getSubject());
        return new ResponseEntity<>(actividadInsumoService.agregarInsumo(request, idUsuario), HttpStatus.CREATED);
    }
}