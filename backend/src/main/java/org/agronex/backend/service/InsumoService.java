package org.agronex.backend.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.agronex.backend.dto.request.InsumoRequest;
import org.agronex.backend.dto.response.InsumoResponse;
import org.agronex.backend.entity.*;
import org.agronex.backend.mapper.InsumoMapper;
import org.agronex.backend.repository.CampoRepository;
import org.agronex.backend.repository.CampaniaRepository;
import org.agronex.backend.repository.InsumoRepository;
import org.agronex.backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsumoService {

    private final InsumoRepository insumoRepository;
    private final CampoRepository campoRepository;
    private final CampaniaRepository campaniaRepository;
    private final UsuarioRepository usuarioRepository;
    private final InsumoMapper insumoMapper;
    private final AuditService auditService;
    private final UsuarioService usuarioService;

    @Transactional
    public InsumoResponse crearInsumo(InsumoRequest request, UUID idUsuarioToken) {
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        Usuario usuario = usuarioRepository.findById(idDatos)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        Insumo nuevoInsumo = insumoMapper.toEntity(request);
        nuevoInsumo.setUsuario(usuario);

        Campo campo = null;
        if (request.getIdCampo() != null) {
            campo = campoRepository.findById(request.getIdCampo())
                    .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));

            if (!campo.getUsuario().getIdUsuario().equals(idDatos)) {
                throw new AccessDeniedException("No tenés permiso para cargar insumos en este campo");
            }
            nuevoInsumo.setCampo(campo);
        }

        // Asociar campaña si viene en el request
        if (request.getIdCampania() != null) {
            Campania campania = campaniaRepository.findById(request.getIdCampania())
                    .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));
            // Validar que la campaña pertenece al mismo usuario
            if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
                throw new AccessDeniedException("No tenés permiso para vincular insumos a esta campaña");
            }
            nuevoInsumo.setCampania(campania);
            if (nuevoInsumo.getCampo() == null && campania.getLote() != null && campania.getLote().getCampo() != null) {
                nuevoInsumo.setCampo(campania.getLote().getCampo());
            }
        }

        Insumo guardado = insumoRepository.save(nuevoInsumo);

        String detalle = "Stock inicial: " + guardado.getCantidad() + " " + guardado.getUnidad()
                + ". Precio unitario: " + guardado.getPrecioUnitario()
                + (campo != null ? ". Campo: " + campo.getNombre() : ". General (sin campo asignado)");
        if (guardado.getCampania() != null) {
            detalle += ". Campaña: " + guardado.getCampania().getCultivo();
        }

        auditService.registrar(
                idUsuarioToken, usuario.getEmail(),
                EntidadAudit.INSUMO, guardado.getIdInsumo().toString(),
                guardado.getNombre(),
                AccionAudit.CREAR,
                detalle
        );

        return insumoMapper.toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public List<InsumoResponse> listarTodos(UUID idUsuario, UUID idCampo, UUID idCampania) {
        List<Insumo> list;
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuario);

        if (idCampo != null && idCampania != null) {
            // Filtrar por campo Y campaña
            list = insumoRepository.findByCampoIdCampoAndCampaniaIdCampania(idCampo, idCampania);
        } else if (idCampania != null) {
            // Filtrar solo por campaña
            list = insumoRepository.findByCampaniaIdCampania(idCampania);
        } else if (idCampo != null) {
            // Filtrar solo por campo (incluye todos los insumos del campo, con o sin campaña)
            Campo campo = campoRepository.findById(idCampo)
                    .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));
            if (!campo.getUsuario().getIdUsuario().equals(idDatos)) {
                throw new AccessDeniedException("No tenés acceso a este campo");
            }
            list = insumoRepository.findByCampoIdCampo(idCampo);
        } else {
            // Todos los insumos del usuario (con o sin campo asignado)
            list = insumoRepository.findByUsuarioOrCampoUsuario(idDatos);
        }

        return list.stream()
                .map(insumoMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InsumoResponse buscarPorId(UUID id, UUID idUsuarioToken) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado en el catálogo"));
        
        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        validarAccesoInsumo(insumo, idDatos, "No tenés acceso a este insumo");
        
        return insumoMapper.toResponse(insumo);
    }

    @Transactional
    public InsumoResponse actualizarInsumo(UUID id, InsumoRequest request, UUID idUsuarioToken) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        validarAccesoInsumo(insumo, idDatos, "No tenés permiso para editar este insumo");

        insumo.setNombre(request.getNombre());
        insumo.setTipoArticulo(request.getTipoArticulo());
        insumo.setSubtipo(request.getSubtipo());
        insumo.setPrecioUnitario(request.getPrecioUnitario());
        insumo.setUnidad(request.getUnidad());
        insumo.setPesoBolsaKg(request.getPesoBolsaKg());
        insumo.setCantidad(request.getCantidad());
        BigDecimal stockBase = insumo.getCantidadInicial();
        if (stockBase == null || stockBase.compareTo(BigDecimal.ZERO) <= 0) {
            insumo.setCantidadInicial(request.getCantidad());
            stockBase = request.getCantidad();
        }
        if (request.getCantidad() != null && stockBase != null && stockBase.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal umbral = stockBase.multiply(new BigDecimal("0.20"));
            if (request.getCantidad().compareTo(umbral) > 0) {
                insumo.setAlertaStockBajoEnviada(Boolean.FALSE);
            }
        }

        // Actualizar campo si viene
        if (request.getIdCampo() != null) {
            Campo campo = campoRepository.findById(request.getIdCampo())
                    .orElseThrow(() -> new EntityNotFoundException("Campo no encontrado"));
            if (!campo.getUsuario().getIdUsuario().equals(idDatos)) {
                throw new AccessDeniedException("No tenés permiso para asignar este campo");
            }
            insumo.setCampo(campo);
        } else {
            insumo.setCampo(null);
        }

        // Actualizar campaña si viene
        if (request.getIdCampania() != null) {
            Campania campania = campaniaRepository.findById(request.getIdCampania())
                    .orElseThrow(() -> new EntityNotFoundException("Campaña no encontrada"));
            if (!campania.getLote().getCampo().getUsuario().getIdUsuario().equals(idDatos)) {
                throw new AccessDeniedException("No tenés permiso para vincular insumos a esta campaña");
            }
            insumo.setCampania(campania);
            if (insumo.getCampo() == null && campania.getLote() != null && campania.getLote().getCampo() != null) {
                insumo.setCampo(campania.getLote().getCampo());
            }
        } else {
            insumo.setCampania(null);
        }

        Insumo guardado = insumoRepository.save(insumo);

        String email = obtenerEmailPropietario(insumo);
        auditService.registrar(
                idUsuarioToken, email,
                EntidadAudit.INSUMO, guardado.getIdInsumo().toString(),
                guardado.getNombre(),
                AccionAudit.ACTUALIZAR,
                "Insumo actualizado"
        );

        return insumoMapper.toResponse(guardado);
    }

    @Transactional
    public InsumoResponse reponerStock(UUID id, org.agronex.backend.dto.request.ReponerStockRequest request, UUID idUsuarioToken) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        validarAccesoInsumo(insumo, idDatos, "No tenés permiso para reponer stock de este insumo");

        BigDecimal stockAnterior = insumo.getCantidad() != null ? insumo.getCantidad() : BigDecimal.ZERO;
        BigDecimal nuevoStock = stockAnterior.add(request.getCantidadAAgregar());
        insumo.setCantidad(nuevoStock);

        BigDecimal baseAnterior = insumo.getCantidadInicial() != null ? insumo.getCantidadInicial() : stockAnterior;
        insumo.setCantidadInicial(baseAnterior.add(request.getCantidadAAgregar()));

        if (request.getNuevoPrecioUnitario() != null && request.getNuevoPrecioUnitario().compareTo(BigDecimal.ZERO) > 0) {
            insumo.setPrecioUnitario(request.getNuevoPrecioUnitario());
        }

        BigDecimal umbral = insumo.getCantidadInicial().multiply(new BigDecimal("0.20"));
        if (nuevoStock.compareTo(umbral) > 0) {
            insumo.setAlertaStockBajoEnviada(Boolean.FALSE);
        }

        Insumo guardado = insumoRepository.save(insumo);

        String email = obtenerEmailPropietario(insumo);
        auditService.registrar(
                idUsuarioToken, email,
                EntidadAudit.INSUMO, guardado.getIdInsumo().toString(),
                guardado.getNombre(),
                AccionAudit.ACTUALIZAR,
                "Reponer stock: +" + request.getCantidadAAgregar() + " " + insumo.getUnidad() + ". Stock anterior: " + stockAnterior + ", nuevo: " + nuevoStock
        );

        return insumoMapper.toResponse(guardado);
    }

    @Transactional
    public void eliminarInsumo(UUID id, UUID idUsuarioToken) {
        Insumo insumo = insumoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Insumo no encontrado"));

        UUID idDatos = usuarioService.idUsuarioParaAccesoDatos(idUsuarioToken);
        validarAccesoInsumo(insumo, idDatos, "No tenés permiso para eliminar este insumo");

        String nombre = insumo.getNombre();
        String email = obtenerEmailPropietario(insumo);

        insumoRepository.delete(insumo);

        auditService.registrar(
                idUsuarioToken, email,
                EntidadAudit.INSUMO, id.toString(),
                nombre,
                AccionAudit.ELIMINAR,
                "Insumo eliminado del catálogo"
        );
    }

    private void validarAccesoInsumo(Insumo insumo, UUID idDatos, String errorMsg) {
        UUID idPropietario = insumo.getUsuario() != null
                ? insumo.getUsuario().getIdUsuario()
                : (insumo.getCampo() != null ? insumo.getCampo().getUsuario().getIdUsuario() : null);

        if (idPropietario == null || !idPropietario.equals(idDatos)) {
            throw new AccessDeniedException(errorMsg);
        }
    }

    private String obtenerEmailPropietario(Insumo insumo) {
        if (insumo.getUsuario() != null && insumo.getUsuario().getEmail() != null) {
            return insumo.getUsuario().getEmail();
        }
        if (insumo.getCampo() != null && insumo.getCampo().getUsuario() != null) {
            return insumo.getCampo().getUsuario().getEmail();
        }
        return "usuario@agronex.com";
    }
}
