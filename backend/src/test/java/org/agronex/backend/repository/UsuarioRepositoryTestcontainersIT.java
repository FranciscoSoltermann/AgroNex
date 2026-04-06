package org.agronex.backend.repository;

import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.enums.RolUsuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UsuarioRepositoryTestcontainersIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("agronex_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }

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
