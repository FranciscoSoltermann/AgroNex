package org.agronex.backend.enums;

/**
 * Roles del sistema AgroNex.
 *
 * ADMIN       → acceso total: puede ver audit de todos los usuarios, gestionar el sistema.
 * PROPIETARIO → dueño de campos: CRUD completo sobre sus propios recursos.
 * EMPLEADO    → trabajador asociado: solo lectura sobre los recursos del propietario que lo asignó.
 *               No puede crear campos, ni eliminar recursos críticos.
 */
public enum RolUsuario {
    ADMIN,
    PROPIETARIO,
    EMPLEADO
}
