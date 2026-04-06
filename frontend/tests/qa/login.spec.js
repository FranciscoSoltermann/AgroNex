const { test, expect } = require("@playwright/test");
const { LoginPage } = require("./pages/LoginPage");

test.describe("Auth/Login critical flows", () => {
  test("happy path login redirects to dashboard", async ({ page }) => {
    // Given
    const login = new LoginPage(page);

    await page.route("**/auth/v1/token*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-access",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "fake-refresh",
          user: {
            id: "de305d54-75b4-431b-adb2-eb6b9e546014",
            email: "qa@agronex.com",
            aud: "authenticated",
            role: "authenticated",
          },
        }),
      });
    });

    // When
    await login.goto();
    await login.fillLogin({ email: "qa@agronex.com", password: "StrongPass123" });
    await login.submitLogin();

    // Then
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("happy path register fisica completes onboarding", async ({ page }) => {
    // Given
    const login = new LoginPage(page);

    await page.route("**/api/public/auth/registro/validar-disponibilidad", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Disponibilidad validada." }),
      });
    });

    await page.route("**/auth/v1/signup*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "fake-signup-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "fake-refresh",
          user: {
            id: "de305d54-75b4-431b-adb2-eb6b9e546014",
            email: "ana@agronex.com",
            aud: "authenticated",
            role: "authenticated",
          },
        }),
      });
    });

    await page.route("**/api/usuarios/me/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ registrado: false }),
      });
    });

    await page.route("**/api/public/auth/registro/fisica", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ idUsuario: "de305d54-75b4-431b-adb2-eb6b9e546014" }),
      });
    });

    // When
    await login.goto();
    await login.switchToRegister();
    await login.selectPersonaFisica();
    await login.fillRegisterFisica({
      nombre: "Ana",
      apellido: "Perez",
      dni: "12345678",
      email: "ana@agronex.com",
      password: "StrongPass123",
    });
    await login.submitRegister();

    // Then
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("edge case 400: duplicated data during register shows backend error", async ({ page }) => {
    // Given
    const login = new LoginPage(page);

    await page.route("**/api/public/auth/registro/validar-disponibilidad", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Algunos datos de registro ya están en uso." }),
      });
    });

    // When
    await login.goto();
    await login.switchToRegister();
    await login.selectPersonaFisica();
    await login.fillRegisterFisica({
      nombre: "Ana",
      apellido: "Perez",
      dni: "12345678",
      email: "ana@agronex.com",
      password: "StrongPass123",
    });
    await login.submitRegister();

    // Then
    await login.expectError(/algunos datos de registro ya están en uso/i);
  });
});
