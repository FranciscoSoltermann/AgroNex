/**
 * John Deere Operations Center Sandbox - Telemetry Simulation Script
 * 
 * Este script simula la inyección de una máquina ficticia (Tractor) y su historial
 * de ubicación (telemetría/geolocalización) en la organización de pruebas 7711480.
 * 
 * Requisitos:
 * - Node.js (v18 o superior para soporte nativo de fetch)
 * - Haber obtenido un Access Token válido del Sandbox de John Deere.
 * 
 * Ejecución:
 *   node simulate-telemetry.js <YOUR_ACCESS_TOKEN>
 */

const ORG_ID = "7711480";
const JD_API_BASE = "https://api.deere.com/id";

// Obtener token desde los argumentos de la línea de comandos
const token = process.argv[2];

if (!token) {
    console.error("\x1b[31mError: Se requiere un Bearer Token válido para John Deere Sandbox.\x1b[0m");
    console.log("Uso: node simulate-telemetry.js <ACCESS_TOKEN>");
    process.exit(1);
}

// Configuración común de cabeceras
const headers = {
    "Accept": "application/vnd.deere.axiom.v3+json",
    "Content-Type": "application/vnd.deere.axiom.v3+json",
    "Authorization": `Bearer ${token}`
};

async function run() {
    try {
        console.log("\x1b[36m[Paso 1] Creando Equipment (Tractor Ficticio) en John Deere Sandbox...\x1b[0m");
        
        const equipmentPayload = {
            "name": "Tractor Simulador AgroNex",
            "type": "Machine",
            "category": "TRACTOR",
            "brand": "deere",
            "model": "8R_340"
        };

        const responseEquipment = await fetch(`${JD_API_BASE}/organizations/${ORG_ID}/equipment`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(equipmentPayload)
        });

        if (!responseEquipment.ok) {
            const errText = await responseEquipment.text();
            throw new Error(`Error en Paso 1 (Crear Equipment): ${responseEquipment.status} - ${errText}`);
        }

        // La API de John Deere a menudo devuelve 201 Created y el Location Header con el ID del recurso creado
        const locationHeader = responseEquipment.headers.get("location");
        let machineId = null;

        if (locationHeader) {
            // Extraer el ID desde la URL del Location Header (ej: .../equipment/{machineId})
            const parts = locationHeader.split("/");
            machineId = parts[parts.length - 1];
        }

        // En caso de que no venga en el header de location, intentamos leer la respuesta como JSON
        if (!machineId && responseEquipment.status !== 204) {
            const body = await responseEquipment.json();
            machineId = body.id;
        }

        if (!machineId) {
            // Si es sandbox a veces devuelve directamente el ID creado en un payload vacío o similar, o lo mockeamos para control de logs
            throw new Error("No se pudo obtener el ID de la máquina creada a partir de las cabeceras de respuesta.");
        }

        console.log(`\x1b[32m✔ Equipment creado exitosamente con ID: ${machineId}\x1b[0m`);

        // Esperamos un momento para asegurar la persistencia interna en el Sandbox
        console.log("\x1b[35mEsperando 2 segundos antes de inyectar ubicación...\x1b[0m");
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(`\x1b[36m[Paso 2] Inyectando Historial de Ubicación para máquina ${machineId}...\x1b[0m`);

        // Datos de geolocalización en la región pampeana argentina (Santa Fe/Rosario)
        // JD Location History requiere formato GeoJSON Point con propiedades extendidas de telemetría
        const locationPayload = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-60.7000, -31.6300] // Longitud, Latitud (Santa Fe)
                    },
                    "properties": {
                        "eventTime": new Date().toISOString(),
                        "speed": "12.5 km/h",
                        "engineState": "1", // 1 = Running / Activo
                        "heading": 180, // Dirección (Sur)
                        "gpsQuality": "3D_FIX",
                        "source": "SIMULATED_AGRONEX"
                    }
                }
            ]
        };

        const responseLocation = await fetch(`${JD_API_BASE}/organizations/${ORG_ID}/equipment/${machineId}/locationHistory`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(locationPayload)
        });

        if (!responseLocation.ok) {
            const errText = await responseLocation.text();
            throw new Error(`Error en Paso 2 (Inyectar Location History): ${responseLocation.status} - ${errText}`);
        }

        console.log("\x1b[32m✔ Telemetría e historial de ubicación inyectados correctamente.\x1b[0m");
        console.log(`\x1b[34m[AgroNex] Coordenadas simuladas en: Longitud -60.7000, Latitud -31.6300 (Velocidad: 12.5 km/h, Motor: Encendido)\x1b[0m`);

    } catch (error) {
        console.error("\x1b[31m✕ Falló la simulación:\x1b[0m", error.message);
    }
}

run();
