package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.service.InsumoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/insumos")
@RequiredArgsConstructor
public class InsumoController {

    private final InsumoService insumoService;

    // Obtener todo el catálogo de semillas, químicos, etc.
    @GetMapping
    public ResponseEntity<List<InsumoResponse>> listarInsumos() {
        return ResponseEntity.ok(insumoService.listarTodos());
    }

    // Obtener un insumo específico (útil para ver detalles)
    @GetMapping("/{id}")
    public ResponseEntity<InsumoResponse> obtenerPorId(@PathVariable UUID id) { // 🔹 Cambiado de Long a UUID
        return ResponseEntity.ok(insumoService.buscarPorId(id));
    }

    // Cargar un nuevo insumo al catálogo
    @PostMapping
    public ResponseEntity<InsumoResponse> crearInsumo(@Valid @RequestBody InsumoRequest request) {
        return new ResponseEntity<>(insumoService.crearInsumo(request), HttpStatus.CREATED);
    }
}