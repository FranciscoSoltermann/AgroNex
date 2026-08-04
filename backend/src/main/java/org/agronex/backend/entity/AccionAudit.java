package org.agronex.backend.entity;

/**
 * Tipos de acción registrables en la bitácora de auditoría.
 */
public enum AccionAudit {
    CREAR,
    ACTUALIZAR,
    ELIMINAR,
    INICIAR_SESION,
    CERRAR_SESION,
    REGISTRO,
    EXPORTAR,
    CAMBIO_PLAN,
    PAGO_RECIBIDO,
    PAGO_CANCELADO,
    ALERTA_ENVIADA
}

