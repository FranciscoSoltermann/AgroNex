package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Transactional
    public Usuario obtenerOCrearUsuario(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("No se pudo determinar el email del usuario autenticado.");
        }

        String emailNormalizado = email.trim().toLowerCase();

        return usuarioRepository.findById(userId)
                .orElseGet(() ->
                        usuarioRepository.findByEmailIgnoreCase(emailNormalizado)
                                .map(usuarioExistente -> {
                                    if (!usuarioExistente.getIdUsuario().equals(userId)) {
                                        throw new IllegalArgumentException("El correo ya está asociado a otra cuenta.");
                                    }
                                    return usuarioExistente;
                                })
                                .orElseThrow(() -> new IllegalArgumentException("El usuario con email " + emailNormalizado + " no está registrado. Póngase en contacto con administración o regístrese."))
                );
    }
}