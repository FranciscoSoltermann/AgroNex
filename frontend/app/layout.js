import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FooterMount from "@/components/layout/FooterMount";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AgroNex — Gestión Agrícola Digital",
  description:
    "Plataforma de gestión de campos, lotes y campañas para productores agropecuarios.",
  icons: {
    icon: "/agronex-logo.svg",
    shortcut: "/agronex-logo.svg",
    apple: "/agronex-logo.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster richColors position="top-right" />
        {children}
        <FooterMount />
      </body>
    </html>
  );
}
