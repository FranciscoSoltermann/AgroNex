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

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/auth") // Coincide con tu frontend
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/registro/validar-disponibilidad")
    public ResponseEntity<Map<String, String>> validarDisponibilidad(@RequestBody Map<String, String> body) {
        authService.validarDisponibilidadRegistro(body.get("email"), body.get("dni"), body.get("cuit"));
        return ResponseEntity.ok(Map.of("message", "Disponibilidad validada."));
    }

    @PostMapping("/registro/fisica/{supabaseId}")
    public ResponseEntity<PersonaFisicaResponse> registrarPersonaFisica(
            @PathVariable UUID supabaseId,
            @Valid @RequestBody PersonaFisicaRequest request) {

        return new ResponseEntity<>(authService.registrarPersonaFisica(request, supabaseId), HttpStatus.CREATED);
    }

    @PostMapping("/registro/juridica/{supabaseId}")
    public ResponseEntity<PersonaJuridicaResponse> registrarPersonaJuridica(
            @PathVariable UUID supabaseId,
            @Valid @RequestBody PersonaJuridicaRequest request) {

        return new ResponseEntity<>(authService.registrarPersonaJuridica(request, supabaseId), HttpStatus.CREATED);
    }
}