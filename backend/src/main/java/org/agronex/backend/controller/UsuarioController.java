package org.agronex.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.AsignarEmpleadoRequest;
import org.agronex.backend.dto.request.ActualizarRolUsuarioRequest;
import org.agronex.backend.dto.request.UsuarioSettingsUpdateRequest;
import org.agronex.backend.dto.response.EmpleadoResponse;
import org.agronex.backend.dto.response.UsuarioSettingsResponse;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.UsuarioService;
import org.agronex.backend.service.UsuarioSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios y Empleados", description = "Operaciones de gestión de perfiles, configuración y asignación de empleados")
@SecurityRequirement(name = "bearerAuth")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioSettingsService usuarioSettingsService;
    private final UsuarioService usuarioService;

    @Operation(summary = "Verificar estado de registro", description = "Consulta si el usuario autenticado ya completó el registro en la base de datos de AgroNex o si solo existe en Supabase.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Estado de registro devuelto correctamente")
    })
    @GetMapping("/me/check")
    public ResponseEntity<Map<String, Boolean>> checkUserRegistration(@AuthenticationPrincipal Jwt jwt) {
        // Debe coincidir el id de Supabase (sub) con id_usuario en AgroNex — no basta el email,
        // porque OAuth puede crear otro usuario con el mismo correo.
        UUID supabaseId = UUID.fromString(jwt.getSubject());
        boolean exists = usuarioRepository.existsById(supabaseId);
        return ResponseEntity.ok(Map.of("registrado", exists));
    }

    @Operation(summary = "Obtener configuración", description = "Devuelve la configuración personalizada del usuario.")
    @GetMapping("/settings")
    public ResponseEntity<UsuarioSettingsResponse> obtenerSettings(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(usuarioSettingsService.obtenerSettings(idUsuario));
    }

    @Operation(summary = "Actualizar configuración", description = "Actualiza las preferencias del usuario (tema, idioma, notificaciones, etc.).")
    @PutMapping("/settings")
    public ResponseEntity<UsuarioSettingsResponse> actualizarSettings(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UsuarioSettingsUpdateRequest request) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(usuarioSettingsService.actualizarSettings(idUsuario, request));
    }

    @Operation(summary = "Listar empleados", description = "Lista los empleados asignados al usuario propietario actual.")
    @GetMapping("/empleados")
    public ResponseEntity<List<EmpleadoResponse>> listarEmpleados(@AuthenticationPrincipal Jwt jwt) {
        UUID idPropietario = SecurityUtils.requireUserId(jwt);
        return ResponseEntity.ok(usuarioService.listarEmpleados(idPropietario));
    }

    @Operation(summary = "Asignar empleado", description = "Permite a un PROPIETARIO vincular a otro usuario registrado como empleado de su organización.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Empleado asignado correctamente"),
        @ApiResponse(responseCode = "403", description = "El usuario no tiene rol PROPIETARIO")
    })
    @PostMapping("/empleados/asignar")
    @PreAuthorize("hasAuthority('ROLE_PROPIETARIO')")
    public ResponseEntity<Void> asignarEmpleado(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AsignarEmpleadoRequest request) {
        UUID idPropietario = SecurityUtils.requireUserId(jwt);
        usuarioService.asignarEmpleado(idPropietario, request);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Desvincular empleado", description = "Permite a un PROPIETARIO eliminar a un empleado de su organización.")
    @DeleteMapping("/empleados/{idEmpleado}")
    @PreAuthorize("hasAuthority('ROLE_PROPIETARIO')")
    public ResponseEntity<Void> desvincularEmpleado(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID idEmpleado) {
        UUID idPropietario = SecurityUtils.requireUserId(jwt);
        usuarioService.desvincularEmpleado(idPropietario, idEmpleado);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Actualizar rol de usuario", description = "Operación exclusiva de ADMIN. Permite cambiar el rol de un usuario o asignarlo a un propietario.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Rol actualizado"),
        @ApiResponse(responseCode = "403", description = "No eres administrador")
    })
    @PutMapping("/{idUsuario}/rol")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> actualizarRol(
            @PathVariable UUID idUsuario,
            @Valid @RequestBody ActualizarRolUsuarioRequest request) {
        usuarioService.actualizarRol(idUsuario, request);
        return ResponseEntity.noContent().build();
    }
}

