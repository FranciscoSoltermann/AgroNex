package org.agronex.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * SEGURIDAD (VUL-C03): este controlador de debugging/testing fue desactivado.
 * <p>
 * El endpoint de prueba de organizaciones John Deere está ahora disponible solo para
 * administradores en: {@code GET /api/maquinaria/john-deere/admin/test-organizations}
 * con protección {@code @PreAuthorize("hasAuthority('ROLE_ADMIN')")} dentro de
 * {@code JohnDeereController}.
 * <p>
 * Esta clase se conserva vacía para evitar errores de compilación si hay references
 * transitorias, y se puede eliminar en el próximo cleanup.
 */
@RestController
@RequestMapping("/api/maquinaria/john-deere/test")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Deprecated(forRemoval = true)
public class JohnDeereOAuth2TestController {
    // Controlador desactivado intencionalmente. Ver JohnDeereController#testOrganizationsAdmin
}
