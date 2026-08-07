import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FooterMount from "@/components/shared/layout/FooterMount";
import { Toaster } from "sonner";
import ThemeProvider from "@/app/components/ThemeProvider";

import QueryProvider from "@/components/shared/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <ThemeProvider>
            <Toaster richColors position="top-right" />
            {children}
            <FooterMount />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
