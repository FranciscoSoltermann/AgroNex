package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.SolicitudArrepentimientoRequest;
import org.agronex.backend.service.SolicitudArrepentimientoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/public/arrepentimiento")
@RequiredArgsConstructor
public class SolicitudArrepentimientoController {

    private final SolicitudArrepentimientoService service;

    @PostMapping
    public ResponseEntity<Map<String, String>> registrar(@RequestBody @Valid SolicitudArrepentimientoRequest request) {
        return ResponseEntity.ok(service.registrarSolicitud(request));
    }
}
