package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.LoteRequest;
import org.agronex.backend.dto.response.LoteResponse;
import org.agronex.backend.service.LoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/lotes")
@RequiredArgsConstructor
public class LoteController {

    private final LoteService loteService;

    @PostMapping
    public ResponseEntity<LoteResponse> crearLote(
            @Valid @RequestBody LoteRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = UUID.fromString(jwt.getSubject());
        LoteResponse response = loteService.crearLote(request, idUsuario);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}