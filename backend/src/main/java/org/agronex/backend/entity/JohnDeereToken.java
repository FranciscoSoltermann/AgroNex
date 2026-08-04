package org.agronex.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Almacena los tokens OAuth de John Deere para cada usuario.
 * Permite que cada usuario conecte su propia cuenta de JD Operations Center.
 */
@Entity
@Table(name = "john_deere_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JohnDeereToken {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private UUID id;

    /** ID del usuario de AgroNex (FK lógica a usuario.id_usuario) */
    @Column(name = "id_usuario", nullable = false, unique = true)
    private UUID idUsuario;

    @Column(name = "access_token", columnDefinition = "TEXT", nullable = false)
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    /** Tipo de token (normalmente "Bearer") */
    @Column(name = "token_type", length = 20)
    @Builder.Default
    private String tokenType = "Bearer";

    /** Scopes otorgados */
    @Column(name = "scopes", length = 500)
    private String scopes;

    /** Instante en que expira el access_token */
    @Column(name = "expires_at")
    private Instant expiresAt;

    /** Fecha de creación del registro */
    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Última actualización (refresh) */
    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    /** Verifica si el access_token ya expiró (con 60s de margen) */
    public boolean isExpired() {
        return expiresAt != null && Instant.now().plusSeconds(60).isAfter(expiresAt);
    }
}
