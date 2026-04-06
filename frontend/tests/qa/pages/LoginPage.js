class LoginPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/login");
  }

  async fillLogin({ email, password }) {
    await this.page.getByPlaceholder("E-mail").fill(email);
    await this.page.getByPlaceholder("Contraseña").first().fill(password);
  }

  async submitLogin() {
    await this.page.getByRole("button", { name: /acceder/i }).click();
  }

  async switchToRegister() {
    await this.page.getByRole("button", { name: /registrarse/i }).click();
  }

  async selectPersonaFisica() {
    await this.page.getByRole("button", { name: /individual/i }).click();
  }

  async fillRegisterFisica({ nombre, apellido, dni, email, password }) {
    await this.page.getByPlaceholder("Nombre").fill(nombre);
    await this.page.getByPlaceholder("Apellido").fill(apellido);
    await this.page.getByPlaceholder("DNI").fill(dni);
    await this.page.locator('input[placeholder="Email"]').fill(email);
    await this.page.locator('input[placeholder="Contraseña"]').nth(1).fill(password);
  }

  async submitRegister() {
    await this.page.getByRole("button", { name: /registrar cuenta/i }).click();
  }

  async expectError(messageRegex) {
    await this.page.getByText(messageRegex).waitFor();
  }
}

module.exports = { LoginPage };
