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
  console.log('=== INICIANDO PLAN INTEGRAL PARA LOTE 1 (CAMPO NORTE) ===');
  const token = await loginSupabase();
  console.log('✓ Token JWT validado');

  const campos = await apiRequest(token, 'GET', '/campos');
  const lotes = await apiRequest(token, 'GET', '/lotes');

  // Seleccionar lote 1 en campo norte
  const lote1 = lotes.find(l => l.nombre.toLowerCase().includes('lote 1')) || lotes[0];
  const campoNorte = campos.find(c => c.idCampo === lote1.idCampo);
  console.log(`✓ Lote seleccionado: "${lote1.nombre}" en "${lote1.nombreCampo}" (${lote1.superficie} Ha)`);

  console.log('\n--- 1. CARGA DE INSUMOS ESPECIALIZADOS PARA MAÍZ ---');
  const existingInsumos = await apiRequest(token, 'GET', '/insumos');

  async function getOrCreateInsumo(name, payload) {
    const found = existingInsumos.find(i => i.nombre.toLowerCase() === name.toLowerCase() && i.idCampo === lote1.idCampo);
    if (found) {
      console.log(`✓ Insumo ya existente: ${found.nombre} (Stock: ${found.cantidad} ${found.unidad})`);
      return found;
    }
    const created = await apiRequest(token, 'POST', '/insumos', payload);
    console.log(`✓ Insumo registrado: ${created.nombre} (Stock: ${created.cantidad} ${created.unidad}, Precio: $${created.precioUnitario})`);
    return created;
  }

  // 1. Herbicida Glifosato
  const insGlifosatoNorte = await getOrCreateInsumo('Glifosato 66% Concentrado', {
    nombre: 'Glifosato 66% Concentrado',
    tipoArticulo: 'HERBICIDA',
    subtipo: 'Barbecho',
    precioUnitario: 5.00,
    unidad: 'LITROS',
    cantidad: 100.00,
    idCampo: lote1.idCampo
  });

  // 2. Herbicida Atrazina
  const insAtrazina = await getOrCreateInsumo('Atrazina 90 WG Granulada', {
    nombre: 'Atrazina 90 WG Granulada',
    tipoArticulo: 'HERBICIDA',
    subtipo: 'Pre-emergente Maíz',
    precioUnitario: 12.00,
    unidad: 'KILOGRAMOS',
    cantidad: 40.00,
    idCampo: lote1.idCampo
  });

  // 3. Semilla Maíz Híbrido
  const insSemillaMaiz = await getOrCreateInsumo('Semilla Maíz Híbrido Dekalb 72-20 VT3P', {
    nombre: 'Semilla Maíz Híbrido Dekalb 72-20 VT3P',
    tipoArticulo: 'SEMILLA',
    subtipo: 'Bolsa 80.000 semillas',
    precioUnitario: 220.00,
    unidad: 'BOLSAS',
    cantidad: 20.00,
    idCampo: lote1.idCampo
  });

  // 4. Fertilizante MAP
  const insMapNorte = await getOrCreateInsumo('Fosfato Monoamónico (MAP) Arrancador', {
    nombre: 'Fosfato Monoamónico (MAP) Arrancador',
    tipoArticulo: 'FERTILIZANTE',
    subtipo: 'Arrancador a la siembra',
    precioUnitario: 0.85,
    unidad: 'KILOGRAMOS',
    cantidad: 2000.00,
    idCampo: lote1.idCampo
  });

  // 5. Fertilizante Urea Granulada
  const insUrea = await getOrCreateInsumo('Urea Granulada 46-0-0', {
    nombre: 'Urea Granulada 46-0-0',
    tipoArticulo: 'FERTILIZANTE',
    subtipo: 'Nitrogenado de cobertura',
    precioUnitario: 0.65,
    unidad: 'KILOGRAMOS',
    cantidad: 3500.00,
    idCampo: lote1.idCampo
  });

  // 6. Insecticida Ampligo
  const insInsecticida = await getOrCreateInsumo('Insecticida Ampligo (Spodoptera)', {
    nombre: 'Insecticida Ampligo (Spodoptera)',
    tipoArticulo: 'INSECTICIDA',
    subtipo: 'Control Oruga Cogollera',
    precioUnitario: 65.00,
    unidad: 'LITROS',
    cantidad: 5.00,
    idCampo: lote1.idCampo
  });

  // 7. Fungicida Miravis Duo
  const insFungicidaNorte = await getOrCreateInsumo('Fungicida Miravis Duo (Roya y Tizón)', {
    nombre: 'Fungicida Miravis Duo (Roya y Tizón)',
    tipoArticulo: 'OTRO',
    subtipo: 'Fungicida Maíz',
    precioUnitario: 48.00,
    unidad: 'LITROS',
    cantidad: 6.00,
    idCampo: lote1.idCampo
  });

  console.log('\n--- 2. CREACIÓN O RECUPERACIÓN DE LA CAMPAÑA DE MAÍZ ---');
  const existingCampanias = await apiRequest(token, 'GET', '/campanias');
  let campaniaMaiz = existingCampanias.find(c => c.idLote === lote1.idLote && c.cultivo === 'MAIZ');
  if (!campaniaMaiz) {
    campaniaMaiz = await apiRequest(token, 'POST', '/campanias', {
      cultivo: 'MAIZ',
      fechaInicio: '2026-09-01',
      fechaFin: '2027-04-10',
      idLote: lote1.idLote
    });
    console.log(`✓ Campaña creada: ID ${campaniaMaiz.idCampania} - Cultivo: ${campaniaMaiz.cultivo} (${lote1.superficie} Ha)`);
  } else {
    console.log(`✓ Campaña existente encontrada: ID ${campaniaMaiz.idCampania} - Cultivo: ${campaniaMaiz.cultivo}`);
  }

  console.log('\n--- 3. REGISTRO DE GASTOS ESTRUCTURALES / FIJOS ---');
  const existingGastos = await apiRequest(token, 'GET', '/gastos');

  async function getOrCreateGasto(cat, desc, monto) {
    const found = existingGastos.find(g => g.categoria === cat && g.descripcion === desc);
    if (found) {
      console.log(`✓ Gasto estructural existente: [${cat}] ${desc} ($${found.montoTotal} USD)`);
      return found;
    }
    const created = await apiRequest(token, 'POST', '/gastos', {
      fecha: '2026-09-05',
      categoria: cat,
      descripcion: desc,
      montoTotal: monto,
      moneda: 'USD',
      idCampo: lote1.idCampo,
      idCampania: campaniaMaiz.idCampania
    });
    console.log(`✓ Gasto estructural registrado: [${created.categoria}] ${created.descripcion} ($${created.montoTotal} USD)`);
    return created;
  }

  // 1. Arrendamiento rural (13 ha * $120/ha = $1,560 USD)
  await getOrCreateGasto('Arrendamiento', 'Alquiler rural campo agrícola (13 Ha a USD 120/ha)', 1560.00);

  // 2. Seguro Multirriesgo y Granizo ($35/ha = $455 USD)
  await getOrCreateGasto('Seguro Agrícola', 'Póliza seguro multirriesgo agrícola y granizo con viento', 455.00);

  // 3. Asesoramiento agronómico
  await getOrCreateGasto('Honorarios Profesionales', 'Asesoría técnica agronómica y monitoreo semanal de plagas', 300.00);

  // 4. Impuestos y tasas viales
  await getOrCreateGasto('Impuestos y Tasas', 'Impuesto inmobiliario rural provincial y tasa red vial comunal', 220.00);

  // 5. Mantenimiento estructural
  await getOrCreateGasto('Mantenimiento', 'Mantenimiento de caminos internos, alcantarillas y alambrado perimetral', 280.00);

  console.log('✓ Total Gastos Estructurales Imputados: $2.815,00 USD ($216,54 USD/Ha)');

  console.log('\n--- 4. REGISTRO DE 5 ACTIVIDADES DE CAMPO Y CONSUMO DE INSUMOS ---');
  const existingActividades = await apiRequest(token, 'GET', '/actividades');
  const campActs = existingActividades.filter(a => a.idCampania === campaniaMaiz.idCampania);

  // Actividad 1: Barbecho Largo
  let act1 = campActs.find(a => a.fecha === '2026-09-15');
  if (!act1) {
    console.log('-> Registrando Actividad 1: Barbecho Químico Largo...');
    act1 = await apiRequest(token, 'POST', '/actividades', {
      idCampania: campaniaMaiz.idCampania,
      tipoActv: 'Pulverización',
      fecha: '2026-09-15',
      costoServicio: 8.00,
      moneda: 'USD',
      hectareasTratadas: lote1.superficie,
      notas: 'Barbecho químico con residuales: Glifosato para malezas nacidas y Atrazina como pre-emergente.',
      insumos: [
        { idInsumo: insGlifosatoNorte.idInsumo, dosisHa: 2.50 },
        { idInsumo: insAtrazina.idInsumo, dosisHa: 1.20 }
      ]
    });
    console.log(`  ✓ Actividad 1 registrada. Consumo Glifosato: ${lote1.superficie * 2.5} L. Consumo Atrazina: ${lote1.superficie * 1.2} kg. Costo labor: $${lote1.superficie * 8} USD.`);
  } else {
    console.log('  ✓ Actividad 1 ya registrada.');
  }

  // Actividad 2: Siembra de Maíz con Arrancador
  let act2 = campActs.find(a => a.fecha === '2026-10-10');
  if (!act2) {
    console.log('-> Registrando Actividad 2: Siembra de Maíz de Precisión...');
    // 13 ha * 1.25 bolsas/ha = 16.25 bolsas -> deja 3.75 bolsas de 20 (18.75% <= 20% -> ALERTA STOCK)
    act2 = await apiRequest(token, 'POST', '/actividades', {
      idCampania: campaniaMaiz.idCampania,
      tipoActv: 'Siembra',
      fecha: '2026-10-10',
      costoServicio: 55.00,
      moneda: 'USD',
      hectareasTratadas: lote1.superficie,
      notas: 'Siembra neumática a placa a 52 cm. 75.000 semillas/ha. Fertilización en línea con MAP arrancador.',
      insumos: [
        { idInsumo: insSemillaMaiz.idInsumo, dosisHa: 1.25 },
        { idInsumo: insMapNorte.idInsumo, dosisHa: 100.00 }
      ]
    });
    console.log(`  ✓ Actividad 2 registrada. Consumo Semilla: ${lote1.superficie * 1.25} bolsas. Consumo MAP: ${lote1.superficie * 100} kg. Costo labor: $${lote1.superficie * 55} USD.`);
  } else {
    console.log('  ✓ Actividad 2 ya registrada.');
  }

  // Actividad 3: Refertilización Nitrogenada en V6
  let act3 = campActs.find(a => a.fecha === '2026-11-25');
  if (!act3) {
    console.log('-> Registrando Actividad 3: Refertilización Nitrogenada (Urea)...');
    act3 = await apiRequest(token, 'POST', '/actividades', {
      idCampania: campaniaMaiz.idCampania,
      tipoActv: 'Fertilización',
      fecha: '2026-11-25',
      costoServicio: 15.00,
      moneda: 'USD',
      hectareasTratadas: lote1.superficie,
      notas: 'Incorporación entre líneas de Urea granulada en estado fenológico V6 previo a lluvia pronosticada.',
      insumos: [
        { idInsumo: insUrea.idInsumo, dosisHa: 180.00 }
      ]
    });
    console.log(`  ✓ Actividad 3 registrada. Consumo Urea: ${lote1.superficie * 180} kg. Costo labor: $${lote1.superficie * 15} USD.`);
  } else {
    console.log('  ✓ Actividad 3 ya registrada.');
  }

  // Actividad 4: Control Sanitario - Cogollero
  let act4 = campActs.find(a => a.fecha === '2026-12-20');
  if (!act4) {
    console.log('-> Registrando Actividad 4: Control de Oruga Cogollera (Spodoptera)...');
    act4 = await apiRequest(token, 'POST', '/actividades', {
      idCampania: campaniaMaiz.idCampania,
      tipoActv: 'Pulverización',
      fecha: '2026-12-20',
      costoServicio: 8.00,
      moneda: 'USD',
      hectareasTratadas: lote1.superficie,
      notas: 'Tratamiento selectivo por monitoreo de daño foliar en cogollo grado Davis 3.',
      insumos: [
        { idInsumo: insInsecticida.idInsumo, dosisHa: 0.15 }
      ]
    });
    console.log(`  ✓ Actividad 4 registrada. Consumo Ampligo: ${lote1.superficie * 0.15} L. Costo labor: $${lote1.superficie * 8} USD.`);
  } else {
    console.log('  ✓ Actividad 4 ya registrada.');
  }

  // Actividad 5: Protección Foliar - Roya y Tizón
  let act5 = campActs.find(a => a.fecha === '2027-01-15');
  if (!act5) {
    console.log('-> Registrando Actividad 5: Protección Foliar Fungicida...');
    act5 = await apiRequest(token, 'POST', '/actividades', {
      idCampania: campaniaMaiz.idCampania,
      tipoActv: 'Pulverización',
      fecha: '2027-01-15',
      costoServicio: 8.00,
      moneda: 'USD',
      hectareasTratadas: lote1.superficie,
      notas: 'Aplicación preventiva de Miravis Duo en VT/R1 para protección del tercio superior.',
      insumos: [
        { idInsumo: insFungicidaNorte.idInsumo, dosisHa: 0.30 }
      ]
    });
    console.log(`  ✓ Actividad 5 registrada. Consumo Miravis: ${lote1.superficie * 0.30} L. Costo labor: $${lote1.superficie * 8} USD.`);
  } else {
    console.log('  ✓ Actividad 5 ya registrada.');
  }

  console.log('\n--- 5. REGISTRO DE COSECHA DE MAÍZ CON LOGÍSTICA ---');
  const existingCosechas = await apiRequest(token, 'GET', '/cosechas');
  let cosechaMaiz = existingCosechas.find(c => c.idCampania === campaniaMaiz.idCampania);
  if (!cosechaMaiz) {
    // 95 qq/ha * 13 ha = 1235 qq (123.5 tn)
    cosechaMaiz = await apiRequest(token, 'POST', '/cosechas', {
      idCampania: campaniaMaiz.idCampania,
      fecha: '2027-04-10',
      rendimientoTotalQq: 1235.00,
      precioVentaUnitarioUsd: 18.00, // 18 USD/qq = 180 USD/tn
      humedadPorcentaje: 14.2,
      tipoLogistica: 'TERCERIZADO',
      fleteTercerizadoCostoTotal: 1100.00,
      observaciones: 'Cosecha de maíz de alto potencial. Humedad comercial óptima. Flete a puerto Rosario tercerizado.'
    });
    console.log(`✓ Cosecha registrada: 1.235 quintales (95.0 qq/ha = 123.5 tn). Precio: $18 USD/qq ($180 USD/tn). Flete: $1.100 USD.`);
  } else {
    console.log(`✓ Cosecha ya registrada: ${cosechaMaiz.rendimientoTotalQq} qq a $${cosechaMaiz.precioVentaUnitarioUsd} USD/qq.`);
  }

  console.log('\n--- 6. BALANCE FINANCIERO Y RESULTADOS DE MAÍZ ---');
  const resumenFin = await apiRequest(token, 'GET', `/finanzas/campania/${campaniaMaiz.idCampania}/resumen?moneda=USD`);
  console.log('---------------------------------------------------');
  console.log(`Cultivo:                       ${resumenFin.cultivo}`);
  console.log(`Superficie:                    ${resumenFin.superficieLoteHa} Ha`);
  console.log(`Rendimiento por Ha:            ${resumenFin.quintalesPorHa} qq/ha (${parseFloat(resumenFin.quintalesPorHa)/10} tn/ha)`);
  console.log(`Ingresos Totales (Cosecha):    $${resumenFin.ingresosTotales} USD ($${resumenFin.ingresosPorHa} USD/ha)`);
  console.log(`Costo Labores (Servicios):     $${resumenFin.costoServiciosTotal} USD`);
  console.log(`Costo Insumos (7 insumos):     $${resumenFin.costoInsumosTotal} USD`);
  console.log(`Costo Flete / Logística:       $${resumenFin.costoLogisticaTotal} USD`);
  console.log(`Gastos Estructurales (Fijos):  $${resumenFin.gastosFijosAsignados} USD`);
  console.log(`Costo Total Consolidado:       $${resumenFin.costoTotal} USD ($${resumenFin.costoPorHa} USD/ha)`);
  console.log(`Margen Bruto Neto:             $${resumenFin.margenBruto} USD ($${resumenFin.margenBrutoPorHa} USD/ha)`);
  console.log(`Retorno sobre Inversión (ROI): ${resumenFin.roiPorcentaje}%`);
  console.log('---------------------------------------------------');

  console.log('\n--- 7. PLAYWRIGHT: NAVEGACIÓN Y CAPTURAS EN VIVO DE LOTE 1 ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  console.log('-> Login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', '***REDACTED***');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await page.waitForTimeout(4000);

  // 1. Dashboard
  console.log('-> Capturing Dashboard Home...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_dashboard_completo.png'), fullPage: true });

  // 2. Lotes -> Seleccionar Lote 1 (Campo Norte)
  console.log('-> Navigating to Lotes and selecting Lote 1 (Campo Norte)...');
  await page.goto('http://localhost:3000/dashboard/lotes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const selects = page.locator('select');
  if (await selects.count() > 0) {
    const loteSelect = selects.first();
    const opts = await loteSelect.locator('option').all();
    for (const opt of opts) {
      const text = await opt.textContent();
      if (text.includes('lote 1') || text.includes('campo norte')) {
        const val = await opt.getAttribute('value');
        console.log(`Selecting lote option: "${text}" with value "${val}"`);
        await loteSelect.selectOption(val);
        break;
      }
    }
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_lote1_maiz.png'), fullPage: true });

  // 3. Inventario
  console.log('-> Navigating to Inventario...');
  await page.goto('http://localhost:3000/dashboard/inventario', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_inventario_completo.png'), fullPage: true });

  // 4. Finanzas -> Seleccionar Campaña MAIZ en Lote 1 y USD
  console.log('-> Navigating to Finanzas and selecting MAIZ...');
  await page.goto('http://localhost:3000/dashboard/finanzas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Toggle USD
  const usdBtn = page.locator('button:has-text("USD")');
  if (await usdBtn.count() > 0) {
    await usdBtn.first().click();
    await page.waitForTimeout(1000);
  }

  // Select MAIZ campaign in top campaign select
  const campSelect = page.locator('select').first();
  if (await campSelect.count() > 0) {
    const campOpts = await campSelect.locator('option').all();
    for (const opt of campOpts) {
      const text = await opt.textContent();
      if (text.toUpperCase().includes('MAIZ') || text.includes('lote 1')) {
        const val = await opt.getAttribute('value');
        console.log(`Selecting campaign option: "${text}"`);
        await campSelect.selectOption(val);
        break;
      }
    }
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'web_finanzas_maiz_usd.png'), fullPage: true });

  await browser.close();
  console.log('\n✓✓✓ PLAN COMPLETO EN LOTE 1 FINALIZADO CON ÉXITO AL 100%! ✓✓✓');
}

main().catch(err => {
  console.error('\n❌ ERROR EN LA EJECUCIÓN:', err);
  process.exit(1);
});
