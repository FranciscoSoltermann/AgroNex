package org.agronex.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.request.PersonaJuridicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.dto.response.PersonaJuridicaResponse;
import org.agronex.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Endpoints de registro de usuario.
 *
 * SEGURIDAD (VUL-08): el supabaseId se extrae del propio JWT (claim "sub"),
 * no del path. Así solo el portador del token puede registrarse con su UUID real.
 * Los endpoints de validación de disponibilidad siguen siendo públicos
 * ya que no revelan datos sensibles, solo disponibilidad de campos.
 */
@Tag(name = "Autenticación y Registro", description = "Endpoints para la validación y creación de cuentas de usuario en AgroNex")
@RestController
@RequestMapping("/api/public/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Health Check", description = "Comprueba la disponibilidad del servicio de autenticación.")
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    /** Solo verifica disponibilidad de email/dni/cuit — sin JWT requerido. */
    @Operation(summary = "Validar Disponibilidad", description = "Verifica si un Email, DNI o CUIT ya se encuentran registrados antes de iniciar el formulario.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Datos disponibles para registro"),
        @ApiResponse(responseCode = "400", description = "Email, DNI o CUIT en uso")
    })
    @PostMapping("/registro/validar-disponibilidad")
    public ResponseEntity<Map<String, String>> validarDisponibilidad(@RequestBody Map<String, String> body) {
        authService.validarDisponibilidadRegistro(body.get("email"), body.get("dni"), body.get("cuit"));
        return ResponseEntity.ok(Map.of("message", "Disponibilidad validada."));
    }

    /** Envía un código de verificación por correo tras comprobar la disponibilidad de los datos */
    @Operation(summary = "Enviar Código de Verificación", description = "Valida disponibilidad y envía un código de 6 dígitos al correo electrónico proporcionado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Código enviado con éxito"),
        @ApiResponse(responseCode = "400", description = "Email, DNI o CUIT ya registrados o correo inválido")
    })
    @PostMapping("/registro/enviar-codigo")
    public ResponseEntity<Map<String, String>> enviarCodigoRegistro(@RequestBody Map<String, String> body) {
        authService.solicitarCodigoRegistro(body.get("email"), body.get("dni"), body.get("cuit"));
        return ResponseEntity.ok(Map.of("message", "Código de verificación enviado al correo electrónico."));
    }

    /** Verifica el código ingresado por el usuario */
    @Operation(summary = "Verificar Código de Registro", description = "Valida que el código ingresado por el usuario coincida con el enviado por email.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Código válido"),
        @ApiResponse(responseCode = "400", description = "Código incorrecto o expirado")
    })
    @PostMapping("/registro/verificar-codigo")
    public ResponseEntity<Map<String, Object>> verificarCodigoRegistro(@RequestBody Map<String, String> body) {
        boolean valido = authService.validarCodigoRegistro(body.get("email"), body.get("codigo"));
        return ResponseEntity.ok(Map.of("message", "Código verificado exitosamente.", "valid", valido));
    }

    /**
     * Registro de Persona Física.
     * El supabaseId es extraído del JWT — no se acepta del path.
     * Requiere JWT válido de Supabase (token del paso de registro en el cliente).
     */
    @Operation(summary = "Registrar Persona Física", description = "Registra un nuevo usuario como Persona Física utilizando el JWT de Supabase autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Persona física registrada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Validación de formulario fallida o datos duplicados"),
        @ApiResponse(responseCode = "401", description = "JWT de Supabase no provisto o inválido")
    })
    @PostMapping("/registro/fisica")
    public ResponseEntity<PersonaFisicaResponse> registrarPersonaFisica(
            @Valid @RequestBody PersonaFisicaRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        // VUL-08 fix: UUID garantizado por Supabase, no puede ser inventado
        UUID supabaseId = UUID.fromString(jwt.getSubject());
        return new ResponseEntity<>(authService.registrarPersonaFisica(request, supabaseId), HttpStatus.CREATED);
    }

    /**
     * Registro de Persona Jurídica.
     * El supabaseId es extraído del JWT — no se acepta del path.
     */
    @Operation(summary = "Registrar Persona Jurídica", description = "Registra un nuevo usuario como Persona Jurídica (Empresa) utilizando el JWT de Supabase autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Persona jurídica registrada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Validación de formulario fallida o datos duplicados"),
        @ApiResponse(responseCode = "401", description = "JWT de Supabase no provisto o inválido")
    })
    @PostMapping("/registro/juridica")
    public ResponseEntity<PersonaJuridicaResponse> registrarPersonaJuridica(
            @Valid @RequestBody PersonaJuridicaRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID supabaseId = UUID.fromString(jwt.getSubject());
        return new ResponseEntity<>(authService.registrarPersonaJuridica(request, supabaseId), HttpStatus.CREATED);
    }
}
