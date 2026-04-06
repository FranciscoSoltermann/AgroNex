package org.agronex.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import jakarta.persistence.EntityNotFoundException;
import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.infrastructure.exception.GlobalExceptionHandler;
import org.agronex.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.security.oauth2.server.resource.autoconfigure.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.security.oauth2.jwt.Jwt;

@WebMvcTest(
        controllers = AuthController.class,
        excludeAutoConfiguration = OAuth2ResourceServerAutoConfiguration.class
)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AuthControllerWebTest {

    private static final UUID USER_ID = UUID.fromString("de305d54-75b4-431b-adb2-eb6b9e546014");

    @Autowired
    private MockMvc mockMvc;

        @Autowired
        private AuthController authController;

    private ObjectMapper objectMapper;

        @MockitoBean
    private AuthService authService;

        @MockitoBean
        private org.agronex.backend.repository.UsuarioRepository usuarioRepository;

        AuthControllerWebTest() {
                        this.objectMapper = new ObjectMapper()
                                .findAndRegisterModules()
                                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        }

    @Test
    void givenValidPayload_whenValidarDisponibilidad_thenReturns200() throws Exception {
        // Given
        doNothing().when(authService).validarDisponibilidadRegistro(eq("qa@agronex.com"), eq("12345678"), eq(null));

        // When / Then
        mockMvc.perform(post("/api/public/auth/registro/validar-disponibilidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"qa@agronex.com","dni":"12345678"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Disponibilidad validada."));
    }

    @Test
    void givenDuplicatedData_whenValidarDisponibilidad_thenReturns400() throws Exception {
        // Given
        doThrow(new IllegalArgumentException("Algunos datos de registro ya están en uso."))
                .when(authService).validarDisponibilidadRegistro(anyString(), anyString(), any());

        // When / Then
        mockMvc.perform(post("/api/public/auth/registro/validar-disponibilidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"dup@agronex.com","dni":"12345678"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Algunos datos de registro ya están en uso."));
    }

    @Test
    void givenMissingRequiredFields_whenRegistrarFisica_thenReturns400() throws Exception {
        // Given
        PersonaFisicaRequest invalid = PersonaFisicaRequest.builder()
                .email("bad-email")
                .nombre("")
                .apellido("")
                .dni("ABC")
                .build();

        // When / Then
        mockMvc.perform(post("/api/public/auth/registro/fisica")
                        .with(jwt().jwt(jwt -> jwt.subject(USER_ID.toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.nombre").exists())
                .andExpect(jsonPath("$.apellido").exists())
                .andExpect(jsonPath("$.dni").exists());
    }

    @Test
    void givenValidRequest_whenRegistrarFisica_thenReturns201AndResponseMatchesSchema() throws Exception {
        // Given
        PersonaFisicaRequest request = PersonaFisicaRequest.builder()
                .email("qa@agronex.com")
                .nombre("Ana")
                .apellido("Perez")
                .dni("12345678")
                .build();

        PersonaFisicaResponse response = PersonaFisicaResponse.builder()
                .idUsuario(USER_ID)
                .email("qa@agronex.com")
                .nombre("Ana")
                .apellido("Perez")
                .dni("12345678")
                .fechaRegistro(OffsetDateTime.parse("2026-04-06T10:15:30Z"))
                .build();

        when(authService.registrarPersonaFisica(any(PersonaFisicaRequest.class), eq(USER_ID))).thenReturn(response);

        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject(USER_ID.toString())
                .build();

        // When
        var responseEntity = authController.registrarPersonaFisica(request, jwt);

        assertThat(responseEntity.getStatusCode().value()).isEqualTo(201);
        assertThat(responseEntity.getBody()).isNotNull();
        assertThat(responseEntity.getBody().getEmail()).isEqualTo("qa@agronex.com");

        String rawResponse = objectMapper.writeValueAsString(responseEntity.getBody());

        // Then
        String schema = """
                {
                  "$schema": "https://json-schema.org/draft/2020-12/schema",
                  "type": "object",
                  "required": ["idUsuario", "email", "nombre", "apellido", "dni", "fechaRegistro"],
                  "properties": {
                    "idUsuario": { "type": "string", "format": "uuid" },
                    "email": { "type": "string", "format": "email" },
                    "nombre": { "type": "string", "minLength": 1 },
                    "apellido": { "type": "string", "minLength": 1 },
                    "dni": { "type": "string", "pattern": "^\\\\d+$" },
                    "fechaRegistro": { "type": "string", "format": "date-time" }
                  },
                  "additionalProperties": false
                }
                """;

        JsonSchema jsonSchema = JsonSchemaFactory
                .getInstance(SpecVersion.VersionFlag.V202012)
                .getSchema(schema);

        Set<ValidationMessage> errors = jsonSchema.validate(objectMapper.readTree(rawResponse));
        assertThat(errors).isEmpty();
    }

    @Test
    void givenEntityNotFoundException_whenValidarDisponibilidad_thenReturns404() throws Exception {
        // Given
        doThrow(new EntityNotFoundException("Recurso no encontrado"))
                .when(authService).validarDisponibilidadRegistro(anyString(), anyString(), any());

        // When / Then
        mockMvc.perform(post("/api/public/auth/registro/validar-disponibilidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"qa@agronex.com","dni":"12345678"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Recurso no encontrado"));
    }

    @Test
    void givenUnexpectedException_whenValidarDisponibilidad_thenReturns500() throws Exception {
        // Given
        doThrow(new RuntimeException("boom"))
                .when(authService).validarDisponibilidadRegistro(anyString(), anyString(), any());

        // When / Then
        mockMvc.perform(post("/api/public/auth/registro/validar-disponibilidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"qa@agronex.com","dni":"12345678"}
                                """))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Ocurrió un error inesperado en el servidor."));
    }
}
