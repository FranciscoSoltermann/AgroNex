package org.agronex.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import java.time.OffsetDateTime;

@MappedSuperclass
@Getter @Setter
@NoArgsConstructor
@SuperBuilder
public abstract class Auditable {

    @Column(name = "creado_en", insertable = false, updatable = false)
    private OffsetDateTime creadoEn;

    @Column(name = "editado_en", insertable = false, updatable = false)
    private OffsetDateTime editadoEn;

    @Column(name = "eliminado_en")
    private OffsetDateTime eliminadoEn;
}