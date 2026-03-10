package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.CampoRequest;
import org.agronex.backend.dto.response.CampoResponse;
import org.agronex.backend.service.CampoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/campos") // Esta ruta es PRIVADA (requiere Token)
@RequiredArgsConstructor
public class CampoController {

    private final CampoService campoService;

    @PostMapping
    public ResponseEntity<CampoResponse> crear(
            @Valid @RequestBody CampoRequest request,
            @AuthenticationPrincipal Jwt jwt) { // <--- Extraemos el token validado

        // El 'sub' del JWT de Supabase es el UUID del usuario
        UUID idUsuario = UUID.fromString(jwt.getSubject());

        return new ResponseEntity<>(campoService.crearCampo(request, idUsuario), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CampoResponse>> listar(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(campoService.listarMisCampos(idUsuario));
    }
}