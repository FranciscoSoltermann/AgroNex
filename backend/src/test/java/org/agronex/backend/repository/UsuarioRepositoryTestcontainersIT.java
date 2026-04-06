package org.agronex.backend.repository;

import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.enums.RolUsuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.junit.jupiter.api.Disabled;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:agronex_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_UPPER=false",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false"
})
@Disabled("Requires PostgreSQL/Testcontainers; H2 cannot reproduce the joined-inheritance check constraints reliably here.")
class UsuarioRepositoryTestcontainersIT {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PersonaFisicaRepository personaFisicaRepository;

    @Test
    void givenSavedUser_whenExistsByEmailIgnoreCase_thenReturnsTrue() {
        // Given
        String email = "qa.case@agronex.com";
        PersonaFisica user = personaFisica(email, "12345678");
        personaFisicaRepository.saveAndFlush(user);

        // When
        boolean exists = usuarioRepository.existsByEmailIgnoreCase("QA.CASE@AGRONEX.COM");

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    void givenDuplicateEmail_whenSaveSecondUser_thenThrowsDataIntegrityViolation() {
        // Given
        String email = "duplicado@agronex.com";
        personaFisicaRepository.saveAndFlush(personaFisica(email, "44556677"));

        // When / Then
        assertThatThrownBy(() -> personaFisicaRepository.saveAndFlush(personaFisica(email, "99887766")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void givenEdgeCaseEmailWithSpacesAndUppercase_whenFindByEmailIgnoreCase_thenMatchesTrimmedInput() {
        // Given
        personaFisicaRepository.saveAndFlush(personaFisica("edge@agronex.com", "11112222"));

        // When
        boolean exists = usuarioRepository.existsByEmailIgnoreCase(" edge@AGRONEX.com ".trim());

        // Then
        assertThat(exists).isTrue();
    }

    private PersonaFisica personaFisica(String email, String dni) {
        return PersonaFisica.builder()
                .idUsuario(UUID.randomUUID())
                .email(email)
                .rol(RolUsuario.PROPIETARIO)
                .idPropietario(null)
                .nombre("QA")
                .apellido("Tester")
                .dni(dni)
                .build();
    }
}
