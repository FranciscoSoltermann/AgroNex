import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthPage from "@/app/login/page";

const pushMock = jest.fn();

jest.mock("@/components/shared/layout/Navbar", () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const signInWithPasswordMock = jest.fn();
const signInWithOAuthMock = jest.fn();
const signUpMock = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => signInWithPasswordMock(...args),
      signInWithOAuth: (...args) => signInWithOAuthMock(...args),
      signUp: (...args) => signUpMock(...args),
    },
  },
}));

const postMock = jest.fn();
const getMock = jest.fn();

jest.mock("@/lib/api-client", () => ({
  __esModule: true,
  default: {
    post: (...args) => postMock(...args),
    get: (...args) => getMock(...args),
  },
}));

describe("AuthPage - pruebas unitarias de comportamiento", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Given login form When render Then shows core accessible controls", () => {
    // Given / When
    render(<AuthPage />);

    // Then
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/contraseña/i)[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /acceder/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continuar con google/i })).toBeInTheDocument();
  });

  test("Given valid credentials When login submit Then redirects to dashboard", async () => {
    // Given
    signInWithPasswordMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AuthPage />);

    // When
    await user.type(screen.getByPlaceholderText(/e-mail/i), "  qa@agronex.com  ");
    await user.type(screen.getAllByPlaceholderText(/contraseña/i)[0], "secret");
    await user.click(screen.getByRole("button", { name: /acceder/i }));

    // Then
    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "qa@agronex.com",
        password: "secret",
      });
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("Given Supabase login error When submit Then renders user-facing error", async () => {
    // Given
    signInWithPasswordMock.mockResolvedValue({ error: { message: "Credenciales inválidas" } });
    const user = userEvent.setup();
    render(<AuthPage />);

    // When
    await user.type(screen.getByPlaceholderText(/e-mail/i), "qa@agronex.com");
    await user.type(screen.getAllByPlaceholderText(/contraseña/i)[0], "bad-pass");
    await user.click(screen.getByRole("button", { name: /acceder/i }));

    // Then
    expect(await screen.findByText(/credenciales inválidas/i)).toBeInTheDocument();
  });

  test("Given register FISICA happy path When submit Then validates availability and registers profile", async () => {
    // Given
    postMock.mockImplementation((url) => {
      if (url.includes("validar-disponibilidad")) return Promise.resolve({ data: { message: "ok" } });
      if (url.includes("registro/fisica")) return Promise.resolve({ data: { idUsuario: "u1" } });
      throw new Error("unexpected post");
    });
    getMock.mockResolvedValue({ data: { registrado: false } });
    signUpMock.mockResolvedValue({
      data: { session: { access_token: "token-123" } },
      error: null,
    });

    const user = userEvent.setup();
    render(<AuthPage />);

    // When
    await user.click(screen.getByRole("button", { name: /registrarse/i }));
    await user.type(screen.getByPlaceholderText(/^nombre$/i), "Ana");
    await user.type(screen.getByPlaceholderText(/^apellido$/i), "Perez");
    await user.type(screen.getByPlaceholderText(/^dni$/i), "12345678");
    const emailInputs = screen.getAllByPlaceholderText(/email/i);
    await user.type(emailInputs[emailInputs.length - 1], "ana@agronex.com");
    const passInputs = screen.getAllByPlaceholderText(/contraseña/i);
    await user.type(passInputs[passInputs.length - 1], "StrongPass123");
    await user.click(screen.getByRole("button", { name: /registrar cuenta/i }));

    // Then
    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith(
        "/public/auth/registro/validar-disponibilidad",
        expect.objectContaining({ email: "ana@agronex.com", dni: "12345678" })
      );
      expect(postMock).toHaveBeenCalledWith(
        "/public/auth/registro/fisica",
        expect.objectContaining({
          email: "ana@agronex.com",
          nombre: "Ana",
          apellido: "Perez",
          dni: "12345678",
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token-123" }),
        })
      );
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("Given 400 availability validation error When register submit Then displays backend message", async () => {
    // Given
    postMock.mockRejectedValue({
      response: { data: { message: "Algunos datos de registro ya están en uso." } },
    });

    const user = userEvent.setup();
    render(<AuthPage />);

    // When
    await user.click(screen.getByRole("button", { name: /registrarse/i }));
    await user.type(screen.getByPlaceholderText(/^nombre$/i), "Ana");
    await user.type(screen.getByPlaceholderText(/^apellido$/i), "Perez");
    await user.type(screen.getByPlaceholderText(/^dni$/i), "12345678");
    const emailInputs = screen.getAllByPlaceholderText(/email/i);
    await user.type(emailInputs[emailInputs.length - 1], "ana@agronex.com");
    const passInputs = screen.getAllByPlaceholderText(/contraseña/i);
    await user.type(passInputs[passInputs.length - 1], "StrongPass123");
    await user.click(screen.getByRole("button", { name: /registrar cuenta/i }));

    // Then
    expect(await screen.findByText(/algunos datos de registro ya están en uso/i)).toBeInTheDocument();
  });
});
