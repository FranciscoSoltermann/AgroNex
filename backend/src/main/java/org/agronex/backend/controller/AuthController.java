package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.request.PersonaJuridicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.dto.response.PersonaJuridicaResponse;
import org.agronex.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/auth") // Ruta pública (configurada en SecurityConfig)
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Endpoint para registrar una persona física.
     * El 'idUsuario' debe ser el UUID que devolvió Supabase al crear la cuenta.
     */
    @PostMapping("/registro/fisica/{idUsuario}")
    public ResponseEntity<PersonaFisicaResponse> registrarFisica(
            @PathVariable UUID idUsuario,
            @Valid @RequestBody PersonaFisicaRequest request) {

        PersonaFisicaResponse response = authService.registrarPersonaFisica(request, idUsuario);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Endpoint para registrar una persona jurídica (Empresa).
     */
    @PostMapping("/registro/juridica/{idUsuario}")
    public ResponseEntity<PersonaJuridicaResponse> registrarJuridica(
            @PathVariable UUID idUsuario,
            @Valid @RequestBody PersonaJuridicaRequest request) {

        PersonaJuridicaResponse response = authService.registrarPersonaJuridica(request, idUsuario);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}