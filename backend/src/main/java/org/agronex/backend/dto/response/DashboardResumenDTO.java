package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResumenDTO implements Serializable {
    private Map<String, Object> estadisticasCampos;
    private List<Object> actividadesRecientes;
    private List<Object> gastosRecientes;
    private List<Object> cosechasRecientes;
    private List<Object> insumosResumen;
    private Object configuracion;
}
