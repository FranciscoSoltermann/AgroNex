package org.agronex.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.agronex.backend.enums.TipoArticulo;
import org.agronex.backend.enums.UnidadMedida;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsumoRequest {
    @NotBlank(message = "El nombre del insumo es obligatorio")
    private String nombre;

    private TipoArticulo tipoArticulo;

    private String subtipo;

    @NotNull(message = "El precio unitario es obligatorio")
    @PositiveOrZero(message = "El precio no puede ser negativo")
    private BigDecimal precioUnitario;

    @NotNull(message = "La unidad de medida es obligatoria")
    private UnidadMedida unidad;

    @PositiveOrZero(message = "El peso de la bolsa no puede ser negativo")
    private BigDecimal pesoBolsaKg;

    @NotNull(message = "La cantidad es obligatoria")
    @PositiveOrZero(message = "La cantidad no puede ser negativa")
    private BigDecimal cantidad;

    // Opcional: si no se asigna, pertenece al inventario general del usuario
    private UUID idCampo;

    // Opcional: si se asigna, el insumo pertenece a esta campaña
    private UUID idCampania;
}

