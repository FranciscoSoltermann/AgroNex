package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.entity.Usuario;
import org.agronex.backend.enums.TipoPersona;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    /**
     * Busca el usuario por el ID del JWT.
     * Si no existe en la base, lo crea automáticamente.
     */
    @Transactional
    public Usuario obtenerOCrearUsuario(Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaim("email");

        return usuarioRepository.findById(userId)
                .orElseGet(() -> {

                    PersonaFisica nuevoUsuario = PersonaFisica.builder()
                            .idUsuario(userId)
                            .email(email)
                            .nombre("Usuario")
                            .apellido("Nuevo")
                            .dni("00000000")
                            .build();

                    return usuarioRepository.save(nuevoUsuario);
                });
    }

}