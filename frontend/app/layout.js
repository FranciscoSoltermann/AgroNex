import "./globals.css";
import FooterMount from "@/components/shared/layout/FooterMount";
import { Toaster } from "sonner";
import ThemeProvider from "@/app/components/ThemeProvider";

import QueryProvider from "@/components/shared/QueryProvider";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

export const metadata = {
  title: "AgroNex",
  description:
    "Plataforma de gestión de campos, lotes y campañas para productores agropecuarios.",
  icons: {
    icon: "/agronex-logo.svg",
    shortcut: "/agronex-logo.svg",
    apple: "/agronex-logo.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <ThemeProvider>
            <Toaster richColors position="top-right" />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <FooterMount />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
