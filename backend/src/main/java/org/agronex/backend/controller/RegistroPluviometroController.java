package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.RegistroPluviometroRequest;
import org.agronex.backend.dto.response.RegistroPluviometroResponse;
import org.agronex.backend.service.RegistroPluviometroService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pluviometro")
@RequiredArgsConstructor
@Tag(name = "Pluviómetro", description = "Registro manual de lluvias por lote")
@SecurityRequirement(name = "bearerAuth")
public class RegistroPluviometroController {

    private final RegistroPluviometroService registroPluviometroService;

    @PostMapping
    @Operation(summary = "Registrar nueva medición de lluvia")
    public ResponseEntity<RegistroPluviometroResponse> registrarLluvia(@Valid @RequestBody RegistroPluviometroRequest request) {
        return new ResponseEntity<>(registroPluviometroService.registrarLluvia(request), HttpStatus.CREATED);
    }

    @GetMapping("/lote/{loteId}")
    @Operation(summary = "Listar registros de lluvia de un lote")
    public ResponseEntity<List<RegistroPluviometroResponse>> listarPorLote(@PathVariable UUID loteId) {
        return ResponseEntity.ok(registroPluviometroService.listarPorLote(loteId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar un registro de lluvia")
    public ResponseEntity<Void> eliminarRegistro(@PathVariable UUID id) {
        registroPluviometroService.eliminarRegistro(id);
        return ResponseEntity.noContent().build();
    }
}
