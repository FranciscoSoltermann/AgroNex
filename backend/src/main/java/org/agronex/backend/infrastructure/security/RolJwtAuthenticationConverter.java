package org.agronex.backend.infrastructure.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Convierte el JWT de Supabase en un token de Spring Security con los roles
 * cargados desde la base de datos.
 *
 * Authorities generadas:
 *  - ROLE_USER       → siempre (cualquier usuario con JWT válido)
 *  - ROLE_PROPIETARIO / ROLE_EMPLEADO / ROLE_ADMIN → según usuario.rol en DB
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RolJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UsuarioRepository usuarioRepository;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        // Base: todo JWT válido tiene ROLE_USER
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        String sub = jwt.getSubject();
        if (sub != null && !sub.isBlank()) {
            try {
                UUID uuid = UUID.fromString(sub);
                usuarioRepository.findById(uuid).ifPresent(u -> {
                    RolUsuario rol = u.getRol();
                    if (rol != null) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + rol.name()));
                        log.debug("JWT sub={} → ROLE_{}", sub, rol.name());
                    }
                    
                    if (u.getPermisos() != null) {
                        for (org.agronex.backend.enums.PermisoEmpleado permiso : u.getPermisos()) {
                            authorities.add(new SimpleGrantedAuthority("PERMISO_" + permiso.name()));
                            log.debug("JWT sub={} → PERMISO_{}", sub, permiso.name());
                        }
                    }
                });
            } catch (IllegalArgumentException ex) {
                log.warn("JWT sub no es UUID válido: {}", sub);
            }
        }

        return new JwtAuthenticationToken(jwt, authorities, sub);
    }
}


