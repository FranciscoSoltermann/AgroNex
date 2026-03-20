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

    @Transactional
    public Usuario obtenerOCrearUsuario(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email"); // 🔹 Aseguramos que sea String

        // 1. Primero buscamos por ID (lo más rápido)
        return usuarioRepository.findById(userId)
                .orElseGet(() ->
                        // 2. Si no está por ID, buscamos por Email por seguridad
                        usuarioRepository.findByEmail(email)
                                .orElseGet(() -> {
                                    // 3. Si no existe de ninguna forma, recién ahí lo creamos
                                    PersonaFisica nuevoUsuario = PersonaFisica.builder()
                                            .idUsuario(userId)
                                            .email(email)
                                            .nombre("Usuario")
                                            .apellido("Nuevo")
                                            .dni("00000000") // 🔹 Podrías sacar esto del JWT si lo tenés
                                            .build();

                                    return usuarioRepository.save(nuevoUsuario);
                                })
                );
    }
}