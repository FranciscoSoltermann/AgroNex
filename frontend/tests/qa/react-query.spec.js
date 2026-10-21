const { test, expect } = require('@playwright/test');

test.describe('React Query Flows (API Mocked)', () => {
  let unexpectedApiRequests = [];

  test.beforeEach(async ({ page }) => {
    unexpectedApiRequests = [];
    page.on('console', msg => console.log(`[Browser] ${msg.type()}: ${msg.text()}`));
    page.on('requestfailed', request => console.log(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`));
    
    // Fallback for any other API requests (registered FIRST so specific mocks override it)
    await page.route('**/api/**', async route => {
        const url = route.request().url();
        console.error(`[Mock Fallback] Unexpected unmocked API request: ${route.request().method()} ${url}`);
        unexpectedApiRequests.push(`${route.request().method()} ${url}`);
        await route.abort('failed');
    });

    // Mock Supabase Auth to avoid login redirect
    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-user-123',
          email: 'test@agronex.com'
        })
      });
    });

    const tokenObj = {
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-refresh-token',
        user: {
            id: 'mock-user-123',
            email: 'test@agronex.com',
            aud: 'authenticated',
            role: 'authenticated',
            user_metadata: { nombre: 'Test User' },
            app_metadata: { provider: 'email', providers: ['email'] }
        }
    };
    
    await page.context().addCookies([
      {
        name: 'playwright-bypass',
        value: 'true',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'sb-qgokssagrwpsfryhczug-auth-token',
        value: JSON.stringify(tokenObj),
        domain: 'localhost',
        path: '/'
      }
    ]);

    await page.addInitScript((tokenStr) => {
        window.sessionStorage.setItem('sb-qgokssagrwpsfryhczug-auth-token', tokenStr);
        window.localStorage.setItem('sb-qgokssagrwpsfryhczug-auth-token', tokenStr);
    }, JSON.stringify(tokenObj));

    // Mock API base URLs with valid contract payloads
    await page.route('**/api/campos/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ camposActivos: 3, lotesTotales: 5, hectareasTotales: 1500.5 })
      });
    });

    await page.route('**/api/insumos*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { idInsumo: 1, nombre: 'Fertilizante A', tipoArticulo: 'FERTILIZANTE', categoria: 'FERTILIZANTE', cantidad: 100, precioUnitario: 25, unidad: 'KILOGRAMOS' }
          ])
        });
      } else {
        await route.fallback();
      }
    });

    // Mock global layout & banner components by contract
    await page.route('**/api/invitaciones/mis-pendientes*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/equipo/invitaciones*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/usuarios/me/perfil*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ idUsuario: 'mock-user-123', email: 'test@agronex.com', rol: 'PROPIETARIO' }) }));
    await page.route('**/api/dashboard/resumen*', async route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        estadisticasCampos: { camposActivos: 3, lotesTotales: 5, hectareasTotales: 1500.5 },
        actividadesRecientes: [],
        gastosRecientes: [],
        cosechasRecientes: [],
        insumosResumen: [
          { idInsumo: 1, nombre: 'Fertilizante A', tipoArticulo: 'FERTILIZANTE', categoria: 'FERTILIZANTE', cantidad: 100, precioUnitario: 25, unidad: 'KILOGRAMOS' }
        ],
        configuracion: { rol: 'PROPIETARIO', permisos: [], nombreMostrar: 'Test User', email: 'test@agronex.com' }
      })
    }));
    await page.route('**/api/notificaciones/no-leidas/count*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"count": 0}' }));
    await page.route('**/api/notificaciones*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"content": []}' }));
    await page.route('**/api/public/cotizaciones/granos*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/public/cotizaciones/pizarra-bcr*', async route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'CAC — BCR (Mock)',
        fecha: '2026-10-08',
        mercado: 'Rosario',
        moneda: 'ARS',
        cotizaciones: [],
        apiConfigured: true
      })
    }));

    // Mock other dashboard endpoints
    await page.route('**/api/campos*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/lotes*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/campanias*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/actividades*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/gastos*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/cosechas*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/usuarios/settings*', async route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ rol: 'PROPIETARIO', permisos: [], nombreMostrar: 'Test User', email: 'test@agronex.com' })
    }));
    await page.route('**/api/usuarios/me/check*', async route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"registrado": true}' }));
  });

  test('Dashboard Home loads data via React Query', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('text=1.500,5').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=3').first()).toBeVisible({ timeout: 10000 });
    expect(unexpectedApiRequests).toEqual([]);
  });

  test('Inventario mutation invalidates cache and updates UI', async ({ page }) => {
    let items = [
      { idInsumo: 1, nombre: 'Fertilizante A', tipoArticulo: 'FERTILIZANTE', categoria: 'FERTILIZANTE', cantidad: 100, precioUnitario: 25, unidad: 'KILOGRAMOS' }
    ];
    let getCallsCount = 0;
    let postCallsCount = 0;

    await page.route('**/api/insumos*', async (route) => {
      if (route.request().method() === 'GET') {
        getCallsCount += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(items)
        });
      } else if (route.request().method() === 'POST') {
        postCallsCount += 1;
        const body = route.request().postDataJSON();
        const created = {
          idInsumo: 2,
          nombre: body?.nombre || 'Fertilizante B',
          tipoArticulo: body?.tipoArticulo || 'FERTILIZANTE',
          categoria: 'FERTILIZANTE',
          cantidad: body?.cantidad ?? 50,
          precioUnitario: body?.precioUnitario ?? 100,
          unidad: body?.unidad || 'KILOGRAMOS'
        };
        items.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created)
        });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/dashboard/inventario');

    // Should see first item
    await expect(page.getByText('Fertilizante A', { exact: true })).toBeVisible({ timeout: 10000 });
    const initialGetCount = getCallsCount;
    expect(initialGetCount).toBeGreaterThanOrEqual(1);

    // Require the create button to be visible (no optional if-skip)
    const addButton = page.getByRole('button', { name: /registrar insumo|añadir/i }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Fill out form and submit
    await page.fill('input[name="nombre"]', 'Fertilizante B');
    await page.fill('input[name="precioUnitario"]', '100');
    await page.fill('input[name="cantidad"]', '50');

    const saveButton = page.getByRole('button', { name: /guardar en inventario|guardar|crear/i }).first();
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Verify POST happened, React Query invalidated and refetched GET, and new item is rendered
    await expect(page.getByText('Fertilizante B', { exact: true })).toBeVisible({ timeout: 10000 });
    expect(postCallsCount).toBe(1);
    expect(getCallsCount).toBeGreaterThan(initialGetCount);
    expect(unexpectedApiRequests).toEqual([]);
  });
});
