// @ts-check

/**
 * @typedef {Object} InvitacionDTO
 * @property {string} idInvitacion
 * @property {string} [idPropietario]
 * @property {string} [nombrePropietario]
 * @property {string} [emailPropietario]
 * @property {string} [idUsuarioInvitado]
 * @property {string} emailInvitado
 * @property {string} [nombreInvitado]
 * @property {string} rolOperativo
 * @property {string[]} [permisos]
 * @property {string} estado
 */

/**
 * @typedef {Object} InsumoDTO
 * @property {string|number} idInsumo
 * @property {string} nombre
 * @property {string} [tipoArticulo]
 * @property {string} [categoria]
 * @property {number} cantidad
 * @property {number} [cantidadInicial]
 * @property {string} unidad
 * @property {number} [precioUnitario]
 */

/**
 * @typedef {Object} DashboardResumenDTO
 * @property {Record<string, any>} [estadisticasCampos]
 * @property {any[]} [actividadesRecientes]
 * @property {any[]} [gastosRecientes]
 * @property {any[]} [cosechasRecientes]
 * @property {InsumoDTO[]} [insumosResumen]
 * @property {Record<string, any>} [configuracion]
 */

/**
 * Valida en frontera HTTP que el payload recibido sea un arreglo.
 * Lanza un Error de contrato si el servidor o fixture devuelve otro tipo.
 *
 * @template T
 * @param {unknown} data
 * @param {string} endpointName
 * @returns {T[]}
 */
export function assertArrayContract(data, endpointName = 'API') {
    if (!Array.isArray(data)) {
        const receivedType = data === null ? 'null' : typeof data;
        const err = new Error(`Error de contrato en ${endpointName}: se esperaba Array pero se recibió ${receivedType}.`);
        err.name = 'ContractValidationError';
        throw err;
    }
    return data;
}

/**
 * Valida en frontera HTTP que el payload recibido sea un objeto plano no nulo.
 *
 * @template {Record<string, any>} T
 * @param {unknown} data
 * @param {string} endpointName
 * @returns {T}
 */
export function assertObjectContract(data, endpointName = 'API') {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        const receivedType = data === null ? 'null' : Array.isArray(data) ? 'Array' : typeof data;
        const err = new Error(`Error de contrato en ${endpointName}: se esperaba Object pero se recibió ${receivedType}.`);
        err.name = 'ContractValidationError';
        throw err;
    }
    return /** @type {T} */ (data);
}
