package org.agronex.backend.service;

import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.entity.AccionAudit;
import org.agronex.backend.entity.EntidadAudit;
import org.agronex.backend.entity.PersonaFisica;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.mapper.PersonaFisicaMapper;
import org.agronex.backend.mapper.PersonaJuridicaMapper;
import org.agronex.backend.repository.PersonaFisicaRepository;
import org.agronex.backend.repository.PersonaJuridicaRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private PersonaFisicaRepository fisicaRepository;
    @Mock
    private PersonaJuridicaRepository juridicaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private PersonaFisicaMapper fisicaMapper;
    @Mock
    private PersonaJuridicaMapper juridicaMapper;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    @Test
    void givenValidFisicaRequest_whenRegistrarPersonaFisica_thenNormalizesAndPersistsAndAudits() {
        // Given
        UUID supabaseId = UUID.randomUUID();
        PersonaFisicaRequest request = PersonaFisicaRequest.builder()
                .email("  User@Mail.Com ")
                .nombre("Ana")
                .apellido("Perez")
                .dni("12.345.678")
                .build();

        PersonaFisica entity = PersonaFisica.builder()
                .idUsuario(supabaseId)
                .email(request.getEmail())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .dni(request.getDni())
                .build();

        PersonaFisica persisted = PersonaFisica.builder()
                .idUsuario(supabaseId)
                .email("user@mail.com")
                .nombre("Ana")
                .apellido("Perez")
                .dni("12345678")
                .rol(RolUsuario.PROPIETARIO)
                .fechaRegistro(OffsetDateTime.now())
                .build();

        PersonaFisicaResponse response = PersonaFisicaResponse.builder()
                .idUsuario(supabaseId)
                .email("user@mail.com")
                .nombre("Ana")
                .apellido("Perez")
                .dni("12345678")
                .fechaRegistro(persisted.getFechaRegistro())
                .build();

        when(usuarioRepository.existsById(supabaseId)).thenReturn(false);
        when(usuarioRepository.existsByEmailIgnoreCase("user@mail.com")).thenReturn(false);
        when(fisicaRepository.existsByDni("12345678")).thenReturn(false);
        when(fisicaMapper.toEntity(request, supabaseId)).thenReturn(entity);
        when(fisicaRepository.save(entity)).thenReturn(persisted);
        when(fisicaMapper.toResponse(persisted)).thenReturn(response);

        // When
        PersonaFisicaResponse actual = authService.registrarPersonaFisica(request, supabaseId);

        // Then
        assertThat(actual.getEmail()).isEqualTo("user@mail.com");
        assertThat(actual.getDni()).isEqualTo("12345678");

        ArgumentCaptor<PersonaFisica> personaCaptor = ArgumentCaptor.forClass(PersonaFisica.class);
        verify(fisicaRepository).save(personaCaptor.capture());
        PersonaFisica toSave = personaCaptor.getValue();

        assertThat(toSave.getEmail()).isEqualTo("user@mail.com");
        assertThat(toSave.getDni()).isEqualTo("12345678");
        assertThat(toSave.getRol()).isEqualTo(RolUsuario.PROPIETARIO);
        assertThat(toSave.getIdPropietario()).isNull();

        verify(auditService).registrar(
                eq(supabaseId),
                eq("user@mail.com"),
                eq(EntidadAudit.USUARIO),
                eq(supabaseId.toString()),
                eq("Ana Perez"),
                eq(AccionAudit.REGISTRO),
                eq("Registro como Persona Física. DNI: 12345678")
        );
    }

    @Test
    void givenExistingSupabaseUser_whenRegistrarPersonaFisica_thenThrowsIllegalArgumentException() {
        // Given
        UUID supabaseId = UUID.randomUUID();
        PersonaFisicaRequest request = PersonaFisicaRequest.builder()
                .email("test@mail.com")
                .nombre("Ana")
                .apellido("Perez")
                .dni("12345678")
                .build();

        when(usuarioRepository.existsById(supabaseId)).thenReturn(true);

        // When / Then
        assertThatThrownBy(() -> authService.registrarPersonaFisica(request, supabaseId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Este usuario ya fue registrado en AgroNex.");

        verify(fisicaRepository, never()).save(any(PersonaFisica.class));
        verify(auditService, never()).registrar(any(UUID.class), anyString(), any(), anyString(), anyString(), any(), anyString());
    }

    @Test
    void givenFormattedEmailAndDni_whenValidarDisponibilidadRegistro_thenUsesNormalizedValues() {
        // Given
        when(usuarioRepository.existsByEmailIgnoreCase("qa@mail.com")).thenReturn(false);
        when(fisicaRepository.existsByDni("44556677")).thenReturn(false);

        // When
        authService.validarDisponibilidadRegistro("  QA@Mail.com  ", "44.556.677", null);

        // Then
        verify(usuarioRepository).existsByEmailIgnoreCase("qa@mail.com");
        verify(fisicaRepository).existsByDni("44556677");
    }

    @Test
    void givenDuplicatedEmail_whenValidarDisponibilidadRegistro_thenThrowsIllegalArgumentException() {
        // Given
        when(usuarioRepository.existsByEmailIgnoreCase("dup@mail.com")).thenReturn(true);

        // When / Then
        assertThatThrownBy(() -> authService.validarDisponibilidadRegistro("dup@mail.com", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Algunos datos de registro ya están en uso.");
    }
}
