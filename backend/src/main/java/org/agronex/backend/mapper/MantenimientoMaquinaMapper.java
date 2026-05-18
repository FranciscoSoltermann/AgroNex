package org.agronex.backend.mapper;

import org.agronex.backend.dto.response.MantenimientoMaquinaResponse;
import org.agronex.backend.entity.MantenimientoMaquina;
import org.springframework.stereotype.Component;

@Component
public class MantenimientoMaquinaMapper {

    /**
     * Convierte la entidad a response, incluyendo el cálculo de horas faltantes
     * para el próximo service de la máquina.
     */
    public MantenimientoMaquinaResponse toResponse(MantenimientoMaquina mant) {
        if (mant == null) return null;

        Double horasFaltantes = null;
        if (mant.getHorasProximoService() != null && mant.getUltimaLecturaHoras() != null) {
            horasFaltantes = mant.getHorasProximoService() - mant.getUltimaLecturaHoras();
        }

        return MantenimientoMaquinaResponse.builder()
                .id(mant.getId())
                .machineId(mant.getMachineId())
                .nombreMaquina(mant.getNombreMaquina())
                .horasUltimoService(mant.getHorasUltimoService())
                .horasProximoService(mant.getHorasProximoService())
                .ultimaLecturaHoras(mant.getUltimaLecturaHoras())
                .horasFaltantes(horasFaltantes)
                .build();
    }
}
