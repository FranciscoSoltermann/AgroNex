const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '../frontend/node_modules/@playwright/test'));

const ARTIFACTS_DIR = 'C:\\Users\\fraso\\.gemini\\antigravity\\brain\\e259101a-b69b-4c04-89da-4f9e027fc7af';

async function loginSupabase() {
  const data = JSON.stringify({
    email: 'user@example.com',
    password: '***REDACTED***'
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'qgokssagrwpsfryhczug.supabase.co',
      path: '/auth/v1/token?grant_type=password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnb2tzc2Fncndwc2ZyeWhjenVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDc3NjgsImV4cCI6MjA4ODIyMzc2OH0.O86uIRcTatj8naqra4foOgzJWYGTTkaykFgVOsdEI1c',
        'Content-Length': data.length
      }
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        const json = JSON.parse(b);
        if (!json.access_token) reject(new Error('Login failed: ' + JSON.stringify(json)));
        resolve(json.access_token);
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function apiRequest(token, method, endpoint, payload) {
  return new Promise((resolve, reject) => {
    const bodyData = payload ? JSON.stringify(payload) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api' + endpoint,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(bodyData ? { 'Content-Length': Buffer.byteLength(bodyData) } : {})
      }
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(b);
          if (res.statusCode >= 400) {
            reject(new Error(`API Error [${res.statusCode}] on ${method} ${endpoint}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject(new Error(`API Error [${res.statusCode}] on ${method} ${endpoint}: ${b}`));
          } else {
            resolve(b);
          }
        }
      });
    });
    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function main() {
  console.log('--- 1. AUTENTICACIÓN CON SUPABASE ---');
  const token = await loginSupabase();
  console.log('✓ Token JWT obtenido exitosamente para user@example.com');

  console.log('\n--- 2. IDENTIFICACIÓN DE CAMPOS Y LOTES EXISTENTES ---');
  const campos = await apiRequest(token, 'GET', '/campos');
  const lotes = await apiRequest(token, 'GET', '/lotes');
  console.log(`✓ Campos encontrados: ${campos.length}`);
  console.log(`✓ Lotes encontrados: ${lotes.length}`);

  // Buscamos "lote 2" en "campo sur" (27 ha)
  const lote2 = lotes.find(l => l.nombre.toLowerCase().includes('lote 2')) || lotes[0];
  console.log(`✓ Lote seleccionado para la campaña: "${lote2.nombre}" en "${lote2.nombreCampo}" (${lote2.superficie} Ha)`);

  console.log('\n--- 3. CARGA DE INSUMOS EN EL INVENTARIO ---');
  const existingInsumos = await apiRequest(token, 'GET', '/insumos');

  async function getOrCreateInsumo(name, payload) {
    const found = existingInsumos.find(i => i.nombre.toLowerCase() === name.toLowerCase());
    if (found) {
      console.log(`✓ Insumo ya existente: ${found.nombre} (Stock: ${found.cantidad} ${found.unidad})`);
      return found;
    }
    const created = await apiRequest(token, 'POST', '/insumos', payload);
    console.log(`✓ Insumo registrado: ${created.nombre} (Stock: ${created.cantidad} ${created.unidad}, Precio: $${created.precioUnitario})`);
    return created;
  }

  // 1. Glifosato
  const insGlifosato = await getOrCreateInsumo('Glifosato 66% Premium', {
    nombre: 'Glifosato 66% Premium',
    tipoArticulo: 'HERBICIDA',
    subtipo: 'Barbecho',
    precioUnitario: 5.00,
    unidad: 'LITROS',
    cantidad: 200.00,
    idCampo: lote2.idCampo
  });

  // 2. Semilla Soja
  const insSemilla = await getOrCreateInsumo('Semilla Soja Fiscalizada DM 46R18', {
    nombre: 'Semilla Soja Fiscalizada DM 46R18',
    tipoArticulo: 'SEMILLA',
    subtipo: 'Grupo IV',
    precioUnitario: 0.60,
    unidad: 'KILOGRAMOS',
    cantidad: 2500.00,
    idCampo: lote2.idCampo
  });

  // 3. MAP
  const insMap = await getOrCreateInsumo('Fertilizante MAP (Monoamónico)', {
    nombre: 'Fertilizante MAP (Monoamónico)',
    tipoArticulo: 'FERTILIZANTE',
    subtipo: 'Arrancador',
    precioUnitario: 0.80,
    unidad: 'KILOGRAMOS',
    cantidad: 3000.00,
    idCampo: lote2.idCampo
  });

  // 4. Fungicida
  const insFungicida = await getOrCreateInsumo('Fungicida Ciproconazol + Azoxistrobina', {
    nombre: 'Fungicida Ciproconazol + Azoxistrobina',
    tipoArticulo: 'OTRO',
    subtipo: 'Fungicida',
    precioUnitario: 20.00,
    unidad: 'LITROS',
    cantidad: 20.00,
    idCampo: lote2.idCampo
  });

  console.log('\n--- 4. CREACIÓN O RECUPERACIÓN DE LA CAMPAÑA AGRÍCOLA ---');
  const existingCampanias = await apiRequest(token, 'GET', '/campanias');
  let campania = existingCampanias.find(c => c.idLote === lote2.idLote && c.cultivo === 'SOJA');
  if (!campania) {
    campania = await apiRequest(token, 'POST', '/campanias', {
      cultivo: 'SOJA',
      fechaInicio: '2026-10-15',
      fechaFin: '2027-04-30',
      idLote: lote2.idLote
    });
    console.log(`✓ Campaña creada: ID ${campania.idCampania} - Cultivo: ${campania.cultivo} (${lote2.superficie} Ha)`);
  } else {
    console.log(`✓ Campaña existente encontrada: ID ${campania.idCampania} - Cultivo: ${campania.cultivo} (${lote2.superficie} Ha)`);
  }

  console.log('\n--- 5. REGISTRO DE ACTIVIDADES DE CAMPO Y CONSUMO DE INSUMOS ---');
  const existingActividades = await apiRequest(token, 'GET', '/actividades');
  const campActs = existingActividades.filter(a => a.idCampania === campania.idCampania);

  // Actividad 1: Barbecho
  let act1 = campActs.find(a => a.tipoActv === 'Pulverización' && a.fecha === '2026-10-20');
  if (!act1) {
    console.log('-> Registrando Actividad 1: Barbecho Químico...');
    act1 = await apiRequest(token, 'POST', '/actividades', {
      idCampania: campania.idCampania,
      tipoActv: 'Pulverización',
      fecha: '2026-10-20',
      costoServicio: 8.00,
      moneda: 'USD',
      hectareasTratadas: lote2.superficie,
      notas: 'Barbecho químico pre-siembra. Control de malezas de hoja ancha y gramíneas.',
      insumos: [
        { idInsumo: insGlifosato.idInsumo, dosisHa: 3.00 }
      ]
    });
    console.log(`  ✓ Actividad 1 registrada. Consumo Glifosato: ${lote2.superficie * 3} L. Costo labor: $${lote2.superficie * 8} USD.`);
  } else {
    console.log(`  ✓ Actividad 1 (Barbecho) ya registrada previamente.`);
  }

  // Actividad 2: Siembra + Fertilización
  let act2 = campActs.find(a => a.tipoActv === 'Siembra' && a.fecha === '2026-11-10');
  if (!act2) {
    console.log('-> Registrando Actividad 2: Siembra con fertilización...');
    act2 = await apiRequest(token, 'POST', '/actividades', {
      idCampania: campania.idCampania,
      tipoActv: 'Siembra',
      fecha: '2026-11-10',
      costoServicio: 45.00,
      moneda: 'USD',
      hectareasTratadas: lote2.superficie,
      notas: 'Siembra directa neumática a 52 cm. Fertilización en línea con MAP.',
      insumos: [
        { idInsumo: insSemilla.idInsumo, dosisHa: 70.00 },
        { idInsumo: insMap.idInsumo, dosisHa: 90.00 }
      ]
    });
    console.log(`  ✓ Actividad 2 registrada. Consumo Semilla: ${lote2.superficie * 70} kg. Consumo MAP: ${lote2.superficie * 90} kg. Costo labor: $${lote2.superficie * 45} USD.`);
  } else {
    console.log(`  ✓ Actividad 2 (Siembra) ya registrada previamente.`);
  }

  // Actividad 3: Protección Fitosanitaria
  let act3 = campActs.find(a => a.tipoActv === 'Pulverización' && a.fecha === '2027-01-20');
  if (!act3) {
    console.log('-> Registrando Actividad 3: Protección Sanitaria (Fungicida)...');
    act3 = await apiRequest(token, 'POST', '/actividades', {
      idCampania: campania.idCampania,
      tipoActv: 'Pulverización',
      fecha: '2027-01-20',
      costoServicio: 8.00,
      moneda: 'USD',
      hectareasTratadas: lote2.superficie,
      notas: 'Aplicación preventiva de fungicida en R3 frente a Mancha Ojo de Rana.',
      insumos: [
        { idInsumo: insFungicida.idInsumo, dosisHa: 0.60 }
      ]
    });
    console.log(`  ✓ Actividad 3 registrada. Consumo Fungicida: ${lote2.superficie * 0.6} L. Costo labor: $${lote2.superficie * 8} USD.`);
  } else {
    console.log(`  ✓ Actividad 3 (Fungicida) ya registrada previamente.`);
  }

  console.log('\n--- 6. REGISTRO DE COSECHA Y LIQUIDACIÓN DE GRANOS ---');
  const existingCosechas = await apiRequest(token, 'GET', '/cosechas');
  let cosecha = existingCosechas.find(c => c.idCampania === campania.idCampania);
  if (!cosecha) {
    cosecha = await apiRequest(token, 'POST', '/cosechas', {
      idCampania: campania.idCampania,
      fecha: '2027-04-15',
      rendimientoTotalQq: 1080.00,
      precioVentaUnitarioUsd: 30.00,
      humedadPorcentaje: 13.5,
      observaciones: 'Cosecha de excelente calidad comercial. Grano entregado en acopio local.'
    });
    console.log(`✓ Cosecha liquidada: 1.080 quintales (40.0 qq/ha = 108 tn). Precio: $30 USD/qq. Total Ingresos: $32.400 USD.`);
  } else {
    console.log(`✓ Cosecha ya registrada previamente: ${cosecha.rendimientoTotalQq} qq a $${cosecha.precioVentaUnitarioUsd} USD/qq.`);
  }

  console.log('\n--- 7. CONSULTA DE RESULTADOS FINANCIEROS Y BALANCE ---');
  const resumenFin = await apiRequest(token, 'GET', `/finanzas/campania/${campania.idCampania}/resumen?moneda=USD`);
  console.log('---------------------------------------------------');
  console.log(`Cultivo:                  ${resumenFin.cultivo}`);
  console.log(`Superficie:               ${resumenFin.superficieLoteHa} Ha`);
  console.log(`Rendimiento por Ha:       ${resumenFin.quintalesPorHa} qq/ha`);
  console.log(`Ingresos Totales:         $${resumenFin.ingresosTotales} USD ($${resumenFin.ingresosPorHa} USD/ha)`);
  console.log(`Costo Labores Total:      $${resumenFin.costoServiciosTotal} USD`);
  console.log(`Costo Insumos Total:      $${resumenFin.costoInsumosTotal} USD`);
  console.log(`Costo Operativo Total:    $${resumenFin.costoTotal} USD ($${resumenFin.costoPorHa} USD/ha)`);
  console.log(`Margen Bruto Total:       $${resumenFin.margenBruto} USD ($${resumenFin.margenBrutoPorHa} USD/ha)`);
  console.log(`Retorno de Inversión ROI: ${resumenFin.roiPorcentaje}%`);
  console.log('---------------------------------------------------');

  console.log('\n--- 8. NAVEGACIÓN Y CAPTURA DE PANTALLA CON PLAYWRIGHT ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('-> Iniciando sesión en la Web UI: http://localhost:3000/login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', '***REDACTED***');
  await page.click('button[type="submit"]');

  console.log('-> Esperando redirección al Dashboard...');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await page.waitForTimeout(3000); // Esperar que carguen las métricas y Recharts

  const ssDashboard = path.join(ARTIFACTS_DIR, 'web_dashboard.png');
  await page.screenshot({ path: ssDashboard, fullPage: false });
  console.log(`✓ Captura guardada: ${ssDashboard}`);

  console.log('-> Navegando a Campañas y Lotes (/dashboard/lotes)...');
  await page.goto('http://localhost:3000/dashboard/lotes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const ssLotes = path.join(ARTIFACTS_DIR, 'web_lotes.png');
  await page.screenshot({ path: ssLotes, fullPage: false });
  console.log(`✓ Captura guardada: ${ssLotes}`);

  console.log('-> Navegando a Inventario (/dashboard/inventario)...');
  await page.goto('http://localhost:3000/dashboard/inventario', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const ssInventario = path.join(ARTIFACTS_DIR, 'web_inventario.png');
  await page.screenshot({ path: ssInventario, fullPage: false });
  console.log(`✓ Captura guardada: ${ssInventario}`);

  console.log('-> Navegando a Finanzas (/dashboard/finanzas)...');
  await page.goto('http://localhost:3000/dashboard/finanzas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const ssFinanzas = path.join(ARTIFACTS_DIR, 'web_finanzas.png');
  await page.screenshot({ path: ssFinanzas, fullPage: false });
  console.log(`✓ Captura guardada: ${ssFinanzas}`);

  await browser.close();
  console.log('\n✓ CARGA Y VERIFICACIÓN INTERACTIVA FINALIZADA CON ÉXITO AL 100%!');
}

main().catch(err => {
  console.error('\n❌ ERROR EN LA EJECUCIÓN:', err);
  process.exit(1);
});
