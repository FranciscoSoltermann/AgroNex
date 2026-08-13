package org.agronex.backend.service;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.request.PersonaFisicaRequest;
import org.agronex.backend.dto.request.PersonaJuridicaRequest;
import org.agronex.backend.dto.response.PersonaFisicaResponse;
import org.agronex.backend.dto.response.PersonaJuridicaResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.enums.RolUsuario;
import org.agronex.backend.mapper.PersonaFisicaMapper;
import org.agronex.backend.mapper.PersonaJuridicaMapper;
import org.agronex.backend.repository.PersonaFisicaRepository;
import org.agronex.backend.repository.PersonaJuridicaRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PersonaFisicaRepository fisicaRepository;
    private final PersonaJuridicaRepository juridicaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PersonaFisicaMapper fisicaMapper;
    private final PersonaJuridicaMapper juridicaMapper;
    private final AuditService auditService;
    private final VerificationCodeService verificationCodeService;

    public void solicitarCodigoRegistro(String email, String dni, String cuit) {
        String emailNormalizado = normalizarEmail(email);
        String dniNormalizado = normalizarNumerico(dni);
        String cuitNormalizado = normalizarNumerico(cuit);

        validarDisponibilidadRegistro(emailNormalizado, dniNormalizado, cuitNormalizado);
        verificationCodeService.generarYEnviarCodigo(emailNormalizado);
    }

    public boolean validarCodigoRegistro(String email, String codigo) {
        String emailNormalizado = normalizarEmail(email);
        return verificationCodeService.verificarCodigo(emailNormalizado, codigo);
    }

    @Transactional
    public PersonaFisicaResponse registrarPersonaFisica(PersonaFisicaRequest request, UUID supabaseUuid) {
        String emailNormalizado = normalizarEmail(request.getEmail());
        String dniNormalizado = normalizarNumerico(request.getDni());

        if (usuarioRepository.existsById(supabaseUuid)) {
            throw new IllegalArgumentException("Este usuario ya fue registrado en AgroNex.");
        }

        validarDisponibilidadRegistro(emailNormalizado, dniNormalizado, null);

        PersonaFisica persona = fisicaMapper.toEntity(request, supabaseUuid);
        persona.setEmail(emailNormalizado);
        persona.setDni(dniNormalizado);
        // VUL-M03: el registro inicial siempre crea un PROPIETARIO.
        // Un empleado solo puede ser asignado por un PROPIETARIO mediante UsuarioService#asignarEmpleado.
        persona.setRol(RolUsuario.PROPIETARIO);
        persona.setIdPropietario(null);

        PersonaFisica guardada = fisicaRepository.save(persona);

        auditService.registrar(
                guardada.getIdUsuario(), guardada.getEmail(),
                EntidadAudit.USUARIO, guardada.getIdUsuario().toString(),
                guardada.getNombre() + " " + guardada.getApellido(),
                AccionAudit.REGISTRO,
                "Registro como Persona Física (" + persona.getRol() + "). DNI: " + dniNormalizado
        );

        return fisicaMapper.toResponse(guardada);
    }

    @Transactional
    public PersonaJuridicaResponse registrarPersonaJuridica(PersonaJuridicaRequest request, UUID supabaseUuid) {
        String emailNormalizado = normalizarEmail(request.getEmail());
        String cuitNormalizado = normalizarNumerico(request.getCuit());

        if (usuarioRepository.existsById(supabaseUuid)) {
            throw new IllegalArgumentException("Este usuario ya fue registrado en AgroNex.");
        }

        validarDisponibilidadRegistro(emailNormalizado, null, cuitNormalizado);

        PersonaJuridica empresa = juridicaMapper.toEntity(request, supabaseUuid);
        empresa.setEmail(emailNormalizado);
        empresa.setCuit(cuitNormalizado);
        // VUL-M03: el registro inicial siempre crea un PROPIETARIO.
        empresa.setRol(RolUsuario.PROPIETARIO);
        empresa.setIdPropietario(null);
        PersonaJuridica guardada = juridicaRepository.save(empresa);

        auditService.registrar(
                guardada.getIdUsuario(), guardada.getEmail(),
                EntidadAudit.USUARIO, guardada.getIdUsuario().toString(),
                guardada.getRazonSocial(),
                AccionAudit.REGISTRO,
                "Registro como Persona Jurídica. CUIT: " + cuitNormalizado
        );

        return juridicaMapper.toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public void validarDisponibilidadRegistro(String email, String dni, String cuit) {
        String emailNormalizado = normalizarEmail(email);
        String dniNormalizado = normalizarNumerico(dni);
        String cuitNormalizado = normalizarNumerico(cuit);

        if (emailNormalizado != null && usuarioRepository.existsByEmailIgnoreCase(emailNormalizado)) {
            throw new IllegalArgumentException("El correo electrónico ya se encuentra registrado.");
        }

        if (dniNormalizado != null && fisicaRepository.existsByDni(dniNormalizado)) {
            throw new IllegalArgumentException("El DNI ingresado ya se encuentra registrado.");
        }

        if (cuitNormalizado != null && juridicaRepository.existsByCuit(cuitNormalizado)) {
            throw new IllegalArgumentException("El CUIT ingresado ya se encuentra registrado.");
        }
    }

    private String normalizarEmail(String email) {
        if (email == null) {
            return null;
        }
        String normalizado = email.trim().toLowerCase();
        return normalizado.isBlank() ? null : normalizado;
    }

    private String normalizarNumerico(String valor) {
        if (valor == null) {
            return null;
        }
        String normalizado = valor.replaceAll("\\D", "").trim();
        return normalizado.isBlank() ? null : normalizado;
    }
}
