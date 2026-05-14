package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.LaborAgricolaRequest;
import org.agronex.backend.dto.response.LaborAgricolaResponse;
import org.agronex.backend.service.LaborAgricolaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/labores")
@RequiredArgsConstructor
@Tag(name = "Trazabilidad / Labores Agrícolas", description = "Libro de campo digital")
@SecurityRequirement(name = "bearerAuth")
public class LaborAgricolaController {

    private final LaborAgricolaService laborAgricolaService;

    @PostMapping
    @Operation(summary = "Registrar nueva labor agrícola (Trazabilidad)")
    public ResponseEntity<LaborAgricolaResponse> crearLabor(@Valid @RequestBody LaborAgricolaRequest request) {
        return new ResponseEntity<>(laborAgricolaService.crearLabor(request), HttpStatus.CREATED);
    }

    @GetMapping("/lote/{loteId}")
    @Operation(summary = "Listar labores de un lote")
    public ResponseEntity<List<LaborAgricolaResponse>> listarPorLote(@PathVariable UUID loteId) {
        return ResponseEntity.ok(laborAgricolaService.listarPorLote(loteId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un registro de labor")
    public ResponseEntity<Void> eliminarLabor(@PathVariable UUID id) {
        laborAgricolaService.eliminarLabor(id);
        return ResponseEntity.noContent().build();
    }
}
