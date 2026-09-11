package org.agronex.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardResumenDTO {
    private Map<String, Object> estadisticasCampos;
    private List<Object> actividadesRecientes;
    private List<Object> gastosRecientes;
    private List<Object> cosechasRecientes;
    private List<Object> insumosResumen;
    private Object configuracion;
}
