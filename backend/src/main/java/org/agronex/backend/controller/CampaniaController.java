package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampaniaRequest;
import org.agronex.backend.dto.response.CampaniaResponse;
import org.agronex.backend.service.CampaniaService;
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

    @PostMapping
    public ResponseEntity<CampaniaResponse> crearCampania(
            @Valid @RequestBody CampaniaRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID idUsuario = UUID.fromString(jwt.getSubject());
        CampaniaResponse response = campaniaService.crearCampania(request, idUsuario);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    @GetMapping
    public ResponseEntity<List<CampaniaResponse>> listarMisCampanias(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(campaniaService.listarMisCampanias(idUsuario));
    }
}