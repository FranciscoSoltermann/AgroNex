package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.LaborFinalizadaDTO;
import org.agronex.backend.service.JohnDeereTelemetriaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/maquinaria/john-deere/telemetria")
@RequiredArgsConstructor
@Tag(name = "Telemetría JD", description = "Webhooks y sincronización de telemetría con John Deere")
public class JohnDeereTelemetriaController {

    private final JohnDeereTelemetriaService johnDeereTelemetriaService;

    @PostMapping("/labor-finalizada")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PROPIETARIO')") // En prod esto sería autenticado via Token de Servicio/Máquina
    public ResponseEntity<Void> simularLaborFinalizada(@RequestBody @Valid LaborFinalizadaDTO dto) {
        johnDeereTelemetriaService.procesarConsumoAutomatico(dto);
        return ResponseEntity.ok().build();
    }
}
